import Phaser from 'phaser'
import { SaveSystem } from '../../state/SaveSystem'
import { gameState } from '../../state/GameState'

const W = 800
const H = 600

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a14')
    const hasSave = SaveSystem.hasSave()

    // Title
    this.add.text(W / 2, 120, '🔮 MAGE ARENA', {
      fontSize: '48px',
      color: '#a78bfa',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(W / 2, 180, 'Idle Combat · Arcane Mastery', {
      fontSize: '16px',
      color: '#6b7280',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    // New Game button
    const newGameBtn = this.makeButton(W / 2, 300, '  ⚔  New Game  ', '#1e1b4b', '#a78bfa')
    newGameBtn.on('pointerdown', () => {
      if (hasSave) {
        // Confirm overwrite
        const confirm = this.makeButton(W / 2, 420, '  ⚠  Overwrite save? Click again  ', '#3b0764', '#f472b6')
        confirm.on('pointerdown', () => {
          gameState.reset()
          this.scene.start('UpgradeScene')
        })
      } else {
        this.scene.start('UpgradeScene')
      }
    })

    // Continue button
    if (hasSave) {
      const continueBtn = this.makeButton(W / 2, 370, '  ▶  Continue  ', '#1e1b4b', '#60a5fa')
      continueBtn.on('pointerdown', () => {
        gameState.reload()
        this.scene.start('UpgradeScene')
      })
    }

    // Reset Save (dev tool)
    const resetBtn = this.makeButton(W / 2, 540, '  🗑  Reset Save  ', '#1a0000', '#6b7280')
    resetBtn.on('pointerdown', () => {
      gameState.reset()
      this.scene.restart()
    })

    // Version
    this.add.text(W - 10, H - 10, 'v0.1.0', {
      fontSize: '11px',
      color: '#374151',
      fontFamily: 'monospace',
    }).setOrigin(1, 1)
  }

  private makeButton(x: number, y: number, label: string, bgColor: string, textColor: string) {
    const text = this.add.text(x, y, label, {
      fontSize: '22px',
      color: textColor,
      fontFamily: 'monospace',
      backgroundColor: bgColor,
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    text.on('pointerover', () => text.setAlpha(0.8))
    text.on('pointerout', () => text.setAlpha(1))
    return text
  }
}
