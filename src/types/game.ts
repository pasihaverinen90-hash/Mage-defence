export interface MageStats {
  maxHp: number
  damage: number
  castInterval: number // seconds between attacks
  damageReduction: number // flat damage reduction
}

export interface EnemyDefinition {
  id: string
  name: string
  emoji: string
  baseHp: number
  baseDamage: number
  baseAttackInterval: number // seconds between attacks
  hpScaling: number // multiplier per wave
  damageScaling: number // multiplier per wave
  isBoss: boolean
}

export interface EnemyInstance {
  definition: EnemyDefinition
  maxHp: number
  hp: number
  damage: number
  attackInterval: number
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
