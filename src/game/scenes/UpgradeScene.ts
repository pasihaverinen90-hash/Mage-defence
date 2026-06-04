import Phaser from 'phaser'
import { gameState } from '../../state/GameState'
import { UpgradeSystem } from '../../systems/UpgradeSystem'
import { UPGRADES, UPGRADE_SECTIONS } from '../../data/upgrades'
const W = 800

export class UpgradeScene extends Phaser.Scene {
  private manaText!: Phaser.GameObjects.Text
  private statsText!: Phaser.GameObjects.Text
  private upgradeButtons: Map<string, Phaser.GameObjects.Text> = new Map()

  constructor() {
    super({ key: 'UpgradeScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a14')
    this.upgradeButtons.clear()

    // ── Header ─────────────────────────────────────────────
    this.add.text(W / 2, 28, '🔮 Mage Arena', {
      fontSize: '28px', color: '#a78bfa', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // ── Stats panel (left) ─────────────────────────────────
    this.drawPanel(20, 60, 250, 220)
    this.add.text(30, 70, 'STATS', { fontSize: '13px', color: '#a78bfa', fontFamily: 'monospace' })
    this.statsText = this.add.text(30, 92, '', { fontSize: '13px', color: '#e5e7eb', fontFamily: 'monospace', lineSpacing: 4 })

    // ── Progress panel (left, below stats) ─────────────────
    this.drawPanel(20, 295, 250, 120)
    this.add.text(30, 305, 'PROGRESS', { fontSize: '13px', color: '#a78bfa', fontFamily: 'monospace' })
    this.manaText = this.add.text(30, 327, '', { fontSize: '13px', color: '#e5e7eb', fontFamily: 'monospace', lineSpacing: 4 })

    // ── Upgrade panel (right) ──────────────────────────────
    this.drawPanel(285, 60, 495, 470)

    let y = 74
    UPGRADE_SECTIONS.forEach((section) => {
      this.add.text(300, y, section.label, {
        fontSize: '14px', color: '#a78bfa', fontFamily: 'monospace',
      })
      y += 20

      section.upgradeIds.forEach((id) => {
        const def = UPGRADES[id]
        this.drawPanel(295, y, 475, 38, '#1a1a2e')
        this.add.text(310, y + 4, `${def.emoji}  ${def.name}`, {
          fontSize: '13px', color: '#c4b5fd', fontFamily: 'monospace',
        })
        this.add.text(310, y + 21, def.description, {
          fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace',
        })

        const btn = this.add.text(760, y + 19, '', {
          fontSize: '13px', color: '#60a5fa', fontFamily: 'monospace',
          backgroundColor: '#1e1b4b', padding: { x: 10, y: 4 },
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })

        btn.on('pointerdown', () => {
          if (UpgradeSystem.buyUpgrade(def)) this.refreshUI()
        })
        btn.on('pointerover', () => btn.setAlpha(0.8))
        btn.on('pointerout', () => btn.setAlpha(1))

        this.upgradeButtons.set(id, btn)
        y += 42
      })
      y += 4
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
    const u = gameState.upgrades
    const castle = UpgradeSystem.resolveCastle(u.castle)
    const mage = UpgradeSystem.resolveFireMage(u.defenders.fireMage)

    this.statsText.setText([
      '🏰 Castle',
      `❤️  HP:      ${castle.maxHp}`,
      `🧱 Armor:   ${castle.armor}`,
      `🛡️  Shield:   ${castle.maxShield}`,
      `💚 Regen:   ${castle.regenPerSec}/s`,
      `⛏️ Spikes:  ${castle.spikeDamage > 0 ? castle.spikeDamage : '—'}`,
      '',
      '🧙 Fire Mage',
      `🔥 Damage:  ${mage.damage}`,
      `⚡ Cast:     ${mage.castInterval.toFixed(2)}s`,
    ])

    this.manaText.setText([
      `💧 Mana:    ${gameState.blueMana}`,
      `🏆 Best Wave: ${gameState.highestWaveEver}`,
      `🔄 Total Runs: ${gameState.totalRuns}`,
    ])

    UPGRADE_SECTIONS.forEach((section) => {
      section.upgradeIds.forEach((id) => {
        const def = UPGRADES[id]
        const level = gameState.getUpgradeLevel(def.category, def.field)
        const btn = this.upgradeButtons.get(id)
        if (!btn) return

        if (level >= def.maxLevel) {
          btn.setText(' MAX ')
          btn.setColor('#6b7280')
        } else {
          const cost = UpgradeSystem.getCost(def, level)
          const canAfford = gameState.blueMana >= cost
          btn.setText(` Lv${level} → ${cost}💧 `)
          btn.setColor(canAfford ? '#60a5fa' : '#6b7280')
        }
      })
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
