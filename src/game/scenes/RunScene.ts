import Phaser from 'phaser'
import { gameState } from '../../state/GameState'
import { UpgradeSystem } from '../../systems/UpgradeSystem'
import { WaveSystem } from '../../systems/WaveSystem'
import { CombatSystem } from '../../systems/CombatSystem'
import { RewardSystem } from '../../systems/RewardSystem'
import { BALANCE } from '../../data/balance'
import type { MageStats, CastleState, EnemyDefinition, RunEnemy } from '../../types/game'

const W = 800

const MAGE_X = BALANCE.arena.mageX
const LANE_Y = BALANCE.arena.laneY
const SPAWN_X = BALANCE.arena.spawnX
const MELEE_X = BALANCE.arena.meleeX
const FLOOR_TOP = 95
const FLOOR_BOTTOM = 325

interface RunState {
  castle: CastleState
  mageStats: MageStats
  wave: number
  killCount: number
  enemiesToSpawn: EnemyDefinition[]
  spawnTimer: number
  mageAttackTimer: number
  speed: number
  running: boolean
  finished: boolean
  betweenWaves: boolean
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

    const stats = UpgradeSystem.computeMageStats(gameState.upgradeLevels)

    this.run = {
      // Derive castle stats from existing upgrades (no save migration yet):
      // maxHp upgrade → castle Max HP, magicBarrier upgrade → castle armor.
      // Magic Shield starts full from a temporary flat balance value.
      castle: {
        hp: stats.maxHp,
        maxHp: stats.maxHp,
        armor: stats.damageReduction,
        shield: BALANCE.castle.baseShield,
        maxShield: BALANCE.castle.baseShield,
      },
      mageStats: stats,
      wave: 1,
      killCount: 0,
      enemiesToSpawn: [],
      spawnTimer: 0,
      mageAttackTimer: stats.castInterval,
      speed: 1,
      running: true,
      finished: false,
      betweenWaves: false,
    }

    this.buildUI()
    this.startWave(1)
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

    // Fire Mage defending the central gate
    this.mageSprite = this.add.text(MAGE_X, LANE_Y, '🧙', {
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
    this.castleStatsText = this.add.text(35, 446, '', {
      fontSize: '13px', color: '#e5e7eb', fontFamily: 'monospace', lineSpacing: 5,
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
    this.killText.setText('Kills: 0')
    this.bestText.setText(`Best: ${gameState.highestWaveEver}`)
  }

  // ── Wave / spawn management ──────────────────────────────
  private startWave(wave: number) {
    this.run.wave = wave
    this.run.betweenWaves = false
    this.run.enemiesToSpawn = WaveSystem.getSpawnPlanForWave(wave)
    this.run.spawnTimer = BALANCE.spawn.initialDelaySeconds

    const isBoss = WaveSystem.isBossWave(wave)
    this.waveText.setText(`Wave ${wave}${isBoss ? '  👹 BOSS' : ''}`)
    this.log(`── Wave ${wave}${isBoss ? ' [BOSS]' : ''} ──`)
  }

  private spawnNextEnemy() {
    const def = this.run.enemiesToSpawn.shift()
    if (!def) return

    const id = `e${this.nextEnemyId++}`
    const jitter = BALANCE.arena.laneJitter
    const y = LANE_Y + Phaser.Math.Between(-jitter, jitter)
    const enemy = WaveSystem.createRunEnemy(def, this.run.wave, id, SPAWN_X, y)

    this.activeEnemies.push(enemy)
    this.addEnemyView(enemy)
  }

  // ── Main loop ────────────────────────────────────────────
  update(_time: number, delta: number) {
    if (!this.run.running || this.run.finished) return

    const dt = (delta / 1000) * this.run.speed

    this.updateSpawning(dt)
    this.updateMageCasting(dt)
    this.updateEnemies(dt)
    this.checkWaveComplete()
  }

  private updateSpawning(dt: number) {
    if (this.run.enemiesToSpawn.length === 0) return
    this.run.spawnTimer -= dt
    if (this.run.spawnTimer <= 0) {
      this.spawnNextEnemy()
      this.run.spawnTimer = BALANCE.spawn.intervalSeconds
    }
  }

  private updateMageCasting(dt: number) {
    this.run.mageAttackTimer -= dt
    if (this.run.mageAttackTimer > 0) return

    const target = this.getClosestEnemy()
    if (!target) {
      // Ready to cast but no target yet — hold at 0 until one appears.
      this.run.mageAttackTimer = 0
      return
    }

    this.run.mageAttackTimer = this.run.mageStats.castInterval
    const dmg = CombatSystem.mageAttack(this.run.mageStats)
    target.hp = Math.max(0, target.hp - dmg)
    this.castFireboltVisual(target.x, target.y)
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
        this.log(`⚔️ ${enemy.definition.name} hits the castle ${dmg} (🛡️${c.shield} ❤️${c.hp})`)

        if (c.hp <= 0) {
          this.endRun(`🏰 The castle has fallen on wave ${this.run.wave}!`)
          return
        }
      }
    }
  }

  private checkWaveComplete() {
    if (this.run.betweenWaves) return
    if (this.run.enemiesToSpawn.length > 0) return
    if (this.activeEnemies.length > 0) return

    this.run.betweenWaves = true
    this.log(`✓ Wave ${this.run.wave} cleared!`)
    this.time.delayedCall(BALANCE.spawn.interWaveSeconds * 1000 / this.run.speed, () => {
      if (this.run.running) this.startWave(this.run.wave + 1)
    })
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

  private castFireboltVisual(targetX: number, targetY: number) {
    this.tweens.add({
      targets: this.mageSprite,
      scale: { from: 1.15, to: 1 },
      duration: 120,
      ease: 'Quad.easeOut',
    })
    const bolt = this.add.text(MAGE_X + 22, LANE_Y, '🔥', {
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
    const s = this.run.mageStats
    const hpPct = c.maxHp > 0 ? Math.max(0, c.hp / c.maxHp) : 0
    const shieldPct = c.maxShield > 0 ? Math.max(0, c.shield / c.maxShield) : 0
    this.castleHpFill.width = this.castleBarWidth * hpPct
    this.castleShieldFill.width = this.castleBarWidth * shieldPct
    this.castleShieldText.setText(`🛡️  Shield:  ${c.shield} / ${c.maxShield}`)
    this.castleHpText.setText(`❤️  HP:      ${c.hp} / ${c.maxHp}`)
    this.castleStatsText.setText([
      `🧱 Armor:    ${c.armor}`,
      ``,
      `🧙 Fire Mage`,
      `🔥 Damage:   ${s.damage}`,
      `⚡ Cast:      ${s.castInterval.toFixed(2)}s`,
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

    const reward = RewardSystem.calculateBlueMana(this.run.wave, this.run.killCount, gameState.upgradeLevels)
    gameState.recordRunEnd(this.run.wave, reward)

    this.log(reason)
    this.log(`Earned ${reward} 💧 Blue Mana!`)

    // Result overlay
    this.drawPanel(150, 180, 500, 220, '#1e1b4b')
    this.add.text(W / 2, 215, reason, {
      fontSize: '18px', color: '#f9fafb', fontFamily: 'monospace', wordWrap: { width: 460 },
    }).setOrigin(0.5)
    this.add.text(W / 2, 265, `Wave reached: ${this.run.wave}    Kills: ${this.run.killCount}`, {
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
