import Phaser from 'phaser'
import { MainMenuScene } from './game/scenes/MainMenuScene'
import { UpgradeScene } from './game/scenes/UpgradeScene'
import { RunScene } from './game/scenes/RunScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#0a0a14',
  scene: [MainMenuScene, UpgradeScene, RunScene],
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

new Phaser.Game(config)
