import type {
  CastleStats,
  FireMageStats,
  FireWallStats,
  CastleUpgradeLevels,
  FireMageUpgradeLevels,
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

  getManaGainMultiplier(level: number): number {
    return 1 + level * BALANCE.upgrades.blueManaGainPerLevel
  },
}
