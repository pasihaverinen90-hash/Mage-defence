import Phaser from 'phaser'
import { gameState } from '../../state/GameState'
import { UpgradeSystem } from '../../systems/UpgradeSystem'
import { WaveSystem } from '../../systems/WaveSystem'
import { CombatSystem } from '../../systems/CombatSystem'
import { RewardSystem } from '../../systems/RewardSystem'
import { BALANCE } from '../../data/balance'
import { FIRE_MAGE, DEFENDER_SLOTS } from '../../data/defenders'
import { FIRE_MAGE_SKILLS, ICE_MAGE_SKILLS, LIGHTNING_MAGE_SKILLS, ARCHER_SKILLS, NECROMANCER_SKILLS } from '../../data/skills'
import { RECRUITS } from '../../data/recruits'
import type {
  CastleState, EnemyDefinition, RunEnemy, DefenderRuntimeState, DefenderDefinition,
  DefenderSlotId, DefenderBasicStats, Projectile, SkillRuntimeState, SkillDefinition,
  FieldEffect, Summon, SummonStats, UpgradeState, ChainLightningStats, PiercingShotStats, BlizzardStats,
} from '../../types/game'

const W = 800

const LANE_Y = BALANCE.arena.laneY
const SPAWN_X = BALANCE.arena.spawnX
const MELEE_X = BALANCE.arena.meleeX
const CASTLE_HIT_X = 130 // where enemy projectiles strike the wall
const FLOOR_TOP = 95
const FLOOR_BOTTOM = 325

interface RunState {
  castle: CastleState
  defenders: DefenderRuntimeState[]
  wave: number
  highestWaveThisRun: number
  killCount: number
  bossKills: number
  survivalTime: number // accumulated game-seconds (speed-scaled)
  spawnTimer: number
  waveTimer: number
  spikeTimer: number
  speed: number
  running: boolean
  finished: boolean
}

// Visual representation of one lane enemy.
interface EnemyView {
  container: Phaser.GameObjects.Container
  emoji: Phaser.GameObjects.Text
  hpFill: Phaser.GameObjects.Rectangle
  barWidth: number
}

// Visual representation of a summon (Fire Elemental).
interface SummonView {
  container: Phaser.GameObjects.Container
  hpFill: Phaser.GameObjects.Rectangle
  barWidth: number
}

export class RunScene extends Phaser.Scene {
  private run!: RunState
  private activeEnemies: RunEnemy[] = []
  private views: Map<string, EnemyView> = new Map()
  private nextEnemyId = 0
  private projectiles: Projectile[] = []
  private projectileViews: Map<string, Phaser.GameObjects.Text> = new Map()
  private nextProjectileId = 0
  private fieldEffects: FieldEffect[] = []
  private effectViews: Map<string, Phaser.GameObjects.Container> = new Map()
  private nextEffectId = 0
  private summons: Summon[] = []
  private summonViews: Map<string, SummonView> = new Map()
  private nextSummonId = 0
  // Battlefield-wide Blizzard (Ice Mage). At most one is active at a time.
  private blizzard = {
    active: false,
    remainingSec: 0,
    slowFactor: 1,
    tickDamage: 0,
    tickInterval: 0.5,
    tickTimer: 0,
  }
  private blizzardOverlay: Phaser.GameObjects.Rectangle | null = null
  private blizzardFlakes: Phaser.GameObjects.Text[] = []
  private skillButtonEntries: {
    btn: Phaser.GameObjects.Text
    defender: DefenderRuntimeState
    skill: SkillRuntimeState
    hotkey?: number // 1/2/3 for Fire Mage skills; undefined for auto recruit skills
  }[] = []
  private placementSkill: SkillRuntimeState | null = null
  private placementDefender: DefenderRuntimeState | null = null
  private placementGhost!: Phaser.GameObjects.Rectangle
  private placementGhostCircle!: Phaser.GameObjects.Arc
  private activeGhost: Phaser.GameObjects.Shape | null = null

  // UI refs
  private waveText!: Phaser.GameObjects.Text
  private killText!: Phaser.GameObjects.Text
  private bestText!: Phaser.GameObjects.Text
  private defenderSprites: Map<DefenderSlotId, Phaser.GameObjects.Text> = new Map()
  private castleWall!: Phaser.GameObjects.Rectangle
  private castleHpFill!: Phaser.GameObjects.Rectangle
  private castleShieldFill!: Phaser.GameObjects.Rectangle
  private castleShieldText!: Phaser.GameObjects.Text
  private castleHpText!: Phaser.GameObjects.Text
  private castleStatsText!: Phaser.GameObjects.Text
  private mageMpFill!: Phaser.GameObjects.Rectangle
  private mageMpText!: Phaser.GameObjects.Text
  private mageStatsText!: Phaser.GameObjects.Text
  private combatLog!: Phaser.GameObjects.Text
  private speedBtn!: Phaser.GameObjects.Text
  private logLines: string[] = []

  private readonly castleBarWidth = 220

  constructor() {
    super({ key: 'RunScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a14')
    this.logLines = []
    this.activeEnemies = []
    this.views.clear()
    this.nextEnemyId = 0
    this.projectiles = []
    this.projectileViews.clear()
    this.nextProjectileId = 0
    this.fieldEffects = []
    this.effectViews.clear()
    this.nextEffectId = 0
    this.summons = []
    this.summonViews.clear()
    this.nextSummonId = 0
    this.blizzard.active = false
    this.blizzardOverlay = null
    this.blizzardFlakes = []
    this.skillButtonEntries = []
    this.placementSkill = null
    this.placementDefender = null
    this.activeGhost = null
    this.defenderSprites.clear()

    const upgrades = gameState.upgrades
    const castleStats = UpgradeSystem.resolveCastle(upgrades.castle)

    this.run = {
      // Castle HP/armor/shield all reset to full from resolved upgrade stats.
      castle: {
        hp: castleStats.maxHp,
        maxHp: castleStats.maxHp,
        armor: castleStats.armor,
        shield: castleStats.maxShield,
        maxShield: castleStats.maxShield,
        regenPerSec: castleStats.regenPerSec,
        waveRepair: castleStats.waveRepair,
        spikeDamage: castleStats.spikeDamage,
      },
      defenders: this.buildDefenders(upgrades),
      wave: 1,
      highestWaveThisRun: 1,
      killCount: 0,
      bossKills: 0,
      survivalTime: 0,
      spawnTimer: BALANCE.spawn.initialDelaySeconds,
      waveTimer: BALANCE.wave.secondsPerWave,
      spikeTimer: BALANCE.castle.spikeIntervalSeconds,
      speed: 1,
      running: true,
      finished: false,
    }

    this.buildUI()
    this.setupSkillInput()
    this.announceWave()
  }

  // Hero (always centre) plus any owned recruit assigned to a tower slot.
  private buildDefenders(upgrades: UpgradeState): DefenderRuntimeState[] {
    const defenders: DefenderRuntimeState[] = [
      this.makeDefender('hero', FIRE_MAGE, UpgradeSystem.resolveFireMage(upgrades.defenders.fireMage), FIRE_MAGE_SKILLS),
    ]
    const towers: { slot: 'north' | 'south'; slotId: DefenderSlotId }[] = [
      { slot: 'north', slotId: 'towerNorth' },
      { slot: 'south', slotId: 'towerSouth' },
    ]
    for (const { slot, slotId } of towers) {
      const recruitId = gameState.loadout[slot]
      if (!recruitId || !gameState.ownsRecruit(recruitId) || !RECRUITS[recruitId]) continue
      const stats = this.resolveRecruitStats(recruitId, upgrades)
      if (stats) {
        defenders.push(this.makeDefender(slotId, RECRUITS[recruitId].definition, stats, this.recruitSkillDefs(recruitId)))
      }
    }
    return defenders
  }

  private resolveRecruitStats(recruitId: string, upgrades: UpgradeState): DefenderBasicStats | null {
    if (recruitId === 'iceMage') return UpgradeSystem.resolveIceMage(upgrades.defenders.iceMage)
    if (recruitId === 'lightningMage') return UpgradeSystem.resolveLightningMage(upgrades.defenders.lightningMage)
    if (recruitId === 'archer') return UpgradeSystem.resolveArcher(upgrades.defenders.archer)
    if (recruitId === 'necromancer') return UpgradeSystem.resolveNecromancer(upgrades.defenders.necromancer)
    return null
  }

  private recruitSkillDefs(recruitId: string): SkillDefinition[] {
    if (recruitId === 'iceMage') return ICE_MAGE_SKILLS
    if (recruitId === 'lightningMage') return LIGHTNING_MAGE_SKILLS
    if (recruitId === 'archer') return ARCHER_SKILLS
    if (recruitId === 'necromancer') return NECROMANCER_SKILLS
    return []
  }

  private makeDefender(
    slotId: DefenderSlotId,
    definition: DefenderDefinition,
    stats: DefenderBasicStats,
    skillDefs: SkillDefinition[],
  ): DefenderRuntimeState {
    const slot = DEFENDER_SLOTS[slotId]
    return {
      slotId,
      definition,
      x: slot.x,
      y: slot.y,
      basicDamage: stats.damage,
      basicInterval: stats.castInterval,
      attackTimer: stats.castInterval,
      mp: 0, // defined starting value — regenerates toward maxMp during the run
      maxMp: stats.maxMp,
      mpRegen: stats.mpRegen,
      skills: skillDefs.map((def) => ({ definition: def, cooldownTimer: 0 })),
    }
  }

  // ── Build static UI ──────────────────────────────────────
  private buildUI() {
    // Header
    this.drawPanel(0, 0, W, 50, '#0f0f1f')
    this.add.text(20, 14, '⚔ ARENA', {
      fontSize: '18px', color: '#a78bfa', fontFamily: 'monospace',
    })
    this.waveText = this.add.text(W / 2, 14, '', {
      fontSize: '18px', color: '#f9fafb', fontFamily: 'monospace',
    }).setOrigin(0.5, 0)

    // Controls strip
    this.drawPanel(0, 50, W, 40, '#0d0d18')
    this.killText = this.add.text(20, 62, '', {
      fontSize: '14px', color: '#9ca3af', fontFamily: 'monospace',
    })
    this.bestText = this.add.text(120, 62, '', {
      fontSize: '14px', color: '#6b7280', fontFamily: 'monospace',
    })

    this.speedBtn = this.add.text(560, 70, ' ⚡ x1 ', {
      fontSize: '15px', color: '#fbbf24', fontFamily: 'monospace',
      backgroundColor: '#1c1917', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    this.speedBtn.on('pointerdown', () => this.toggleSpeed())
    this.speedBtn.on('pointerover', () => this.speedBtn.setAlpha(0.8))
    this.speedBtn.on('pointerout', () => this.speedBtn.setAlpha(1))

    const endBtn = this.add.text(685, 70, ' 🏁 End Run ', {
      fontSize: '15px', color: '#f87171', fontFamily: 'monospace',
      backgroundColor: '#1a0000', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    endBtn.on('pointerdown', () => this.endRun('You ended the run.'))
    endBtn.on('pointerover', () => endBtn.setAlpha(0.8))
    endBtn.on('pointerout', () => endBtn.setAlpha(1))

    // Compact skill buttons for every defender's skills (up to 5: Fire Mage's 3
    // manual skills + two skilled recruits' auto skills). Fire Mage buttons are
    // clickable + hotkeyed (1/2/3); recruit buttons are auto-only status badges.
    let sx = 250
    for (const defender of this.run.defenders) {
      defender.skills.forEach((skill, i) => {
        const isHero = defender.slotId === 'hero'
        const btn = this.add.text(sx, 70, '', {
          fontSize: '11px', color: '#fbbf24', fontFamily: 'monospace',
          backgroundColor: '#2a1505', padding: { x: 4, y: 5 },
        }).setOrigin(0, 0.5)
        if (isHero) {
          btn.setInteractive({ useHandCursor: true })
          btn.on('pointerdown', () => this.onSkillButton(defender, skill))
        }
        this.skillButtonEntries.push({ btn, defender, skill, hotkey: isHero ? i + 1 : undefined })
        sx += 52
      })
    }

    // Translucent placement previews (rect for Fire Wall, circle for Firestorm).
    // High depth so they draw above the arena floor/wall/enemies (all added
    // later at the default depth, which would otherwise cover them).
    this.placementGhost = this.add.rectangle(0, LANE_Y, 46, 190, 0xf97316, 0.25)
      .setStrokeStyle(1, 0xfb923c).setDepth(50).setVisible(false)
    this.placementGhostCircle = this.add.circle(0, LANE_Y, 70, 0xf97316, 0.22)
      .setStrokeStyle(2, 0xfb923c).setDepth(50).setVisible(false)

    // Arena floor (the battlefield)
    this.drawPanel(20, FLOOR_TOP, 760, FLOOR_BOTTOM - FLOOR_TOP, '#0c1320')

    // ── Castle wall on the left ──────────────────────────
    const wallX = 20
    const wallW = 100
    const wallH = FLOOR_BOTTOM - FLOOR_TOP
    this.castleWall = this.add.rectangle(wallX, FLOOR_TOP, wallW, wallH, 0x2a2a40)
      .setOrigin(0, 0).setStrokeStyle(2, 0x4b5563)
    // Battlements (merlons) along the top of the wall
    for (let i = 0; i < 5; i++) {
      this.add.rectangle(wallX + 4 + i * 20, FLOOR_TOP - 8, 12, 12, 0x2a2a40)
        .setOrigin(0, 0).setStrokeStyle(1, 0x4b5563)
    }
    // Central gate behind the mage
    this.add.rectangle(wallX + wallW - 34, LANE_Y, 34, 64, 0x14141f)
      .setOrigin(0, 0.5).setStrokeStyle(1, 0x4b5563)

    // Front-line marker where enemies mass against the wall
    const marker = this.add.graphics()
    marker.lineStyle(1, 0x1f2937, 1)
    marker.lineBetween(MELEE_X + 20, FLOOR_TOP + 8, MELEE_X + 20, FLOOR_BOTTOM - 8)

    // Defenders on their wall slots; empty tower slots show a faint placeholder.
    const slotIds: DefenderSlotId[] = ['towerNorth', 'hero', 'towerSouth']
    for (const slotId of slotIds) {
      const slot = DEFENDER_SLOTS[slotId]
      const defender = this.run.defenders.find((d) => d.slotId === slotId)
      if (defender) {
        const sprite = this.add.text(slot.x, slot.y, defender.definition.emoji, {
          fontSize: slotId === 'hero' ? '46px' : '38px',
        }).setOrigin(0.5)
        this.defenderSprites.set(slotId, sprite)
      } else {
        this.add.rectangle(slot.x, slot.y, 34, 34, 0x000000, 0)
          .setStrokeStyle(1, 0x374151).setOrigin(0.5)
        this.add.text(slot.x, slot.y, '➕', { fontSize: '16px' }).setOrigin(0.5).setAlpha(0.3)
      }
    }

    // ── Castle status panel (bottom-left) ────────────────
    this.drawPanel(20, 335, 360, 250, '#111827')
    this.add.text(35, 348, '🏰 CASTLE', {
      fontSize: '15px', color: '#f87171', fontFamily: 'monospace',
    })
    // One bar: red Castle HP with the blue Magic Shield drawn on top of it.
    this.add.rectangle(35, 378, this.castleBarWidth, 16, 0x374151).setOrigin(0, 0)
    this.castleHpFill = this.add.rectangle(35, 378, this.castleBarWidth, 16, 0xef4444).setOrigin(0, 0)
    this.castleShieldFill = this.add.rectangle(35, 378, this.castleBarWidth, 16, 0x3b82f6).setOrigin(0, 0)
    this.castleShieldText = this.add.text(35, 400, '', {
      fontSize: '12px', color: '#60a5fa', fontFamily: 'monospace',
    })
    this.castleHpText = this.add.text(35, 418, '', {
      fontSize: '12px', color: '#f87171', fontFamily: 'monospace',
    })
    this.castleStatsText = this.add.text(35, 440, '', {
      fontSize: '13px', color: '#e5e7eb', fontFamily: 'monospace', lineSpacing: 4,
    })

    // ── Fire Mage subsection (MP bar lives with the hero) ─
    this.add.text(35, 502, '🧙 Fire Mage', {
      fontSize: '13px', color: '#a78bfa', fontFamily: 'monospace',
    })
    this.add.rectangle(35, 522, this.castleBarWidth, 12, 0x374151).setOrigin(0, 0)
    this.mageMpFill = this.add.rectangle(35, 522, this.castleBarWidth, 12, 0x22d3ee).setOrigin(0, 0)
    this.mageMpText = this.add.text(35 + this.castleBarWidth / 2, 528, '', {
      fontSize: '10px', color: '#083344', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.mageStatsText = this.add.text(35, 542, '', {
      fontSize: '12px', color: '#e5e7eb', fontFamily: 'monospace', lineSpacing: 3,
    })

    // ── Combat log panel (bottom-right) ──────────────────
    this.drawPanel(400, 335, 380, 250, '#0d1117')
    this.add.text(415, 348, 'COMBAT LOG', {
      fontSize: '11px', color: '#6b7280', fontFamily: 'monospace',
    })
    this.combatLog = this.add.text(415, 372, '', {
      fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', lineSpacing: 4,
    })

    this.updateCastleUI()
    this.updateDefenderUI()
    this.updateSkillButtons()
    this.killText.setText('Kills: 0')
    this.bestText.setText(`Best: ${gameState.highestWaveEver}`)
  }

  // ── Manual skills: input, placement, cooldowns ───────────
  private setupSkillInput() {
    this.input.mouse?.disableContextMenu()

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.placementSkill || !this.activeGhost) return
      const x = this.clampPlacementX(p.x)
      const y = this.isAreaSkill(this.placementSkill) ? this.clampPlacementY(p.y) : LANE_Y
      this.activeGhost.setPosition(x, y)
    })

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.placementSkill) return
      if (p.rightButtonDown()) {
        this.cancelPlacement()
        return
      }
      // Only a click on the battlefield places the skill (button strip is above).
      if (p.y >= FLOOR_TOP && p.y <= FLOOR_BOTTOM) {
        this.placeSkill(this.clampPlacementX(p.x), this.clampPlacementY(p.y))
      }
    })

    this.input.keyboard?.on('keydown-ESC', () => this.cancelPlacement())

    // Fire Mage manual-skill hotkeys (1/2/3) — same path as clicking the buttons.
    this.input.keyboard?.on('keydown-ONE', () => this.activateHeroSkill(0))
    this.input.keyboard?.on('keydown-TWO', () => this.activateHeroSkill(1))
    this.input.keyboard?.on('keydown-THREE', () => this.activateHeroSkill(2))
  }

  // Trigger a Fire Mage skill by hotkey index, reusing the click path exactly.
  private activateHeroSkill(index: number) {
    const hero = this.run.defenders[0]
    if (!hero || hero.slotId !== 'hero') return
    const skill = hero.skills[index]
    if (skill) this.onSkillButton(hero, skill)
  }

  private clampPlacementX(x: number): number {
    return Phaser.Math.Clamp(x, 165, 745)
  }

  private clampPlacementY(y: number): number {
    return Phaser.Math.Clamp(y, BALANCE.arena.laneTop + 30, BALANCE.arena.laneBottom - 10)
  }

  private isAreaSkill(skill: SkillRuntimeState): boolean {
    return skill.definition.effectKind !== 'fireWall' // firestorm + fire elemental take an x+y point
  }

  private onSkillButton(defender: DefenderRuntimeState, skill: SkillRuntimeState) {
    if (this.placementSkill === skill) {
      this.cancelPlacement()
      return
    }
    if (!this.skillReady(defender, skill)) return
    if (skill.definition.targeting === 'none') {
      this.castInstantSkill(defender, skill)
    } else {
      this.enterPlacement(defender, skill)
    }
  }

  private enterPlacement(defender: DefenderRuntimeState, skill: SkillRuntimeState) {
    // Hide both previews first so switching skills never leaves a stale ghost.
    this.placementGhost.setVisible(false)
    this.placementGhostCircle.setVisible(false)
    this.placementSkill = skill
    this.placementDefender = defender
    const levels = gameState.upgrades.defenders.fireMage
    const p = this.input.activePointer
    const kind = skill.definition.effectKind
    if (kind === 'fireWall') {
      const fw = UpgradeSystem.resolveFireWall(levels)
      this.placementGhost.setSize(fw.width, fw.height)
      this.placementGhost.setPosition(this.clampPlacementX(p.x), LANE_Y)
      this.placementGhost.setVisible(true)
      this.activeGhost = this.placementGhost
    } else {
      let radius: number
      if (kind === 'fireElemental') radius = UpgradeSystem.resolveFireElemental(levels).tauntRadius
      else if (kind === 'raiseSkeleton') radius = UpgradeSystem.resolveRaiseSkeleton(gameState.upgrades.defenders.necromancer).tauntRadius
      else radius = UpgradeSystem.resolveFirestorm(levels).radius
      this.placementGhostCircle.setRadius(radius)
      this.placementGhostCircle.setPosition(this.clampPlacementX(p.x), this.clampPlacementY(p.y))
      this.placementGhostCircle.setVisible(true)
      this.activeGhost = this.placementGhostCircle
    }
    this.updateSkillButtons()
    this.log(`${skill.definition.emoji} ${skill.definition.name} — click the battlefield (Esc / right-click cancels)`)
  }

  private cancelPlacement() {
    if (!this.placementSkill) return
    this.placementSkill = null
    this.placementDefender = null
    this.activeGhost = null
    this.placementGhost.setVisible(false)
    this.placementGhostCircle.setVisible(false)
    this.updateSkillButtons()
  }

  // Player placed a manual (Fire Mage) skill on the battlefield.
  private placeSkill(x: number, y: number) {
    const defender = this.placementDefender
    const skill = this.placementSkill
    if (!defender || !skill) return
    if (!this.skillReady(defender, skill)) {
      this.cancelPlacement()
      return
    }
    this.fireSkill(defender, skill, x, y)
    this.cancelPlacement()
    this.log(`${skill.definition.emoji} ${skill.definition.name} (-${skill.definition.mpCost} MP)`)
  }

  // Manual instant skill (button/hotkey) — fires on the closest enemy.
  private castInstantSkill(defender: DefenderRuntimeState, skill: SkillRuntimeState) {
    this.fireSkill(defender, skill, 0, 0)
  }

  private skillReady(defender: DefenderRuntimeState, skill: SkillRuntimeState): boolean {
    return skill.cooldownTimer <= 0 && defender.mp >= skill.definition.mpCost
  }

  // Single execution path shared by manual clicks, hotkeys and recruit auto-cast.
  // Spends MP + starts cooldown + applies the effect. (x,y used by placement
  // skills; instant skills aim at the closest enemy.) Returns false without
  // spending if an instant skill has no target.
  private fireSkill(defender: DefenderRuntimeState, skill: SkillRuntimeState, x: number, y: number): boolean {
    const def = skill.definition
    switch (def.effectKind) {
      case 'fireWall': skill.cooldownTimer = def.cooldownSec; this.spawnFireWall(x); break
      case 'firestorm': skill.cooldownTimer = def.cooldownSec; this.spawnFirestorm(x, y); break
      case 'fireElemental': skill.cooldownTimer = def.cooldownSec; this.spawnFireElemental(x, y); break
      case 'raiseSkeleton': skill.cooldownTimer = def.cooldownSec; this.spawnSkeleton(x, y); break
      case 'chainLightning': {
        const first = this.getClosestEnemy()
        if (!first) return false
        const cfg = UpgradeSystem.resolveChainLightning(gameState.upgrades.defenders.lightningMage)
        skill.cooldownTimer = cfg.cooldownSec
        this.applyChainLightning(defender, first, cfg)
        break
      }
      case 'piercingShot': {
        const first = this.getClosestEnemy()
        if (!first) return false
        const cfg = UpgradeSystem.resolvePiercingShot(gameState.upgrades.defenders.archer)
        skill.cooldownTimer = cfg.cooldownSec
        this.applyPiercingShot(defender, first, cfg)
        break
      }
      case 'blizzard': {
        const cfg = UpgradeSystem.resolveBlizzard(gameState.upgrades.defenders.iceMage)
        skill.cooldownTimer = cfg.cooldownSec
        this.startBlizzard(cfg)
        break
      }
      default:
        return false
    }
    defender.mp -= def.mpCost
    this.updateDefenderUI()
    this.updateSkillButtons()
    return true
  }

  // ── Recruit skill auto-cast (never the hero / Fire Mage) ─
  private tryAutoCastSkills(defender: DefenderRuntimeState) {
    for (const skill of defender.skills) {
      if (this.tryAutoCast(defender, skill)) break // at most one cast per defender per frame
    }
  }

  private tryAutoCast(defender: DefenderRuntimeState, skill: SkillRuntimeState): boolean {
    if (!this.skillReady(defender, skill)) return false
    const range = skill.definition.range ?? 700
    if (!this.enemyInRange(defender, range)) return false
    if (skill.definition.targeting === 'none') return this.fireSkill(defender, skill, 0, 0)
    const pos = this.autoSummonPosition() // placement recruit skill (Raise Skeleton)
    return this.fireSkill(defender, skill, pos.x, pos.y)
  }

  private enemyInRange(defender: DefenderRuntimeState, range: number): boolean {
    const r2 = range * range
    for (const e of this.activeEnemies) {
      const dx = e.x - defender.x
      const dy = e.y - defender.y
      if (dx * dx + dy * dy <= r2) return true
    }
    return false
  }

  // Drop summons on the front line (the closest enemy to the castle), clamped to
  // the battlefield so nothing spawns behind the wall or off-screen.
  private autoSummonPosition(): { x: number; y: number } {
    const front = this.getClosestEnemy()
    if (!front) return { x: MELEE_X + 60, y: LANE_Y }
    return { x: this.clampPlacementX(front.x), y: this.clampPlacementY(front.y) }
  }

  // Piercing Shot: a horizontal arrow that hits every enemy within a vertical
  // band around the target's Y, anywhere across the battlefield.
  private applyPiercingShot(defender: DefenderRuntimeState, target: RunEnemy, cfg: PiercingShotStats) {
    const half = cfg.width / 2
    const d = Math.max(1, Math.floor(cfg.damage))
    let hits = 0
    for (const e of [...this.activeEnemies]) {
      if (Math.abs(e.y - target.y) > half) continue
      e.hp = Math.max(0, e.hp - d)
      hits++
      if (e.hp <= 0) this.killEnemy(e)
      else {
        this.updateEnemyView(e)
        this.popEnemy(e)
      }
    }
    this.piercingShotVisual(defender, target.y)
    this.log(`🏹 Piercing Shot hits ${hits} for ${d}`)
  }

  private piercingShotVisual(defender: DefenderRuntimeState, y: number) {
    const line = this.add.line(0, 0, defender.x, y, SPAWN_X + 20, y, 0xfde68a)
      .setOrigin(0, 0).setLineWidth(2).setDepth(39)
    this.tweens.add({
      targets: line, alpha: { from: 0.8, to: 0 },
      duration: 280 / this.run.speed, onComplete: () => line.destroy(),
    })
    const arrow = this.add.text(defender.x + 22, y, '🏹', { fontSize: '22px' }).setOrigin(0.5).setDepth(40)
    this.tweens.add({
      targets: arrow, x: SPAWN_X + 20,
      duration: 260 / this.run.speed, ease: 'Linear', onComplete: () => arrow.destroy(),
    })
  }

  private applyChainLightning(defender: DefenderRuntimeState, first: RunEnemy, cfg: ChainLightningStats) {
    // Build the full chain first so kills mid-apply don't break jump targeting.
    const chain: RunEnemy[] = [first]
    let current = first
    for (let j = 0; j < cfg.jumps; j++) {
      const next = this.nearestEnemyExcluding(current, chain, cfg.jumpRadius)
      if (!next) break
      chain.push(next)
      current = next
    }

    let dmg = cfg.damage
    let prevX = defender.x
    let prevY = defender.y
    for (const e of chain) {
      const d = Math.max(1, Math.floor(dmg))
      e.hp = Math.max(0, e.hp - d)
      this.chainArcVisual(prevX, prevY, e.x, e.y)
      prevX = e.x
      prevY = e.y
      if (e.hp <= 0) this.killEnemy(e)
      else this.updateEnemyView(e)
      dmg *= cfg.falloff
    }
    this.log(`⚡ Chain Lightning hits ${chain.length}`)
  }

  private nearestEnemyExcluding(from: RunEnemy, exclude: RunEnemy[], radius: number): RunEnemy | null {
    let best: RunEnemy | null = null
    let bestD = radius * radius
    for (const e of this.activeEnemies) {
      if (exclude.includes(e)) continue
      const dx = e.x - from.x
      const dy = e.y - from.y
      const d = dx * dx + dy * dy
      if (d <= bestD) {
        best = e
        bestD = d
      }
    }
    return best
  }

  private chainArcVisual(x1: number, y1: number, x2: number, y2: number) {
    const line = this.add.line(0, 0, x1, y1, x2, y2, 0x93c5fd)
      .setOrigin(0, 0).setLineWidth(2).setDepth(40)
    this.tweens.add({
      targets: line, alpha: { from: 0.9, to: 0 },
      duration: 240 / this.run.speed, onComplete: () => line.destroy(),
    })
    const spark = this.add.text(x2, y2, '⚡', { fontSize: '20px' }).setOrigin(0.5).setDepth(40)
    this.tweens.add({
      targets: spark, alpha: { from: 1, to: 0 }, scale: { from: 1.3, to: 0.7 },
      duration: 260 / this.run.speed, onComplete: () => spark.destroy(),
    })
  }

  private updateSkillButtons() {
    for (const { btn, defender, skill, hotkey } of this.skillButtonEntries) {
      const def = skill.definition
      const hk = hotkey ? `${hotkey} ` : '' // Fire Mage hotkey hint
      const isRecruit = defender.slotId !== 'hero'
      if (skill.cooldownTimer > 0) {
        btn.setText(`${hk}${def.emoji}${Math.ceil(skill.cooldownTimer)}`)
        btn.setColor('#6b7280')
      } else if (defender.mp < def.mpCost) {
        btn.setText(`${hk}${def.emoji}${def.mpCost}`)
        btn.setColor('#6b7280')
      } else if (this.placementSkill === skill) {
        btn.setText(`${hk}${def.emoji}…`)
        btn.setColor('#fde68a')
      } else if (isRecruit) {
        btn.setText(`${def.emoji}⟳`) // auto-ready (recruit skills fire automatically)
        btn.setColor('#34d399')
      } else {
        btn.setText(`${hk}${def.emoji}${def.mpCost}`)
        btn.setColor('#fbbf24')
      }
    }
  }

  // ── Wave / spawn management ──────────────────────────────
  // Wave number is now just a scaling indicator that ticks up on a timer;
  // enemies spawn continuously rather than in discrete, cleared waves.
  private advanceWave() {
    this.run.wave++
    this.run.highestWaveThisRun = this.run.wave
    this.announceWave()
    this.applyWaveRepair()
    if (WaveSystem.isBossWave(this.run.wave)) {
      this.spawnEnemyOf(WaveSystem.getBossEnemy())
    }
  }

  // Heal a chunk of Castle HP each wave milestone (never overhealing).
  private applyWaveRepair() {
    const c = this.run.castle
    if (c.waveRepair <= 0 || c.hp <= 0 || c.hp >= c.maxHp) return
    const before = c.hp
    c.hp = Math.min(c.maxHp, c.hp + c.waveRepair)
    const healed = Math.round(c.hp - before)
    if (healed > 0) this.log(`🔧 Wave repair +${healed} HP`)
    this.updateCastleUI()
  }

  private announceWave() {
    const isBoss = WaveSystem.isBossWave(this.run.wave)
    this.waveText.setText(`Wave ${this.run.wave}${isBoss ? '  👹 BOSS' : ''}`)
    this.log(`── Wave ${this.run.wave}${isBoss ? ' [BOSS]' : ''} ──`)
  }

  private spawnEnemyOf(def: EnemyDefinition) {
    const id = `e${this.nextEnemyId++}`
    const y = Phaser.Math.Between(BALANCE.arena.laneTop, BALANCE.arena.laneBottom)
    const enemy = WaveSystem.createRunEnemy(def, this.run.wave, id, SPAWN_X, y)
    this.activeEnemies.push(enemy)
    this.addEnemyView(enemy)
  }

  // ── Main loop ────────────────────────────────────────────
  update(_time: number, delta: number) {
    if (!this.run.running || this.run.finished) return

    const dt = (delta / 1000) * this.run.speed
    this.run.survivalTime += dt

    this.updateWaveProgress(dt)
    this.updateSpawning(dt)
    this.updateRegen(dt)
    this.updateSpikes(dt)
    this.updateFieldEffects(dt)
    this.updateSummons(dt)
    this.updateDefenders(dt)
    this.updateBlizzard(dt)
    this.updateEnemies(dt)
    this.updateProjectiles(dt)
  }

  // Passive HP regen — restores Castle HP only, never the Magic Shield.
  private updateRegen(dt: number) {
    const c = this.run.castle
    if (c.regenPerSec <= 0 || c.hp <= 0 || c.hp >= c.maxHp) return
    c.hp = Math.min(c.maxHp, c.hp + c.regenPerSec * dt)
    this.updateCastleUI()
  }

  // Single castle-level spike timer that damages every melee enemy at the wall.
  private updateSpikes(dt: number) {
    const c = this.run.castle
    if (c.spikeDamage <= 0) return
    this.run.spikeTimer -= dt
    if (this.run.spikeTimer > 0) return
    this.run.spikeTimer = BALANCE.castle.spikeIntervalSeconds

    // Spikes only reach melee attackers pressed against the wall — ranged
    // enemies stand too far back to be hit.
    const atWall = this.activeEnemies.filter(
      (e) => e.attacking && e.definition.attackType === 'melee',
    )
    if (atWall.length === 0) return

    for (const enemy of atWall) {
      enemy.hp = Math.max(0, enemy.hp - c.spikeDamage)
      if (enemy.hp <= 0) {
        this.killEnemy(enemy)
      } else {
        this.updateEnemyView(enemy)
        this.popEnemy(enemy)
      }
    }
    this.log(`⛏️ Spikes hit ${atWall.length} for ${c.spikeDamage}`)
  }

  private updateWaveProgress(dt: number) {
    this.run.waveTimer -= dt
    if (this.run.waveTimer <= 0) {
      this.run.waveTimer += BALANCE.wave.secondsPerWave
      this.advanceWave()
    }
  }

  private updateSpawning(dt: number) {
    this.run.spawnTimer -= dt
    if (this.run.spawnTimer > 0) return
    this.run.spawnTimer = WaveSystem.getSpawnInterval(this.run.wave)
    // Soft cap keeps entity counts (and perf) bounded under heavy pressure.
    if (this.activeEnemies.length >= BALANCE.spawn.maxActive) return
    this.spawnEnemyOf(WaveSystem.pickEnemyForWave(this.run.wave))
  }

  // Tick every defender: regenerate MP and fire its automatic basic attack.
  // Structured as a loop so tower recruits drop in here later.
  private updateDefenders(dt: number) {
    for (const d of this.run.defenders) {
      if (d.mp < d.maxMp) d.mp = Math.min(d.maxMp, d.mp + d.mpRegen * dt)
      for (const skill of d.skills) {
        if (skill.cooldownTimer > 0) skill.cooldownTimer = Math.max(0, skill.cooldownTimer - dt)
      }
      this.updateDefenderBasicAttack(d, dt)
      // Recruits cast their skills automatically; the Fire Mage stays manual.
      if (d.slotId !== 'hero') this.tryAutoCastSkills(d)
    }
    this.updateDefenderUI()
    this.updateSkillButtons()
  }

  private updateDefenderBasicAttack(d: DefenderRuntimeState, dt: number) {
    d.attackTimer -= dt
    if (d.attackTimer > 0) return

    const target = this.getClosestEnemy()
    if (!target) {
      // Ready to attack but no target yet — hold at 0 until one appears.
      d.attackTimer = 0
      return
    }

    d.attackTimer = d.basicInterval
    const dmg = CombatSystem.basicAttackDamage(d) // basic attack, no MP cost
    target.hp = Math.max(0, target.hp - dmg)
    this.castBasicAttackVisual(d, target.x, target.y)
    this.updateEnemyView(target)
    this.popEnemy(target)
    if (d.definition.slowFactor !== undefined && d.definition.slowDurationSec !== undefined) {
      this.applySlow(target, d.definition.slowFactor, d.definition.slowDurationSec)
    }
    this.log(`${d.definition.basicAttackEmoji} ${dmg} → ${target.definition.name} (${target.hp}/${target.maxHp})`)

    if (target.hp <= 0) this.killEnemy(target)
  }

  // Record a per-hit slow (Ice Shard). Speed itself is recomputed each frame in
  // updateEnemies, so slows never compound and always restore cleanly.
  private applySlow(enemy: RunEnemy, factor: number, duration: number) {
    enemy.slowFactor = factor
    enemy.slowTimer = duration
  }

  private updateEnemies(dt: number) {
    const blizzardFactor = this.blizzard.active ? this.blizzard.slowFactor : 1
    for (const enemy of this.activeEnemies) {
      // Expire the per-hit slow, then recompute speed from baseSpeed using the
      // STRONGEST active slow (Ice Shard vs Blizzard) — no stacking, clean restore.
      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= dt
        if (enemy.slowTimer <= 0) {
          enemy.slowTimer = 0
          enemy.slowFactor = 1
        }
      }
      enemy.speed = enemy.baseSpeed * Math.min(enemy.slowFactor, blizzardFactor)

      // Taunt: a Fire Elemental in range pulls the enemy off the castle.
      const taunt = this.tauntTargetFor(enemy)
      if (taunt) {
        this.updateTauntedEnemy(enemy, taunt, dt)
        continue
      }

      if (!enemy.attacking) {
        enemy.x -= enemy.speed * dt
        if (enemy.x <= enemy.stopX) {
          enemy.x = enemy.stopX
          enemy.attacking = true
          enemy.attackTimer = enemy.attackInterval
        }
        const view = this.views.get(enemy.id)
        if (view) view.container.x = enemy.x
        continue
      }

      // Reached its stop position — attack the castle on its own timer.
      enemy.attackTimer -= dt
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.attackInterval
        if (enemy.definition.attackType === 'ranged') {
          this.fireEnemyProjectile(enemy)
        } else if (this.hitCastle(enemy.damage, enemy.definition.name)) {
          return // castle destroyed
        }
      }
    }
  }

  // Nearest living summon whose taunt radius contains the enemy (or null).
  private tauntTargetFor(enemy: RunEnemy): Summon | null {
    let best: Summon | null = null
    let bestDist = Infinity
    for (const s of this.summons) {
      const dx = s.x - enemy.x
      const dy = s.y - enemy.y
      const d = dx * dx + dy * dy
      if (d <= s.tauntRadius * s.tauntRadius && d < bestDist) {
        best = s
        bestDist = d
      }
    }
    return best
  }

  // Taunted enemies leave the wall, move onto the elemental, and attack it.
  private updateTauntedEnemy(enemy: RunEnemy, summon: Summon, dt: number) {
    enemy.attacking = false // no longer holding at the castle wall
    const dx = summon.x - enemy.x
    const dy = summon.y - enemy.y
    const dist = Math.hypot(dx, dy) || 1
    const attackRange = 44
    if (dist > attackRange) {
      const step = enemy.speed * dt
      enemy.x += (dx / dist) * step
      enemy.y += (dy / dist) * step
      this.syncEnemyView(enemy)
      return
    }
    enemy.attackTimer -= dt
    if (enemy.attackTimer <= 0) {
      enemy.attackTimer = enemy.attackInterval
      summon.hp = Math.max(0, summon.hp - enemy.damage)
      this.updateSummonView(summon)
    }
  }

  private syncEnemyView(enemy: RunEnemy) {
    const view = this.views.get(enemy.id)
    if (view) view.container.setPosition(enemy.x, enemy.y)
  }

  // ── Summons (Fire Elemental / Skeleton) ──────────────────
  private spawnFireElemental(x: number, y: number) {
    const fe = UpgradeSystem.resolveFireElemental(gameState.upgrades.defenders.fireMage)
    this.addSummon('fireElemental', '🌋', 0xea580c, x, y, fe)
  }

  private spawnSkeleton(x: number, y: number) {
    const s = UpgradeSystem.resolveRaiseSkeleton(gameState.upgrades.defenders.necromancer)
    this.addSummon('skeleton', '💀', 0x6b7280, x, y, s)
  }

  // Shared summon spawn/view — kind + emoji + body colour are the only differences.
  private addSummon(kind: Summon['kind'], emoji: string, color: number, x: number, y: number, stats: SummonStats) {
    const summon: Summon = {
      id: `s${this.nextSummonId++}`,
      kind,
      x, y,
      hp: stats.hp, maxHp: stats.hp,
      tauntRadius: stats.tauntRadius,
      aoeRadius: stats.aoeRadius,
      aoeDamage: stats.aoeDamage,
      aoeInterval: stats.aoeInterval,
      aoeTimer: stats.aoeInterval,
      remainingSec: stats.durationSec,
    }
    this.summons.push(summon)

    const aoeRing = this.add.circle(0, 0, summon.aoeRadius, color, 0.08).setStrokeStyle(1, 0x4b5563)
    const body = this.add.circle(0, 0, 22, color, 0.9).setStrokeStyle(2, 0xfdba74)
    const label = this.add.text(0, 0, emoji, { fontSize: '26px' }).setOrigin(0.5)
    const barBg = this.add.rectangle(0, -34, 44, 6, 0x374151).setOrigin(0.5)
    const barFill = this.add.rectangle(-22, -34, 44, 6, 0x22c55e).setOrigin(0, 0.5)
    const container = this.add.container(summon.x, summon.y, [aoeRing, body, label, barBg, barFill])
    this.summonViews.set(summon.id, { container, hpFill: barFill, barWidth: 44 })
  }

  private updateSummons(dt: number) {
    if (this.summons.length === 0) return

    const survivors: Summon[] = []
    for (const s of this.summons) {
      s.remainingSec -= dt
      s.aoeTimer -= dt
      if (s.aoeTimer <= 0) {
        s.aoeTimer = s.aoeInterval
        this.applyFireBash(s)
      }
      if (s.hp <= 0 || s.remainingSec <= 0) {
        this.destroySummonView(s.id)
      } else {
        survivors.push(s)
      }
    }
    this.summons = survivors
  }

  // AoE damage to every enemy around a summon (Fire Bash / skeleton swipe).
  private applyFireBash(summon: Summon) {
    let hits = 0
    for (const enemy of [...this.activeEnemies]) {
      const dx = enemy.x - summon.x
      const dy = enemy.y - summon.y
      if (dx * dx + dy * dy <= summon.aoeRadius * summon.aoeRadius) {
        enemy.hp = Math.max(0, enemy.hp - summon.aoeDamage)
        hits++
        if (enemy.hp <= 0) {
          this.killEnemy(enemy)
        } else {
          this.updateEnemyView(enemy)
          this.popEnemy(enemy)
        }
      }
    }
    if (hits > 0) {
      const label = summon.kind === 'skeleton' ? '💀 Skeleton' : '🌋 Fire Bash'
      this.log(`${label} hits ${hits} for ${summon.aoeDamage}`)
    }
  }

  private updateSummonView(summon: Summon) {
    const view = this.summonViews.get(summon.id)
    if (!view) return
    const pct = summon.maxHp > 0 ? Math.max(0, summon.hp / summon.maxHp) : 0
    view.hpFill.width = view.barWidth * pct
  }

  private destroySummonView(id: string) {
    const view = this.summonViews.get(id)
    if (view) {
      view.container.destroy()
      this.summonViews.delete(id)
    }
  }

  private clearSummons() {
    for (const view of this.summonViews.values()) view.container.destroy()
    this.summonViews.clear()
    this.summons = []
  }

  // ── Blizzard (Ice Mage, battlefield-wide) ────────────────
  private startBlizzard(cfg: BlizzardStats) {
    this.clearBlizzardVisuals() // refresh cleanly if one is somehow already active
    this.blizzard.active = true
    this.blizzard.remainingSec = cfg.durationSec
    this.blizzard.slowFactor = cfg.slowFactor
    this.blizzard.tickDamage = cfg.tickDamage
    this.blizzard.tickInterval = cfg.tickInterval
    this.blizzard.tickTimer = cfg.tickInterval

    // Subtle icy tint + falling snowflakes across the battlefield.
    this.blizzardOverlay = this.add
      .rectangle(20, FLOOR_TOP, 760, FLOOR_BOTTOM - FLOOR_TOP, 0xbfdbfe, 0.1)
      .setOrigin(0, 0).setDepth(45)
    for (let i = 0; i < 16; i++) {
      const flake = this.add.text(
        Phaser.Math.Between(30, 760),
        Phaser.Math.Between(FLOOR_TOP, FLOOR_BOTTOM),
        '❄️', { fontSize: '15px' },
      ).setOrigin(0.5).setAlpha(0.5).setDepth(46)
      this.blizzardFlakes.push(flake)
    }
    this.log('❄️ Blizzard sweeps the field!')
  }

  private updateBlizzard(dt: number) {
    if (!this.blizzard.active) return
    this.blizzard.remainingSec -= dt

    // Drift snowflakes downward (dt-scaled), wrapping to the top.
    for (const flake of this.blizzardFlakes) {
      flake.y += 90 * dt
      if (flake.y > FLOOR_BOTTOM) {
        flake.y = FLOOR_TOP
        flake.x = Phaser.Math.Between(30, 760)
      }
    }

    // Light damage-over-time (control skill — low damage).
    if (this.blizzard.tickDamage > 0) {
      this.blizzard.tickTimer -= dt
      if (this.blizzard.tickTimer <= 0) {
        this.blizzard.tickTimer = this.blizzard.tickInterval
        this.applyBlizzardTick()
      }
    }

    if (this.blizzard.remainingSec <= 0) this.endBlizzard()
  }

  private applyBlizzardTick() {
    const dmg = this.blizzard.tickDamage
    for (const enemy of [...this.activeEnemies]) {
      enemy.hp = Math.max(0, enemy.hp - dmg)
      if (enemy.hp <= 0) this.killEnemy(enemy)
      else this.updateEnemyView(enemy)
    }
  }

  private endBlizzard() {
    this.blizzard.active = false // enemy speeds restore via the recompute next frame
    this.clearBlizzardVisuals()
  }

  private clearBlizzardVisuals() {
    if (this.blizzardOverlay) {
      this.blizzardOverlay.destroy()
      this.blizzardOverlay = null
    }
    for (const flake of this.blizzardFlakes) flake.destroy()
    this.blizzardFlakes = []
  }

  // Centralised castle-hit handling shared by melee strikes and projectile
  // impacts: route damage, refresh UI/log, and report whether the run ended.
  private hitCastle(rawDamage: number, sourceName: string): boolean {
    const c = this.run.castle
    const dmg = CombatSystem.applyDamageToCastle(c, rawDamage)
    this.flashCastleHit()
    this.updateCastleUI()
    this.log(`⚔️ ${sourceName} hits the castle ${dmg} (🛡️${c.shield} ❤️${Math.round(c.hp)})`)
    if (c.hp <= 0) {
      this.endRun(`🏰 The castle has fallen on wave ${this.run.wave}!`)
      return true
    }
    return false
  }

  // ── Projectiles ──────────────────────────────────────────
  private fireEnemyProjectile(enemy: RunEnemy) {
    const def = enemy.definition
    const proj: Projectile = {
      id: `p${this.nextProjectileId++}`,
      x: enemy.x,
      y: enemy.y,
      targetX: CASTLE_HIT_X,
      targetY: enemy.y,
      speed: def.projectileSpeed ?? 260,
      damage: enemy.damage,
      source: 'enemy',
      targetKind: 'castle',
      emoji: def.projectileEmoji ?? '🔵',
    }
    this.projectiles.push(proj)
    const view = this.add.text(proj.x, proj.y, proj.emoji, { fontSize: '20px' }).setOrigin(0.5)
    this.projectileViews.set(proj.id, view)
  }

  private updateProjectiles(dt: number) {
    if (this.projectiles.length === 0) return

    const survivors: Projectile[] = []
    for (const p of this.projectiles) {
      const dx = p.targetX - p.x
      const dy = p.targetY - p.y
      const dist = Math.hypot(dx, dy)
      const step = p.speed * dt

      if (dist <= step || dist === 0) {
        // Impact: enemy projectiles hit the shared castle pool.
        this.destroyProjectileView(p.id)
        if (this.hitCastle(p.damage, `${p.emoji} bolt`)) {
          this.clearProjectiles() // run ended — drop the rest cleanly
          return
        }
        continue
      }

      p.x += (dx / dist) * step
      p.y += (dy / dist) * step
      const view = this.projectileViews.get(p.id)
      if (view) view.setPosition(p.x, p.y)
      survivors.push(p)
    }
    this.projectiles = survivors
  }

  private destroyProjectileView(id: string) {
    const view = this.projectileViews.get(id)
    if (view) {
      view.destroy()
      this.projectileViews.delete(id)
    }
  }

  private clearProjectiles() {
    for (const view of this.projectileViews.values()) view.destroy()
    this.projectileViews.clear()
    this.projectiles = []
  }

  // ── Field effects (Fire Wall rect / Firestorm circle) ────
  private spawnFireWall(x: number) {
    const fw = UpgradeSystem.resolveFireWall(gameState.upgrades.defenders.fireMage)
    this.addFieldEffect({
      id: `fx${this.nextEffectId++}`,
      kind: 'fireWall', shape: 'rect',
      x, y: LANE_Y,
      width: fw.width, height: fw.height, radius: 0,
      tickDamage: fw.tickDamage, tickInterval: fw.tickInterval,
      tickTimer: fw.tickInterval, remainingSec: fw.durationSec,
    })
  }

  private spawnFirestorm(x: number, y: number) {
    const fs = UpgradeSystem.resolveFirestorm(gameState.upgrades.defenders.fireMage)
    this.addFieldEffect({
      id: `fx${this.nextEffectId++}`,
      kind: 'firestorm', shape: 'circle',
      x, y,
      width: 0, height: 0, radius: fs.radius,
      tickDamage: fs.tickDamage, tickInterval: fs.tickInterval,
      tickTimer: fs.tickInterval, remainingSec: fs.durationSec,
    })
  }

  private addFieldEffect(effect: FieldEffect) {
    this.fieldEffects.push(effect)

    let zone: Phaser.GameObjects.Shape
    let label: Phaser.GameObjects.Text
    if (effect.shape === 'circle') {
      zone = this.add.circle(0, 0, effect.radius, 0xf97316, 0.3).setStrokeStyle(2, 0xfb923c)
      label = this.add.text(0, 0, '🌪️', { fontSize: '24px' }).setOrigin(0.5)
    } else {
      zone = this.add.rectangle(0, 0, effect.width, effect.height, 0xf97316, 0.35).setStrokeStyle(1, 0xfb923c)
      label = this.add.text(0, -effect.height / 2 + 2, '🔥', { fontSize: '20px' }).setOrigin(0.5)
    }
    const container = this.add.container(effect.x, effect.y, [zone, label])
    this.effectViews.set(effect.id, container)
    this.tweens.add({
      targets: zone, alpha: { from: 0.2, to: 0.42 },
      duration: 380, yoyo: true, repeat: -1,
    })
    if (effect.shape === 'circle') {
      this.tweens.add({ targets: label, angle: 360, duration: 1600, repeat: -1, ease: 'Linear' })
    }
  }

  private updateFieldEffects(dt: number) {
    if (this.fieldEffects.length === 0) return

    const survivors: FieldEffect[] = []
    for (const fx of this.fieldEffects) {
      fx.remainingSec -= dt
      fx.tickTimer -= dt
      if (fx.tickTimer <= 0) {
        fx.tickTimer = fx.tickInterval
        this.applyFieldEffectTick(fx)
      }
      if (fx.remainingSec <= 0) {
        this.destroyEffectView(fx.id)
      } else {
        survivors.push(fx)
      }
    }
    this.fieldEffects = survivors
  }

  // Damage every enemy currently inside the zone (never the castle/defenders).
  private applyFieldEffectTick(fx: FieldEffect) {
    let hits = 0
    for (const enemy of [...this.activeEnemies]) {
      if (!this.enemyInEffect(enemy, fx)) continue
      enemy.hp = Math.max(0, enemy.hp - fx.tickDamage)
      hits++
      if (enemy.hp <= 0) {
        this.killEnemy(enemy)
      } else {
        this.updateEnemyView(enemy)
        this.popEnemy(enemy)
      }
    }
    if (hits > 0) {
      const label = fx.kind === 'firestorm' ? '🌪️ Firestorm' : '🔥 Fire Wall'
      this.log(`${label} burns ${hits} for ${fx.tickDamage}`)
    }
  }

  private enemyInEffect(enemy: RunEnemy, fx: FieldEffect): boolean {
    if (fx.shape === 'circle') {
      const dx = enemy.x - fx.x
      const dy = enemy.y - fx.y
      return dx * dx + dy * dy <= fx.radius * fx.radius
    }
    const halfW = fx.width / 2
    return (
      enemy.x >= fx.x - halfW && enemy.x <= fx.x + halfW &&
      enemy.y >= fx.y - fx.height / 2 && enemy.y <= fx.y + fx.height / 2
    )
  }

  private destroyEffectView(id: string) {
    const view = this.effectViews.get(id)
    if (view) {
      view.destroy()
      this.effectViews.delete(id)
    }
  }

  private clearFieldEffects() {
    for (const view of this.effectViews.values()) view.destroy()
    this.effectViews.clear()
    this.fieldEffects = []
  }

  private getClosestEnemy(): RunEnemy | null {
    let closest: RunEnemy | null = null
    for (const e of this.activeEnemies) {
      if (!closest || e.x < closest.x) closest = e
    }
    return closest
  }

  private killEnemy(enemy: RunEnemy) {
    this.run.killCount++
    if (enemy.definition.isBoss) this.run.bossKills++
    this.killText.setText(`Kills: ${this.run.killCount}`)
    this.log(`💀 ${enemy.definition.name} defeated!`)

    const view = this.views.get(enemy.id)
    if (view) {
      view.container.destroy()
      this.views.delete(enemy.id)
    }
    this.activeEnemies = this.activeEnemies.filter((e) => e.id !== enemy.id)
  }

  // ── Enemy views ──────────────────────────────────────────
  private addEnemyView(enemy: RunEnemy) {
    const isBoss = enemy.definition.isBoss
    const size = isBoss ? 44 : 30
    const barW = isBoss ? 64 : 44
    const barY = -size / 2 - 10

    const emoji = this.add.text(0, 0, enemy.definition.emoji, {
      fontSize: `${size}px`,
    }).setOrigin(0.5)

    const hpBg = this.add.rectangle(0, barY, barW, 6, 0x374151).setOrigin(0.5, 0.5)
    const hpFill = this.add.rectangle(-barW / 2, barY, barW, 6, 0xef4444).setOrigin(0, 0.5)

    const container = this.add.container(enemy.x, enemy.y, [hpBg, hpFill, emoji])
    this.views.set(enemy.id, { container, emoji, hpFill, barWidth: barW })
  }

  private updateEnemyView(enemy: RunEnemy) {
    const view = this.views.get(enemy.id)
    if (!view) return
    const pct = enemy.maxHp > 0 ? Math.max(0, enemy.hp / enemy.maxHp) : 0
    view.hpFill.width = view.barWidth * pct
  }

  private popEnemy(enemy: RunEnemy) {
    const view = this.views.get(enemy.id)
    if (!view) return
    this.tweens.add({
      targets: view.emoji,
      scale: { from: 1.3, to: 1 },
      duration: 120,
      ease: 'Quad.easeOut',
    })
  }

  private castBasicAttackVisual(defender: DefenderRuntimeState, targetX: number, targetY: number) {
    const sprite = this.defenderSprites.get(defender.slotId)
    if (sprite) {
      this.tweens.add({
        targets: sprite,
        scale: { from: 1.15, to: 1 },
        duration: 120,
        ease: 'Quad.easeOut',
      })
    }
    const bolt = this.add.text(defender.x + 22, defender.y, defender.definition.basicAttackEmoji, {
      fontSize: '22px',
    }).setOrigin(0.5)
    this.tweens.add({
      targets: bolt,
      x: targetX,
      y: targetY,
      duration: 160 / this.run.speed,
      ease: 'Linear',
      onComplete: () => bolt.destroy(),
    })
  }

  // ── Castle UI ────────────────────────────────────────────
  private updateCastleUI() {
    const c = this.run.castle
    const hpPct = c.maxHp > 0 ? Math.max(0, c.hp / c.maxHp) : 0
    const shieldPct = c.maxShield > 0 ? Math.max(0, c.shield / c.maxShield) : 0
    this.castleHpFill.width = this.castleBarWidth * hpPct
    this.castleShieldFill.width = this.castleBarWidth * shieldPct
    this.castleShieldText.setText(`🛡️  Shield:  ${c.shield} / ${c.maxShield}`)
    this.castleHpText.setText(`❤️  HP:      ${Math.round(c.hp)} / ${c.maxHp}`)
    this.castleStatsText.setText([
      `🧱 Armor:    ${c.armor}`,
      `💚 Regen:    ${c.regenPerSec}/s`,
      `⛏️ Spikes:   ${c.spikeDamage > 0 ? `${c.spikeDamage}/${BALANCE.castle.spikeIntervalSeconds}s` : '—'}`,
    ])
  }

  // ── Defender (Fire Mage) UI: MP bar + basic-attack stats ──
  private updateDefenderUI() {
    const hero = this.run.defenders[0]
    if (!hero) return
    const mpPct = hero.maxMp > 0 ? Math.max(0, hero.mp / hero.maxMp) : 0
    this.mageMpFill.width = this.castleBarWidth * mpPct
    this.mageMpText.setText(`MP ${Math.floor(hero.mp)} / ${hero.maxMp}`)
    this.mageStatsText.setText([
      `🔥 Damage:   ${hero.basicDamage}`,
      `⚡ Cast:      ${hero.basicInterval.toFixed(2)}s`,
    ])
  }

  private flashCastleHit() {
    this.tweens.add({
      targets: this.castleWall,
      alpha: { from: 0.45, to: 1 },
      duration: 130,
      ease: 'Quad.easeOut',
    })
  }

  // ── End run ──────────────────────────────────────────────
  private endRun(reason: string) {
    if (this.run.finished) return
    this.run.running = false
    this.run.finished = true
    this.cancelPlacement()
    this.clearProjectiles()
    this.clearFieldEffects()
    this.clearSummons()
    this.endBlizzard()

    const reward = RewardSystem.calculateBlueMana(
      this.run.highestWaveThisRun,
      this.run.killCount,
      gameState.upgrades.global.blueManaGain,
    )
    gameState.recordRunEnd(this.run.highestWaveThisRun, reward)

    this.log(reason)
    this.log(`Earned ${reward} 💧 Blue Mana!`)

    // Result overlay
    this.drawPanel(150, 180, 500, 220, '#1e1b4b')
    this.add.text(W / 2, 215, reason, {
      fontSize: '18px', color: '#f9fafb', fontFamily: 'monospace', wordWrap: { width: 460 },
    }).setOrigin(0.5)
    this.add.text(W / 2, 265, `Wave ${this.run.highestWaveThisRun}   Kills ${this.run.killCount}   👹 ${this.run.bossKills}   ⏱ ${Math.floor(this.run.survivalTime)}s`, {
      fontSize: '15px', color: '#9ca3af', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.add.text(W / 2, 300, `+${reward} 💧 Blue Mana`, {
      fontSize: '20px', color: '#60a5fa', fontFamily: 'monospace',
    }).setOrigin(0.5)

    const returnBtn = this.add.text(W / 2, 350, '  Return to Upgrades  ', {
      fontSize: '18px', color: '#a78bfa', fontFamily: 'monospace',
      backgroundColor: '#111827', padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    returnBtn.on('pointerdown', () => this.scene.start('UpgradeScene'))
    returnBtn.on('pointerover', () => returnBtn.setAlpha(0.8))
    returnBtn.on('pointerout', () => returnBtn.setAlpha(1))
  }

  // ── Helpers ──────────────────────────────────────────────
  private log(line: string) {
    this.logLines.push(line)
    if (this.logLines.length > 6) this.logLines.shift()
    this.combatLog.setText(this.logLines)
  }

  private toggleSpeed() {
    this.run.speed = this.run.speed === 1 ? 2 : this.run.speed === 2 ? 5 : 1
    this.speedBtn.setText(` ⚡ x${this.run.speed} `)
  }

  private drawPanel(x: number, y: number, w: number, h: number, color = '#111827') {
    const gfx = this.add.graphics()
    gfx.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1)
    gfx.fillRoundedRect(x, y, w, h, 6)
    gfx.lineStyle(1, 0x374151, 1)
    gfx.strokeRoundedRect(x, y, w, h, 6)
  }
}
