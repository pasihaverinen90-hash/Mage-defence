import type { SaveData, UpgradeState, UpgradeCategory, RecruitLoadout } from '../types/game'
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

  get upgrades(): UpgradeState {
    return this._data.upgrades
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

  getUpgradeLevel(category: UpgradeCategory, field: string): number {
    return this.levelsFor(category)[field] ?? 0
  }

  incrementUpgrade(category: UpgradeCategory, field: string): void {
    const levels = this.levelsFor(category)
    levels[field] = (levels[field] ?? 0) + 1
    this.persist()
  }

  get ownedRecruits(): string[] {
    return this._data.ownedRecruits
  }

  get loadout(): RecruitLoadout {
    return this._data.loadout
  }

  ownsRecruit(id: string): boolean {
    return this._data.ownedRecruits.includes(id)
  }

  addRecruit(id: string): void {
    if (!this._data.ownedRecruits.includes(id)) {
      this._data.ownedRecruits.push(id)
      this.persist()
    }
  }

  setLoadoutSlot(slot: 'north' | 'south', recruitId: string | null): void {
    this._data.loadout[slot] = recruitId
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

  // Route an upgrade category to its mutable level block in the save.
  private levelsFor(category: UpgradeCategory): Record<string, number> {
    const up = this._data.upgrades
    if (category === 'castle') return up.castle as unknown as Record<string, number>
    if (category === 'fireMage') return up.defenders.fireMage as unknown as Record<string, number>
    if (category === 'iceMage') return up.defenders.iceMage as unknown as Record<string, number>
    if (category === 'lightningMage') return up.defenders.lightningMage as unknown as Record<string, number>
    return up.global as unknown as Record<string, number>
  }

  private persist(): void {
    SaveSystem.save(this._data)
  }
}

export const gameState = new GameState()
