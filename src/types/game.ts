export interface MageStats {
  maxHp: number
  damage: number
  castInterval: number // seconds between attacks
  damageReduction: number // flat damage reduction
}

// Shared castle pool that is the defended target during a run.
export interface CastleState {
  hp: number
  maxHp: number
  armor: number // flat damage reduction applied before HP loss
  shield: number // Magic Shield: absorbs incoming damage before HP
  maxShield: number
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
  name: string
  description: string
  emoji: string
  costBase: number
  costMultiplier: number
  maxLevel: number
}

export interface UpgradeLevels {
  spellPower: number
  maxHp: number
  castSpeed: number
  magicBarrier: number
  blueManaGain: number
}

export interface RunStats {
  highestWave: number
  killCount: number
  blueManaEarned: number
}

export interface SaveData {
  version: number
  blueMana: number
  upgradeLevels: UpgradeLevels
  highestWaveEver: number
  totalRuns: number
  totalBlueManaEarned: number
}
