import { BALANCE } from '../data/balance'
import { UpgradeSystem } from './UpgradeSystem'
import type { UpgradeLevels } from '../types/game'

export const RewardSystem = {
  calculateBlueMana(highestWave: number, upgradeLevels: UpgradeLevels): number {
    const mult = UpgradeSystem.getManaGainMultiplier(upgradeLevels.blueManaGain)
    return Math.floor(highestWave * BALANCE.reward.basePerWave * mult)
  },
}
