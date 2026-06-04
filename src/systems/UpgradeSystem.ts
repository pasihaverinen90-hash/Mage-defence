import type { MageStats, UpgradeLevels } from '../types/game'
import { UPGRADES } from '../data/upgrades'
import { BALANCE } from '../data/balance'
import { gameState } from '../state/GameState'

export const UpgradeSystem = {
  getCost(upgradeId: string, currentLevel: number): number {
    const def = UPGRADES[upgradeId]
    return Math.floor(def.costBase * Math.pow(def.costMultiplier, currentLevel))
  },

  canAfford(upgradeId: string): boolean {
    const levels = gameState.upgradeLevels as unknown as Record<string, number>
    const level = levels[upgradeId] ?? 0
    const def = UPGRADES[upgradeId]
    if (level >= def.maxLevel) return false
    return gameState.blueMana >= UpgradeSystem.getCost(upgradeId, level)
  },

  buyUpgrade(upgradeId: string): boolean {
    if (!UpgradeSystem.canAfford(upgradeId)) return false
    const levels = gameState.upgradeLevels as unknown as Record<string, number>
    const level = levels[upgradeId] ?? 0
    const cost = UpgradeSystem.getCost(upgradeId, level)
    gameState.spendMana(cost)
    gameState.incrementUpgrade(upgradeId as keyof UpgradeLevels)
    return true
  },

  computeMageStats(levels: UpgradeLevels): MageStats {
    const b = BALANCE.mage
    const u = BALANCE.upgrades

    const damageMult = 1 + levels.spellPower * u.spellPowerPerLevel
    const intervalMult = Math.max(0.3, 1 - levels.castSpeed * u.castSpeedPerLevel)

    return {
      maxHp: b.baseHp + levels.maxHp * u.maxHpPerLevel,
      damage: Math.floor(b.baseDamage * damageMult),
      castInterval: parseFloat((b.baseCastInterval * intervalMult).toFixed(2)),
      damageReduction: levels.magicBarrier * u.magicBarrierPerLevel,
    }
  },

  getManaGainMultiplier(level: number): number {
    return 1 + level * BALANCE.upgrades.blueManaGainPerLevel
  },
}
