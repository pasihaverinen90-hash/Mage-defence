import type { SaveData, UpgradeLevels } from '../types/game'
import { SaveSystem } from './SaveSystem'

// Singleton holding current runtime state derived from save data.
class GameState {
  private _data: SaveData

  constructor() {
    this._data = SaveSystem.load()
  }

  get data(): SaveData {
    return this._data
  }

  get blueMana(): number {
    return this._data.blueMana
  }

  get upgradeLevels(): UpgradeLevels {
    return this._data.upgradeLevels
  }

  get highestWaveEver(): number {
    return this._data.highestWaveEver
  }

  get totalRuns(): number {
    return this._data.totalRuns
  }

  get totalBlueManaEarned(): number {
    return this._data.totalBlueManaEarned
  }

  spendMana(amount: number): void {
    this._data.blueMana -= amount
    this.persist()
  }

  addMana(amount: number): void {
    this._data.blueMana += amount
    this._data.totalBlueManaEarned += amount
    this.persist()
  }

  incrementUpgrade(id: keyof UpgradeLevels): void {
    this._data.upgradeLevels[id] += 1
    this.persist()
  }

  recordRunEnd(highestWave: number, blueManaEarned: number): void {
    this._data.totalRuns += 1
    if (highestWave > this._data.highestWaveEver) {
      this._data.highestWaveEver = highestWave
    }
    this.addMana(blueManaEarned)
  }

  reload(): void {
    this._data = SaveSystem.load()
  }

  reset(): void {
    SaveSystem.reset()
    this._data = SaveSystem.load()
  }

  private persist(): void {
    SaveSystem.save(this._data)
  }
}

export const gameState = new GameState()
