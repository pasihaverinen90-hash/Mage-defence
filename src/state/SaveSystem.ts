import type { SaveData, UpgradeLevels } from '../types/game'

const SAVE_KEY = 'mage_arena_save'
const SAVE_VERSION = 1

function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    blueMana: 0,
    upgradeLevels: {
      spellPower: 0,
      maxHp: 0,
      castSpeed: 0,
      magicBarrier: 0,
      blueManaGain: 0,
    },
    highestWaveEver: 0,
    totalRuns: 0,
    totalBlueManaEarned: 0,
  }
}

export const SaveSystem = {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return defaultSave()
      const parsed = JSON.parse(raw) as SaveData
      if (parsed.version !== SAVE_VERSION) return defaultSave()
      return parsed
    } catch {
      return defaultSave()
    }
  },

  save(data: SaveData): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  },

  reset(): void {
    localStorage.removeItem(SAVE_KEY)
  },

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null
  },
}

export type { SaveData, UpgradeLevels }
