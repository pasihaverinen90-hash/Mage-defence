// Resolved (per-run) basic-combat stats shared by any defender (hero/recruit).
export interface DefenderBasicStats {
  damage: number
  castInterval: number // seconds between attacks
  maxMp: number
  mpRegen: number // MP per second
}

// Fire Mage uses the shared shape (kept as an alias for readability).
export type FireMageStats = DefenderBasicStats

// ── Defenders (the hero + future recruits on the castle wall) ──
export type DefenderSlotId = 'towerNorth' | 'hero' | 'towerSouth'

// A position on the castle wall that can hold a defender.
export interface DefenderSlot {
  id: DefenderSlotId
  name: string
  x: number
  y: number
  unlocked: boolean // hero is always unlocked; towers are future recruit slots
}

// Static identity of a defender character (the Fire Mage hero or a recruit).
export interface DefenderDefinition {
  id: string
  name: string
  emoji: string
  basicAttackName: string
  basicAttackEmoji: string // projectile/visual for the basic attack
  slowFactor?: number // basic attack slows the target to this speed fraction
  slowDurationSec?: number // for this long (data-driven; restores cleanly)
}

// Per-run live state for one defender occupying a slot.
export interface DefenderRuntimeState {
  slotId: DefenderSlotId
  definition: DefenderDefinition
  x: number
  y: number
  basicDamage: number
  basicInterval: number // seconds between basic attacks
  attackTimer: number
  mp: number
  maxMp: number
  mpRegen: number // MP per second
  skills: SkillRuntimeState[]
}

// ── Manual skills (Fire Mage now; future recruits later) ───────
export interface SkillDefinition {
  id: string
  name: string
  emoji: string
  mpCost: number
  cooldownSec: number
  targeting: 'pointX' | 'area' | 'none' // pointX/area = placement; none = instant
  effectKind: 'fireWall' | 'firestorm' | 'fireElemental' | 'chainLightning'
}

export interface SkillRuntimeState {
  definition: SkillDefinition
  cooldownTimer: number // seconds remaining; 0 = ready
}

// Resolved (per-cast) Fire Wall parameters from upgrade levels.
export interface FireWallStats {
  tickDamage: number
  tickInterval: number
  durationSec: number
  width: number
  height: number
}

// Resolved (per-cast) Firestorm parameters from upgrade levels.
export interface FirestormStats {
  tickDamage: number
  tickInterval: number
  durationSec: number
  radius: number
}

// Resolved (per-cast) Chain Lightning parameters from upgrade levels.
export interface ChainLightningStats {
  damage: number
  jumps: number // extra targets beyond the first
  jumpRadius: number
  falloff: number // damage multiplier applied per jump
  cooldownSec: number
}

// Resolved (per-cast) Fire Elemental parameters from upgrade levels.
export interface FireElementalStats {
  hp: number
  durationSec: number
  aoeDamage: number
  aoeRadius: number
  tauntRadius: number
  aoeInterval: number
}

// A summoned tanking entity that taunts nearby enemies (they attack it instead
// of the castle) and Fire-Bashes enemies around itself. Dies on 0 HP or timeout.
export interface Summon {
  id: string
  kind: 'fireElemental'
  x: number
  y: number
  hp: number
  maxHp: number
  tauntRadius: number
  aoeRadius: number
  aoeDamage: number
  aoeInterval: number
  aoeTimer: number
  remainingSec: number
}

// A timed area-of-effect zone on the battlefield (Fire Wall rect, Firestorm
// circle; Elemental later). Damages enemies inside on a tick; never touches the
// castle or defenders.
export interface FieldEffect {
  id: string
  kind: 'fireWall' | 'firestorm'
  shape: 'rect' | 'circle'
  x: number
  y: number
  width: number // rect
  height: number // rect
  radius: number // circle
  tickDamage: number
  tickInterval: number
  tickTimer: number
  remainingSec: number
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
export type UpgradeCategory = 'castle' | 'fireMage' | 'iceMage' | 'lightningMage' | 'global'

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
  movementSpeed: number // pixels per second moving left toward the castle
  hpScaling: number // multiplier per wave
  damageScaling: number // multiplier per wave
  isBoss: boolean
  attackType: 'melee' | 'ranged'
  stopDistanceFromWall: number // 0 = stops at the wall (melee); >0 = ranged standoff
  projectileSpeed?: number // px/sec for ranged shots
  projectileEmoji?: string // visual for ranged shots
}

// A live enemy advancing on the battlefield with its own position and timers.
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
  speed: number // current speed (may be reduced while slowed)
  baseSpeed: number // original speed, restored when a slow expires
  slowTimer: number // seconds of slow remaining; 0 = not slowed
  stopX: number // x position where this enemy stops to attack
  attacking: boolean // reached its stop position and is attacking the castle
}

// A simple in-flight projectile (currently enemy shots at the castle).
// Shaped so defender attacks / manual skills can reuse it later.
export interface Projectile {
  id: string
  x: number
  y: number
  targetX: number
  targetY: number
  speed: number // px/sec
  damage: number
  source: 'enemy' | 'defender'
  targetKind: 'castle' | 'enemy'
  emoji: string
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

export interface IceMageUpgradeLevels {
  iceShardDamage: number
  iceShardCastSpeed: number
  maxMp: number
  mpRegen: number
}

export interface LightningMageUpgradeLevels {
  lightningBoltDamage: number
  lightningBoltCastSpeed: number
  maxMp: number
  mpRegen: number
  chainLightningDamage: number
  chainLightningJumps: number
  chainLightningCooldown: number
}

export interface UpgradeState {
  castle: CastleUpgradeLevels
  global: GlobalUpgradeLevels
  defenders: {
    fireMage: FireMageUpgradeLevels
    iceMage: IceMageUpgradeLevels
    lightningMage: LightningMageUpgradeLevels
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
