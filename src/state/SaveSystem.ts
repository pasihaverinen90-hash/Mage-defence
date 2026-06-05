import type { SaveData } from '../types/game'

const SAVE_KEY = 'mage_arena_save'
const SAVE_VERSION = 2

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    blueMana: 0,
    highestWaveEver: 0,
    totalRuns: 0,
    totalBlueManaEarned: 0,
    upgrades: {
      castle: { maxHp: 0, armor: 0, regen: 0, waveRepair: 0, startingShield: 0, spikes: 0 },
      global: { blueManaGain: 0 },
      defenders: {
        fireMage: {
          fireballDamage: 0,
          fireballCastSpeed: 0,
          maxMp: 0,
          mpRegen: 0,
          fireWallDamage: 0,
          fireWallDuration: 0,
          fireWallSize: 0,
          firestormDamage: 0,
          firestormDuration: 0,
          firestormArea: 0,
          fireElementalPower: 0,
          fireElementalDuration: 0,
          fireElementalHealth: 0,
        },
        iceMage: {
          iceShardDamage: 0,
          iceShardCastSpeed: 0,
          maxMp: 0,
          mpRegen: 0,
        },
      },
    },
    ownedRecruits: [],
    loadout: { north: null, south: null },
  }
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

// Deep-merge `source` onto the shape of `template`. Newly added template fields
// default in (0 / [] / null) instead of wiping the save, and any corrupt /
// type-mismatched value falls back to the template's default.
function mergeShaped<T>(template: T, source: unknown): T {
  if (Array.isArray(template)) {
    return (Array.isArray(source) ? source : template) as T
  }
  if (template !== null && typeof template === 'object') {
    const tpl = template as Record<string, unknown>
    const src = (source && typeof source === 'object' && !Array.isArray(source))
      ? (source as Record<string, unknown>)
      : {}
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(tpl)) {
      out[key] = mergeShaped(tpl[key], src[key])
    }
    return out as T
  }
  if (typeof template === 'number') {
    return (typeof source === 'number' && Number.isFinite(source) ? source : template) as T
  }
  if (typeof template === 'string') {
    return (typeof source === 'string' ? source : template) as T
  }
  if (template === null) {
    // Nullable slot (e.g. loadout north/south): accept a string or null.
    return (typeof source === 'string' || source === null ? source : template) as T
  }
  return (source === undefined ? template : source) as T
}

// Map a legacy v1 save (flat `upgradeLevels`) into the v2 structure, preserving
// currency/stats and re-homing each old upgrade into its new namespace.
function migrateV1toV2(old: Record<string, unknown>): SaveData {
  const data = defaultSave()
  data.blueMana = num(old.blueMana)
  data.highestWaveEver = num(old.highestWaveEver)
  data.totalRuns = num(old.totalRuns)
  data.totalBlueManaEarned = num(old.totalBlueManaEarned)

  const lv = (old.upgradeLevels && typeof old.upgradeLevels === 'object')
    ? (old.upgradeLevels as Record<string, unknown>)
    : {}
  data.upgrades.defenders.fireMage.fireballDamage = num(lv.spellPower)
  data.upgrades.defenders.fireMage.fireballCastSpeed = num(lv.castSpeed)
  data.upgrades.castle.maxHp = num(lv.maxHp)
  data.upgrades.castle.armor = num(lv.magicBarrier)
  data.upgrades.global.blueManaGain = num(lv.blueManaGain)
  return data
}

// Bring any parsed save object up to the current version + shape. A version
// bump never wipes; only a non-object (corrupt) input yields a default save.
export function migrate(parsed: unknown): SaveData {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return defaultSave()
  }
  const obj = parsed as Record<string, unknown>
  const version = typeof obj.version === 'number' ? obj.version : 0

  const data = version < 2
    ? migrateV1toV2(obj)
    : mergeShaped(defaultSave(), obj) // already v2+: fill any newly added fields
  data.version = SAVE_VERSION
  return data
}

export const SaveSystem = {
  load(): SaveData {
    let raw: string | null = null
    try {
      raw = localStorage.getItem(SAVE_KEY)
    } catch {
      return defaultSave()
    }
    if (!raw) return defaultSave()

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Corrupt / unparseable — fall back to a fresh save, leave disk untouched.
      return defaultSave()
    }

    const migrated = migrate(parsed)
    const storedVersion =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>).version
        : undefined
    if (storedVersion !== SAVE_VERSION) {
      // Persist the upgraded save so disk is current after a migration.
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(migrated))
      } catch {
        /* ignore write failures */
      }
    }
    return migrated
  },

  save(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    } catch {
      /* ignore write failures */
    }
  },

  reset(): void {
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch {
      /* ignore */
    }
  },

  hasSave(): boolean {
    try {
      return localStorage.getItem(SAVE_KEY) !== null
    } catch {
      return false
    }
  },
}

export type { SaveData }
