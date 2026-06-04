import Phaser from 'phaser'
import { gameState } from '../../state/GameState'
import { UpgradeSystem } from '../../systems/UpgradeSystem'
import { WaveSystem } from '../../systems/WaveSystem'
import { CombatSystem } from '../../systems/CombatSystem'
import { RewardSystem } from '../../systems/RewardSystem'
import { BALANCE } from '../../data/balance'
import { FIRE_MAGE, DEFENDER_SLOTS } from '../../data/defenders'
import type { CastleState, EnemyDefinition, RunEnemy, DefenderRuntimeState } from '../../types/game'

const W = 800

const LANE_Y = BALANCE.arena.laneY
const SPAWN_X = BALANCE.arena.spawnX
const MELEE_X = BALANCE.arena.meleeX
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

export class RunScene extends Phaser.Scene {
  private run!: RunState
  private activeEnemies: RunEnemy[] = []
  private views: Map<string, EnemyView> = new Map()
  private nextEnemyId = 0

  // UI refs
  private waveText!: Phaser.GameObjects.Text
  private killText!: Phaser.GameObjects.Text
  private bestText!: Phaser.GameObjects.Text
  private mageSprite!: Phaser.GameObjects.Text
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

    const upgrades = gameState.upgrades
    const castleStats = UpgradeSystem.resolveCastle(upgrades.castle)
    const mageStats = UpgradeSystem.resolveFireMage(upgrades.defenders.fireMage)

    // The Fire Mage hero occupies the centre (gate) slot. Tower slots stay
    // empty for now — recruits arrive in a later slice.
    const heroSlot = DEFENDER_SLOTS.hero
    const hero: DefenderRuntimeState = {
      slotId: heroSlot.id,
      definition: FIRE_MAGE,
      x: heroSlot.x,
      y: heroSlot.y,
      basicDamage: mageStats.damage,
      basicInterval: mageStats.castInterval,
      attackTimer: mageStats.castInterval,
      mp: 0, // defined starting value — regenerates toward maxMp during the run
      maxMp: mageStats.maxMp,
      mpRegen: mageStats.mpRegen,
    }

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
      defenders: [hero],
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
    this.announceWave()
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
    this.bestText = this.add.text(200, 62, '', {
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

    // Empty tower slots (future recruit positions) shown as faint placeholders
    for (const slot of [DEFENDER_SLOTS.towerNorth, DEFENDER_SLOTS.towerSouth]) {
      this.add.rectangle(slot.x, slot.y, 34, 34, 0x000000, 0)
        .setStrokeStyle(1, 0x374151).setOrigin(0.5)
      this.add.text(slot.x, slot.y, '➕', { fontSize: '16px' }).setOrigin(0.5).setAlpha(0.3)
    }

    // Fire Mage hero defending the central gate
    const hero = this.run.defenders[0]
    this.mageSprite = this.add.text(hero.x, hero.y, FIRE_MAGE.emoji, {
      fontSize: '46px',
    }).setOrigin(0.5)

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
    this.killText.setText('Kills: 0')
    this.bestText.setText(`Best: ${gameState.highestWaveEver}`)
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
    this.updateDefenders(dt)
    this.updateEnemies(dt)
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

    const atWall = this.activeEnemies.filter((e) => e.hasReachedMage)
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
      this.updateDefenderBasicAttack(d, dt)
    }
    this.updateDefenderUI()
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
    const dmg = CombatSystem.basicAttackDamage(d) // Fireball, no MP cost
    target.hp = Math.max(0, target.hp - dmg)
    this.castFireboltVisual(d.x, d.y, target.x, target.y)
    this.updateEnemyView(target)
    this.popEnemy(target)
    this.log(`🔥 ${dmg} → ${target.definition.name} (${target.hp}/${target.maxHp})`)

    if (target.hp <= 0) this.killEnemy(target)
  }

  private updateEnemies(dt: number) {
    for (const enemy of this.activeEnemies) {
      if (!enemy.hasReachedMage) {
        enemy.x -= enemy.speed * dt
        if (enemy.x <= MELEE_X) {
          enemy.x = MELEE_X
          enemy.hasReachedMage = true
          enemy.attackTimer = enemy.attackInterval
        }
        const view = this.views.get(enemy.id)
        if (view) view.container.x = enemy.x
        continue
      }

      // At the wall — attack the castle on its own timer
      enemy.attackTimer -= dt
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.attackInterval
        const c = this.run.castle
        const dmg = CombatSystem.applyDamageToCastle(c, enemy.damage)
        this.flashCastleHit()
        this.updateCastleUI()
        this.log(`⚔️ ${enemy.definition.name} hits the castle ${dmg} (🛡️${c.shield} ❤️${Math.round(c.hp)})`)

        if (c.hp <= 0) {
          this.endRun(`🏰 The castle has fallen on wave ${this.run.wave}!`)
          return
        }
      }
    }
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

  private castFireboltVisual(originX: number, originY: number, targetX: number, targetY: number) {
    this.tweens.add({
      targets: this.mageSprite,
      scale: { from: 1.15, to: 1 },
      duration: 120,
      ease: 'Quad.easeOut',
    })
    const bolt = this.add.text(originX + 22, originY, '🔥', {
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
