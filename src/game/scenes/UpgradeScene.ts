import Phaser from 'phaser'
import { gameState } from '../../state/GameState'
import { UpgradeSystem } from '../../systems/UpgradeSystem'
import { RecruitSystem } from '../../systems/RecruitSystem'
import { UPGRADES, UPGRADE_SECTIONS } from '../../data/upgrades'
import { RECRUITS } from '../../data/recruits'
const W = 800

export class UpgradeScene extends Phaser.Scene {
  private manaText!: Phaser.GameObjects.Text
  private statsText!: Phaser.GameObjects.Text
  private upgradeButtons: Map<string, Phaser.GameObjects.Text> = new Map()
  private assignButtons: Map<string, Phaser.GameObjects.Text> = new Map()

  constructor() {
    super({ key: 'UpgradeScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a14')
    this.upgradeButtons.clear()
    this.assignButtons.clear()

    // ── Header ─────────────────────────────────────────────
    this.add.text(W / 2, 28, '🔮 Mage Arena', {
      fontSize: '28px', color: '#a78bfa', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // ── Stats panel (left) ─────────────────────────────────
    this.drawPanel(20, 60, 250, 220)
    this.add.text(30, 70, 'STATS', { fontSize: '13px', color: '#a78bfa', fontFamily: 'monospace' })
    this.statsText = this.add.text(30, 88, '', { fontSize: '12px', color: '#e5e7eb', fontFamily: 'monospace', lineSpacing: 3 })

    // ── Progress panel (left, below stats) ─────────────────
    this.drawPanel(20, 295, 250, 120)
    this.add.text(30, 305, 'PROGRESS', { fontSize: '13px', color: '#a78bfa', fontFamily: 'monospace' })
    this.manaText = this.add.text(30, 327, '', { fontSize: '13px', color: '#e5e7eb', fontFamily: 'monospace', lineSpacing: 4 })

    // ── Recruits panel (left, below progress) ──────────────
    this.drawPanel(20, 425, 250, 130)
    this.add.text(30, 433, 'RECRUITS', { fontSize: '13px', color: '#a78bfa', fontFamily: 'monospace' })
    this.buildRecruitRow('iceMage', 456)

    // ── Upgrade panel (right) ──────────────────────────────
    this.drawPanel(285, 60, 495, 425)
    const sections = UPGRADE_SECTIONS.filter(
      (s) => !s.requiresRecruit || gameState.ownsRecruit(s.requiresRecruit),
    )

    let y = 68
    sections.forEach((section) => {
      this.add.text(300, y, section.label, {
        fontSize: '13px', color: '#a78bfa', fontFamily: 'monospace',
      })
      y += 18

      section.upgradeIds.forEach((id) => {
        const def = UPGRADES[id]
        this.drawPanel(295, y, 475, 20, '#1a1a2e')
        this.add.text(308, y + 4, `${def.emoji}  ${def.name}`, {
          fontSize: '12px', color: '#c4b5fd', fontFamily: 'monospace',
        })

        const btn = this.add.text(762, y + 10, '', {
          fontSize: '12px', color: '#60a5fa', fontFamily: 'monospace',
          backgroundColor: '#1e1b4b', padding: { x: 8, y: 2 },
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })

        btn.on('pointerdown', () => {
          if (UpgradeSystem.buyUpgrade(def)) this.refreshUI()
        })
        btn.on('pointerover', () => btn.setAlpha(0.8))
        btn.on('pointerout', () => btn.setAlpha(1))

        this.upgradeButtons.set(id, btn)
        y += 22
      })
      y += 2
    })

    // ── Start Run button ───────────────────────────────────
    const startBtn = this.add.text(W / 2, 575, '  ⚔  START RUN  ', {
      fontSize: '22px', color: '#a78bfa', fontFamily: 'monospace',
      backgroundColor: '#1e1b4b', padding: { x: 24, y: 11 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    startBtn.on('pointerdown', () => this.scene.start('RunScene'))
    startBtn.on('pointerover', () => startBtn.setAlpha(0.8))
    startBtn.on('pointerout', () => startBtn.setAlpha(1))

    this.refreshUI()
    this.refreshRecruits()
  }

  // One recruit row: a Buy button when locked, or North/South/Off when owned.
  private buildRecruitRow(id: string, y: number) {
    const info = RECRUITS[id]
    this.add.text(30, y, `${info.definition.emoji}  ${info.definition.name}`, {
      fontSize: '13px', color: '#c4b5fd', fontFamily: 'monospace',
    })

    if (!gameState.ownsRecruit(id)) {
      const buy = this.add.text(30, y + 24, ` Buy ${info.cost}💧 `, {
        fontSize: '12px', color: '#60a5fa', fontFamily: 'monospace',
        backgroundColor: '#1e1b4b', padding: { x: 8, y: 4 },
      }).setOrigin(0, 0).setInteractive({ useHandCursor: true })
      if (!RecruitSystem.canBuy(id)) buy.setColor('#6b7280')
      buy.on('pointerdown', () => {
        if (RecruitSystem.buy(id)) this.scene.restart()
      })
      return
    }

    this.makeAssignButton('North', 'north', id, 30, y + 24)
    this.makeAssignButton('South', 'south', id, 110, y + 24)
    const off = this.add.text(192, y + 24, ' Off ', {
      fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace',
      backgroundColor: '#1c1917', padding: { x: 8, y: 4 },
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true })
    off.on('pointerdown', () => {
      RecruitSystem.unassign(id)
      this.refreshRecruits()
    })
  }

  private makeAssignButton(label: string, slot: 'north' | 'south', id: string, x: number, y: number) {
    const btn = this.add.text(x, y, ` ${label} `, {
      fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace',
      backgroundColor: '#1e1b4b', padding: { x: 6, y: 4 },
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true })
    btn.on('pointerdown', () => {
      RecruitSystem.assign(slot, id)
      this.refreshRecruits()
    })
    this.assignButtons.set(slot, btn)
  }

  private refreshRecruits() {
    const north = gameState.loadout.north
    const south = gameState.loadout.south
    this.assignButtons.get('north')?.setColor(north === 'iceMage' ? '#34d399' : '#9ca3af')
    this.assignButtons.get('south')?.setColor(south === 'iceMage' ? '#34d399' : '#9ca3af')
  }

  private refreshUI() {
    const u = gameState.upgrades
    const castle = UpgradeSystem.resolveCastle(u.castle)
    const mage = UpgradeSystem.resolveFireMage(u.defenders.fireMage)

    this.statsText.setText([
      '🏰 Castle',
      `❤️  HP      ${castle.maxHp}`,
      `🧱 Armor   ${castle.armor}`,
      `🛡️  Shield  ${castle.maxShield}`,
      `💚 Regen   ${castle.regenPerSec}/s`,
      `⛏️ Spikes  ${castle.spikeDamage > 0 ? castle.spikeDamage : '—'}`,
      '🧙 Fire Mage',
      `🔥 Damage  ${mage.damage}`,
      `⚡ Cast    ${mage.castInterval.toFixed(2)}s`,
      `🔷 Max MP  ${mage.maxMp}`,
      `🌀 MP/s    ${mage.mpRegen}`,
    ])

    this.manaText.setText([
      `💧 Mana:    ${gameState.blueMana}`,
      `🏆 Best Wave: ${gameState.highestWaveEver}`,
      `🔄 Total Runs: ${gameState.totalRuns}`,
    ])

    this.upgradeButtons.forEach((btn, id) => {
      const def = UPGRADES[id]
      const level = gameState.getUpgradeLevel(def.category, def.field)
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
  }

  private drawPanel(x: number, y: number, w: number, h: number, color = '#111827') {
    const gfx = this.add.graphics()
    gfx.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1)
    gfx.fillRoundedRect(x, y, w, h, 6)
    gfx.lineStyle(1, 0x374151, 1)
    gfx.strokeRoundedRect(x, y, w, h, 6)
  }
}
