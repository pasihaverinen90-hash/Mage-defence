import Phaser from 'phaser'
import { gameState } from '../../state/GameState'
import { UpgradeSystem } from '../../systems/UpgradeSystem'
import { UPGRADES, UPGRADE_ORDER } from '../../data/upgrades'
const W = 800

export class UpgradeScene extends Phaser.Scene {
  private manaText!: Phaser.GameObjects.Text
  private statsText!: Phaser.GameObjects.Text
  private upgradeTexts: Map<string, Phaser.GameObjects.Text> = new Map()

  constructor() {
    super({ key: 'UpgradeScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a14')
    this.upgradeTexts.clear()

    // ── Header ─────────────────────────────────────────────
    this.add.text(W / 2, 28, '🔮 Mage Arena', {
      fontSize: '28px', color: '#a78bfa', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // ── Stats panel (left) ─────────────────────────────────
    this.drawPanel(20, 60, 250, 220)
    this.add.text(30, 70, 'MAGE STATS', { fontSize: '13px', color: '#a78bfa', fontFamily: 'monospace' })
    this.statsText = this.add.text(30, 90, '', { fontSize: '13px', color: '#e5e7eb', fontFamily: 'monospace', lineSpacing: 4 })

    // ── Progress panel (left, below stats) ─────────────────
    this.drawPanel(20, 295, 250, 120)
    this.add.text(30, 305, 'PROGRESS', { fontSize: '13px', color: '#a78bfa', fontFamily: 'monospace' })
    this.manaText = this.add.text(30, 325, '', { fontSize: '13px', color: '#e5e7eb', fontFamily: 'monospace', lineSpacing: 4 })

    // ── Upgrade panel (right) ──────────────────────────────
    this.drawPanel(285, 60, 495, 430)
    this.add.text(300, 70, 'UPGRADES', { fontSize: '13px', color: '#a78bfa', fontFamily: 'monospace' })

    UPGRADE_ORDER.forEach((id, i) => {
      const def = UPGRADES[id]
      const y = 100 + i * 76
      this.drawPanel(295, y, 475, 66, '#1a1a2e')
      this.add.text(310, y + 8, `${def.emoji}  ${def.name}`, {
        fontSize: '15px', color: '#c4b5fd', fontFamily: 'monospace',
      })
      this.add.text(310, y + 28, def.description, {
        fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace',
      })

      const btnText = this.add.text(700, y + 20, '', {
        fontSize: '13px', color: '#60a5fa', fontFamily: 'monospace',
        backgroundColor: '#1e1b4b', padding: { x: 10, y: 6 },
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })

      btnText.on('pointerdown', () => {
        if (UpgradeSystem.buyUpgrade(id)) {
          this.refreshUI()
        }
      })
      btnText.on('pointerover', () => btnText.setAlpha(0.8))
      btnText.on('pointerout', () => btnText.setAlpha(1))

      this.upgradeTexts.set(id, btnText)
    })

    // ── Start Run button ───────────────────────────────────
    const startBtn = this.add.text(W / 2, 560, '  ⚔  START RUN  ', {
      fontSize: '22px', color: '#a78bfa', fontFamily: 'monospace',
      backgroundColor: '#1e1b4b', padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    startBtn.on('pointerdown', () => this.scene.start('RunScene'))
    startBtn.on('pointerover', () => startBtn.setAlpha(0.8))
    startBtn.on('pointerout', () => startBtn.setAlpha(1))

    this.refreshUI()
  }

  private refreshUI() {
    const levels = gameState.upgradeLevels
    const stats = UpgradeSystem.computeMageStats(levels)

    this.statsText.setText([
      `🧙 Mage`,
      `❤️  HP:        ${stats.maxHp}`,
      `🔥 Damage:   ${stats.damage}`,
      `⚡ Cast:      ${stats.castInterval.toFixed(2)}s`,
      `🛡️  Barrier:   ${stats.damageReduction}`,
    ])

    this.manaText.setText([
      `💧 Mana:    ${gameState.blueMana}`,
      `🏆 Best Wave: ${gameState.highestWaveEver}`,
      `🔄 Total Runs: ${gameState.totalRuns}`,
    ])

    UPGRADE_ORDER.forEach((id) => {
      const level = (levels as unknown as Record<string, number>)[id]
      const def = UPGRADES[id]
      const btn = this.upgradeTexts.get(id)
      if (!btn) return

      if (level >= def.maxLevel) {
        btn.setText(' MAX ')
        btn.setColor('#6b7280')
      } else {
        const cost = UpgradeSystem.getCost(id, level)
        const canAfford = gameState.blueMana >= cost
        btn.setText(` Lv${level} → ${cost}💧 `)
        btn.setColor(canAfford ? '#60a5fa' : '#6b7280')
      }
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
