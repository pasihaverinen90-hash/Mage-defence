import Phaser from 'phaser'
import { gameState } from '../../state/GameState'
import { UpgradeSystem } from '../../systems/UpgradeSystem'
import { WaveSystem } from '../../systems/WaveSystem'
import { CombatSystem } from '../../systems/CombatSystem'
import { RewardSystem } from '../../systems/RewardSystem'
import type { MageStats, EnemyInstance } from '../../types/game'

const W = 800

interface RunState {
  mageHp: number
  mageStats: MageStats
  wave: number
  killCount: number
  enemyQueue: EnemyInstance[]
  currentEnemy: EnemyInstance | null
  mageAttackTimer: number
  enemyAttackTimer: number
  speed: number
  running: boolean
  finished: boolean
}

export class RunScene extends Phaser.Scene {
  private run!: RunState

  // UI refs
  private waveText!: Phaser.GameObjects.Text
  private killText!: Phaser.GameObjects.Text
  private mageHpBar!: Phaser.GameObjects.Graphics
  private enemyHpBar!: Phaser.GameObjects.Graphics
  private mageHpText!: Phaser.GameObjects.Text
  private enemyHpText!: Phaser.GameObjects.Text
  private mageCard!: Phaser.GameObjects.Text
  private enemyCard!: Phaser.GameObjects.Text
  private enemyNameText!: Phaser.GameObjects.Text
  private combatLog!: Phaser.GameObjects.Text
  private speedBtn!: Phaser.GameObjects.Text
  private logLines: string[] = []
  private flashGfx!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'RunScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a14')
    this.logLines = []

    const stats = UpgradeSystem.computeMageStats(gameState.upgradeLevels)

    this.run = {
      mageHp: stats.maxHp,
      mageStats: stats,
      wave: 1,
      killCount: 0,
      enemyQueue: [],
      currentEnemy: null,
      mageAttackTimer: 0,
      enemyAttackTimer: 0,
      speed: 1,
      running: true,
      finished: false,
    }

    this.buildUI()
    this.startWave(1)
  }

  // ── Build static UI ──────────────────────────────────────
  private buildUI() {
    // Header bar
    this.drawPanel(0, 0, W, 50, '#0f0f1f')
    this.add.text(20, 14, '⚔ ARENA RUN', {
      fontSize: '18px', color: '#a78bfa', fontFamily: 'monospace',
    })
    this.waveText = this.add.text(W / 2, 14, '', {
      fontSize: '18px', color: '#f9fafb', fontFamily: 'monospace',
    }).setOrigin(0.5, 0)
    this.killText = this.add.text(W - 20, 14, '', {
      fontSize: '14px', color: '#9ca3af', fontFamily: 'monospace',
    }).setOrigin(1, 0)

    // ── Mage card ────────────────────────────────────────
    this.drawPanel(30, 70, 200, 220, '#111827')
    this.add.text(40, 80, '🧙 MAGE', {
      fontSize: '14px', color: '#a78bfa', fontFamily: 'monospace',
    })
    this.mageCard = this.add.text(40, 102, '', {
      fontSize: '12px', color: '#e5e7eb', fontFamily: 'monospace', lineSpacing: 4,
    })

    // Mage HP bar background
    const mageBarBg = this.add.graphics()
    mageBarBg.fillStyle(0x374151, 1)
    mageBarBg.fillRoundedRect(40, 220, 180, 14, 4)

    this.mageHpBar = this.add.graphics()
    this.mageHpText = this.add.text(130, 220, '', {
      fontSize: '10px', color: '#f9fafb', fontFamily: 'monospace',
    }).setOrigin(0.5, 0)

    // ── Enemy card ───────────────────────────────────────
    this.drawPanel(570, 70, 200, 220, '#111827')
    this.enemyNameText = this.add.text(580, 80, '', {
      fontSize: '14px', color: '#f87171', fontFamily: 'monospace',
    })
    this.enemyCard = this.add.text(580, 102, '', {
      fontSize: '12px', color: '#e5e7eb', fontFamily: 'monospace', lineSpacing: 4,
    })

    const enemyBarBg = this.add.graphics()
    enemyBarBg.fillStyle(0x374151, 1)
    enemyBarBg.fillRoundedRect(580, 220, 180, 14, 4)

    this.enemyHpBar = this.add.graphics()
    this.enemyHpText = this.add.text(670, 220, '', {
      fontSize: '10px', color: '#f9fafb', fontFamily: 'monospace',
    }).setOrigin(0.5, 0)

    // ── VS divider ───────────────────────────────────────
    this.add.text(W / 2, 170, 'VS', {
      fontSize: '28px', color: '#4b5563', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // ── Combat log panel ─────────────────────────────────
    this.drawPanel(30, 310, 540, 180, '#0d1117')
    this.add.text(40, 318, 'COMBAT LOG', {
      fontSize: '11px', color: '#6b7280', fontFamily: 'monospace',
    })
    this.combatLog = this.add.text(40, 334, '', {
      fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', lineSpacing: 3,
    })

    // ── Speed button ─────────────────────────────────────
    this.speedBtn = this.add.text(680, 350, ' ⚡ x1 ', {
      fontSize: '15px', color: '#fbbf24', fontFamily: 'monospace',
      backgroundColor: '#1c1917', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    this.speedBtn.on('pointerdown', () => this.toggleSpeed())
    this.speedBtn.on('pointerover', () => this.speedBtn.setAlpha(0.8))
    this.speedBtn.on('pointerout', () => this.speedBtn.setAlpha(1))

    // ── End Run button ───────────────────────────────────
    const endBtn = this.add.text(680, 430, ' 🏁 End Run ', {
      fontSize: '15px', color: '#f87171', fontFamily: 'monospace',
      backgroundColor: '#1a0000', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    endBtn.on('pointerdown', () => this.endRun('You ended the run.'))
    endBtn.on('pointerover', () => endBtn.setAlpha(0.8))
    endBtn.on('pointerout', () => endBtn.setAlpha(1))

    // Flash overlay for hits
    this.flashGfx = this.add.graphics()
    this.flashGfx.setAlpha(0)

    this.updateMageCard()
  }

  // ── Wave management ──────────────────────────────────────
  private startWave(wave: number) {
    this.run.wave = wave
    this.run.enemyQueue = WaveSystem.getEnemiesForWave(wave)
    this.run.currentEnemy = null
    this.run.mageAttackTimer = this.run.mageStats.castInterval
    this.run.enemyAttackTimer = 0

    const isBoss = WaveSystem.isBossWave(wave)
    this.waveText.setText(`Wave ${wave}${isBoss ? ' 👹 BOSS' : ''}`)
    this.log(`── Wave ${wave} begins${isBoss ? ' [BOSS WAVE]' : ''} ──`)

    this.spawnNextEnemy()
  }

  private spawnNextEnemy() {
    if (this.run.enemyQueue.length === 0) {
      // Wave cleared — advance
      this.log(`✓ Wave ${this.run.wave} cleared!`)
      this.time.delayedCall(400 / this.run.speed, () => {
        if (this.run.running) this.startWave(this.run.wave + 1)
      })
      return
    }
    this.run.currentEnemy = this.run.enemyQueue.shift()!
    this.run.enemyAttackTimer = this.run.currentEnemy.attackInterval
    this.log(`👹 ${this.run.currentEnemy.definition.name} appears! (HP: ${this.run.currentEnemy.hp})`)
    this.updateEnemyCard()
  }

  // ── Phaser update loop ───────────────────────────────────
  update(_time: number, delta: number) {
    if (!this.run.running || this.run.finished) return

    const dt = (delta / 1000) * this.run.speed
    const enemy = this.run.currentEnemy
    if (!enemy) return

    // Mage attacks
    this.run.mageAttackTimer -= dt
    if (this.run.mageAttackTimer <= 0) {
      this.run.mageAttackTimer = this.run.mageStats.castInterval
      const dmg = CombatSystem.mageAttack(this.run.mageStats)
      enemy.hp = Math.max(0, enemy.hp - dmg)
      this.log(`🔥 Firebolt hits ${enemy.definition.name} for ${dmg} dmg (HP: ${enemy.hp}/${enemy.maxHp})`)
      this.flashHit(true)
      this.updateEnemyCard()

      if (enemy.hp <= 0) {
        this.run.killCount++
        this.killText.setText(`Kills: ${this.run.killCount}`)
        this.log(`💀 ${enemy.definition.name} defeated!`)
        this.run.currentEnemy = null
        this.time.delayedCall(250 / this.run.speed, () => {
          if (this.run.running) this.spawnNextEnemy()
        })
        return
      }
    }

    // Enemy attacks
    this.run.enemyAttackTimer -= dt
    if (this.run.enemyAttackTimer <= 0) {
      this.run.enemyAttackTimer = enemy.attackInterval
      const dmg = CombatSystem.enemyAttack(enemy, this.run.mageStats.damageReduction)
      this.run.mageHp = Math.max(0, this.run.mageHp - dmg)
      this.log(`⚔️  ${enemy.definition.name} hits you for ${dmg} dmg (HP: ${this.run.mageHp}/${this.run.mageStats.maxHp})`)
      this.flashHit(false)
      this.updateMageCard()

      if (this.run.mageHp <= 0) {
        this.endRun(`💀 You were slain on wave ${this.run.wave}!`)
      }
    }
  }

  // ── End run ──────────────────────────────────────────────
  private endRun(reason: string) {
    if (this.run.finished) return
    this.run.running = false
    this.run.finished = true

    const reward = RewardSystem.calculateBlueMana(this.run.wave, gameState.upgradeLevels)
    gameState.recordRunEnd(this.run.wave, reward)

    this.log(reason)
    this.log(`Earned ${reward} 💧 Blue Mana!`)

    // Show result overlay
    this.drawPanel(150, 180, 500, 200, '#1e1b4b')
    this.add.text(W / 2, 210, reason, {
      fontSize: '18px', color: '#f9fafb', fontFamily: 'monospace', wordWrap: { width: 460 },
    }).setOrigin(0.5)
    this.add.text(W / 2, 265, `Wave reached: ${this.run.wave}   Kills: ${this.run.killCount}`, {
      fontSize: '15px', color: '#9ca3af', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.add.text(W / 2, 300, `+${reward} 💧 Blue Mana earned`, {
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

  // ── UI helpers ───────────────────────────────────────────
  private updateMageCard() {
    const s = this.run.mageStats
    this.mageCard.setText([
      `HP:     ${this.run.mageHp}/${s.maxHp}`,
      `Dmg:    ${s.damage}`,
      `Cast:   ${s.castInterval.toFixed(2)}s`,
      `Barrier: ${s.damageReduction}`,
    ])
    this.drawHpBar(this.mageHpBar, 40, 220, 180, this.run.mageHp, s.maxHp, 0x22c55e)
    this.mageHpText.setText(`${this.run.mageHp}/${s.maxHp}`)
  }

  private updateEnemyCard() {
    const e = this.run.currentEnemy
    if (!e) {
      this.enemyNameText.setText('')
      this.enemyCard.setText('Waiting...')
      this.drawHpBar(this.enemyHpBar, 580, 220, 180, 0, 1, 0xef4444)
      this.enemyHpText.setText('')
      return
    }
    this.enemyNameText.setText(`${e.definition.emoji} ${e.definition.name}`)
    this.enemyCard.setText([
      `HP:     ${e.hp}/${e.maxHp}`,
      `Dmg:    ${e.damage}`,
      `Attack: ${e.attackInterval.toFixed(1)}s`,
    ])
    this.drawHpBar(this.enemyHpBar, 580, 220, 180, e.hp, e.maxHp, 0xef4444)
    this.enemyHpText.setText(`${e.hp}/${e.maxHp}`)
  }

  private drawHpBar(gfx: Phaser.GameObjects.Graphics, x: number, y: number, w: number, hp: number, maxHp: number, color: number) {
    gfx.clear()
    const pct = maxHp > 0 ? Math.max(0, hp / maxHp) : 0
    gfx.fillStyle(color, 1)
    gfx.fillRoundedRect(x, y, Math.floor(w * pct), 14, 4)
  }

  private log(line: string) {
    this.logLines.push(line)
    if (this.logLines.length > 8) this.logLines.shift()
    this.combatLog.setText(this.logLines)
  }

  private toggleSpeed() {
    this.run.speed = this.run.speed === 1 ? 2 : 1
    this.speedBtn.setText(` ⚡ x${this.run.speed} `)
  }

  private flashHit(enemyHit: boolean) {
    const x = enemyHit ? 570 : 30
    this.flashGfx.clear()
    this.flashGfx.fillStyle(enemyHit ? 0xff4444 : 0x4444ff, 0.25)
    this.flashGfx.fillRect(x, 70, 200, 220)
    this.flashGfx.setAlpha(1)
    this.tweens.add({
      targets: this.flashGfx,
      alpha: 0,
      duration: 200,
      ease: 'Linear',
    })
  }

  private drawPanel(x: number, y: number, w: number, h: number, color = '#111827') {
    const gfx = this.add.graphics()
    gfx.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1)
    gfx.fillRoundedRect(x, y, w, h, 6)
    gfx.lineStyle(1, 0x374151, 1)
    gfx.strokeRoundedRect(x, y, w, h, 6)
  }
}
