import type {
  CastleStats,
  FireMageStats,
  DefenderBasicStats,
  BlizzardStats,
  FireWallStats,
  FirestormStats,
  FireElementalStats,
  SummonStats,
  ChainLightningStats,
  PiercingShotStats,
  CastleUpgradeLevels,
  FireMageUpgradeLevels,
  IceMageUpgradeLevels,
  LightningMageUpgradeLevels,
  ArcherUpgradeLevels,
  NecromancerUpgradeLevels,
  UpgradeDefinition,
} from '../types/game'
import { BALANCE } from '../data/balance'
import { gameState } from '../state/GameState'

export const UpgradeSystem = {
  getCost(def: UpgradeDefinition, currentLevel: number): number {
    return Math.floor(def.costBase * Math.pow(def.costMultiplier, currentLevel))
  },

  getLevel(def: UpgradeDefinition): number {
    return gameState.getUpgradeLevel(def.category, def.field)
  },

  canAfford(def: UpgradeDefinition): boolean {
    const level = UpgradeSystem.getLevel(def)
    if (level >= def.maxLevel) return false
    return gameState.blueMana >= UpgradeSystem.getCost(def, level)
  },

  buyUpgrade(def: UpgradeDefinition): boolean {
    if (!UpgradeSystem.canAfford(def)) return false
    const level = UpgradeSystem.getLevel(def)
    gameState.spendMana(UpgradeSystem.getCost(def, level))
    gameState.incrementUpgrade(def.category, def.field)
    return true
  },

  resolveCastle(levels: CastleUpgradeLevels): CastleStats {
    const b = BALANCE.castle
    const u = BALANCE.upgrades
    return {
      maxHp: b.baseHp + levels.maxHp * u.castleMaxHpPerLevel,
      armor: b.baseArmor + levels.armor * u.castleArmorPerLevel,
      maxShield: b.baseShield + levels.startingShield * u.castleStartingShieldPerLevel,
      regenPerSec: b.baseRegen + levels.regen * u.castleRegenPerLevel,
      waveRepair: b.baseWaveRepair + levels.waveRepair * u.castleWaveRepairPerLevel,
      spikeDamage: levels.spikes * u.castleSpikesPerLevel,
    }
  },

  resolveFireMage(levels: FireMageUpgradeLevels): FireMageStats {
    const b = BALANCE.fireMage
    const u = BALANCE.upgrades
    const damageMult = 1 + levels.fireballDamage * u.fireballDamagePerLevel
    const intervalMult = Math.max(0.3, 1 - levels.fireballCastSpeed * u.fireballCastSpeedPerLevel)
    return {
      damage: Math.floor(b.baseDamage * damageMult),
      castInterval: parseFloat((b.baseCastInterval * intervalMult).toFixed(2)),
      maxMp: b.baseMaxMp + levels.maxMp * u.fireMageMaxMpPerLevel,
      mpRegen: b.baseMpRegen + levels.mpRegen * u.fireMageMpRegenPerLevel,
    }
  },

  resolveIceMage(levels: IceMageUpgradeLevels): DefenderBasicStats {
    const b = BALANCE.iceMage
    const u = BALANCE.upgrades
    const damageMult = 1 + levels.iceShardDamage * u.iceShardDamagePerLevel
    const intervalMult = Math.max(0.3, 1 - levels.iceShardCastSpeed * u.iceShardCastSpeedPerLevel)
    return {
      damage: Math.floor(b.baseDamage * damageMult),
      castInterval: parseFloat((b.baseCastInterval * intervalMult).toFixed(2)),
      maxMp: 0, // recruits have no MP
      mpRegen: 0,
    }
  },

  resolveBlizzard(levels: IceMageUpgradeLevels): BlizzardStats {
    const b = BALANCE.iceMage.blizzard
    const m = levels.blizzardMastery
    const slowPercent = Math.min(b.maxSlowPercent, b.baseSlowPercent + m * b.masterySlowPerLevel)
    return {
      durationSec: b.baseDurationSec + m * b.masteryDurationPerLevel,
      slowFactor: 1 - slowPercent,
      tickDamage: b.baseTickDamage + m * b.masteryDamagePerLevel,
      tickInterval: b.tickInterval,
      cooldownSec: Math.max(b.minCooldownSec, b.cooldownSec - m * b.masteryCooldownPerLevel),
    }
  },

  resolveLightningMage(levels: LightningMageUpgradeLevels): DefenderBasicStats {
    const b = BALANCE.lightningMage
    const u = BALANCE.upgrades
    const damageMult = 1 + levels.lightningBoltDamage * u.lightningBoltDamagePerLevel
    const intervalMult = Math.max(0.3, 1 - levels.lightningBoltCastSpeed * u.lightningBoltCastSpeedPerLevel)
    return {
      damage: Math.floor(b.baseDamage * damageMult),
      castInterval: parseFloat((b.baseCastInterval * intervalMult).toFixed(2)),
      maxMp: 0, // recruits have no MP
      mpRegen: 0,
    }
  },

  resolveChainLightning(levels: LightningMageUpgradeLevels): ChainLightningStats {
    const b = BALANCE.lightningMage.chainLightning
    const m = levels.chainLightningMastery
    return {
      damage: b.baseDamage + m * b.masteryDamagePerLevel,
      jumps: b.baseJumps + Math.floor(m / b.masteryJumpsEvery),
      jumpRadius: b.jumpRadius,
      falloff: b.falloff,
      cooldownSec: Math.max(b.minCooldownSec, b.cooldownSec - m * b.masteryCooldownPerLevel),
    }
  },

  resolveArcher(levels: ArcherUpgradeLevels): DefenderBasicStats {
    const b = BALANCE.archer
    const u = BALANCE.upgrades
    const damageMult = 1 + levels.arrowDamage * u.arrowDamagePerLevel
    const intervalMult = Math.max(0.3, 1 - levels.arrowAttackSpeed * u.arrowAttackSpeedPerLevel)
    return {
      damage: Math.floor(b.baseDamage * damageMult),
      castInterval: parseFloat((b.baseCastInterval * intervalMult).toFixed(2)),
      maxMp: 0, // recruits have no MP
      mpRegen: 0,
    }
  },

  resolvePiercingShot(levels: ArcherUpgradeLevels): PiercingShotStats {
    const b = BALANCE.archer.piercingShot
    const m = levels.piercingShotMastery
    return {
      damage: b.baseDamage + m * b.masteryDamagePerLevel,
      width: b.baseWidth + m * b.masteryWidthPerLevel,
      cooldownSec: Math.max(b.minCooldownSec, b.cooldownSec - m * b.masteryCooldownPerLevel),
    }
  },

  resolveNecromancer(levels: NecromancerUpgradeLevels): DefenderBasicStats {
    const b = BALANCE.necromancer
    const u = BALANCE.upgrades
    const damageMult = 1 + levels.shadowBoltDamage * u.shadowBoltDamagePerLevel
    const intervalMult = Math.max(0.3, 1 - levels.shadowBoltCastSpeed * u.shadowBoltCastSpeedPerLevel)
    return {
      damage: Math.floor(b.baseDamage * damageMult),
      castInterval: parseFloat((b.baseCastInterval * intervalMult).toFixed(2)),
      maxMp: 0, // recruits have no MP
      mpRegen: 0,
    }
  },

  resolveRaiseSkeleton(levels: NecromancerUpgradeLevels): SummonStats {
    const b = BALANCE.necromancer.raiseSkeleton
    const m = levels.raiseSkeletonMastery
    return {
      hp: b.baseHp + m * b.masteryHpPerLevel,
      durationSec: b.baseDurationSec + m * b.masteryDurationPerLevel,
      aoeDamage: b.baseAoeDamage + m * b.masteryDamagePerLevel,
      aoeRadius: b.aoeRadius,
      tauntRadius: b.tauntRadius,
      aoeInterval: b.aoeInterval,
      cooldownSec: Math.max(b.minCooldownSec, b.cooldownSec - m * b.masteryCooldownPerLevel),
    }
  },

  // Fire Wall scales with its (already-persisted) upgrade levels. Levels are 0
  // until the upgrades are surfaced for purchase, so this returns base values
  // today and scales automatically once they are buyable.
  resolveFireWall(levels: FireMageUpgradeLevels): FireWallStats {
    const b = BALANCE.fireMage.fireWall
    const u = BALANCE.upgrades
    return {
      tickDamage: b.baseTickDamage + levels.fireWallDamage * u.fireWallDamagePerLevel,
      tickInterval: b.tickInterval,
      durationSec: b.baseDurationSec + levels.fireWallDuration * u.fireWallDurationPerLevel,
      width: b.baseWidth + levels.fireWallSize * u.fireWallSizePerLevel,
      height: b.height,
    }
  },

  resolveFirestorm(levels: FireMageUpgradeLevels): FirestormStats {
    const b = BALANCE.fireMage.firestorm
    const u = BALANCE.upgrades
    return {
      tickDamage: b.baseTickDamage + levels.firestormDamage * u.firestormDamagePerLevel,
      tickInterval: b.tickInterval,
      durationSec: b.baseDurationSec + levels.firestormDuration * u.firestormDurationPerLevel,
      radius: b.baseRadius + levels.firestormArea * u.firestormAreaPerLevel,
    }
  },

  resolveFireElemental(levels: FireMageUpgradeLevels): FireElementalStats {
    const b = BALANCE.fireMage.fireElemental
    const u = BALANCE.upgrades
    return {
      hp: b.baseHp + levels.fireElementalHealth * u.fireElementalHealthPerLevel,
      durationSec: b.baseDurationSec + levels.fireElementalDuration * u.fireElementalDurationPerLevel,
      aoeDamage: b.baseAoeDamage + levels.fireElementalPower * u.fireElementalPowerPerLevel,
      aoeRadius: b.aoeRadius,
      tauntRadius: b.tauntRadius,
      aoeInterval: b.aoeInterval,
      cooldownSec: b.cooldownSec, // Fire Mage summon — static (unchanged)
    }
  },

  getManaGainMultiplier(level: number): number {
    return 1 + level * BALANCE.upgrades.blueManaGainPerLevel
  },
}
