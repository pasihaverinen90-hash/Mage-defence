// Resolved (per-run) combat stats for the Fire Mage hero.
export interface FireMageStats {
  damage: number
  castInterval: number // seconds between attacks
}

// Resolved (per-run) castle stats derived from castle upgrade levels.
export interface CastleStats {
  maxHp: number
  armor: number // flat damage reduction
  maxShield: number
  regenPerSec: number
  waveRepair: number
  spikeDamage: number
}

// Categories that group upgrade definitions and route their saved levels.
export type UpgradeCategory = 'castle' | 'fireMage' | 'global'

// Shared castle pool that is the defended target during a run.
export interface CastleState {
  hp: number
  maxHp: number
  armor: number // flat damage reduction applied before HP loss
  shield: number // Magic Shield: absorbs incoming damage before HP
  maxShield: number
  regenPerSec: number // passive HP regen (HP only, never shield)
  waveRepair: number // HP healed each wave milestone
  spikeDamage: number // damage dealt to wall enemies each spike tick
}

export interface EnemyDefinition {
  id: string
  name: string
  emoji: string
  baseHp: number
  baseDamage: number
  baseAttackInterval: number // seconds between attacks
  movementSpeed: number // pixels per second moving left toward the mage
  hpScaling: number // multiplier per wave
  damageScaling: number // multiplier per wave
  isBoss: boolean
}

// A live enemy on the arena lane with its own position and timers.
export interface RunEnemy {
  id: string
  definition: EnemyDefinition
  hp: number
  maxHp: number
  damage: number
  attackInterval: number
  attackTimer: number
  x: number
  y: number
  speed: number
  hasReachedMage: boolean
}

export interface UpgradeDefinition {
  id: string
  category: UpgradeCategory
  field: string // the level field within its category's level block
  name: string
  description: string
  emoji: string
  costBase: number
  costMultiplier: number
  maxLevel: number
}

// ── Namespaced upgrade level blocks (persisted) ────────────────
export interface CastleUpgradeLevels {
  maxHp: number
  armor: number
  regen: number
  waveRepair: number
  startingShield: number
  spikes: number
}

export interface GlobalUpgradeLevels {
  blueManaGain: number
}

export interface FireMageUpgradeLevels {
  fireballDamage: number
  fireballCastSpeed: number
  maxMp: number
  mpRegen: number
  fireWallDamage: number
  fireWallDuration: number
  fireWallSize: number
  firestormDamage: number
  firestormDuration: number
  firestormArea: number
  fireElementalPower: number
  fireElementalDuration: number
  fireElementalHealth: number
}

export interface UpgradeState {
  castle: CastleUpgradeLevels
  global: GlobalUpgradeLevels
  defenders: {
    fireMage: FireMageUpgradeLevels
  }
}

// Future-proof recruit scaffolding (no recruit gameplay yet).
export interface RecruitLoadout {
  north: string | null
  south: string | null
}

export interface RunStats {
  highestWave: number
  killCount: number
  blueManaEarned: number
}

export interface SaveData {
  version: number
  blueMana: number
  highestWaveEver: number
  totalRuns: number
  totalBlueManaEarned: number
  upgrades: UpgradeState
  ownedRecruits: string[]
  loadout: RecruitLoadout
}
