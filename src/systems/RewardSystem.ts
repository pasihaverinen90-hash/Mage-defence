import { BALANCE } from '../data/balance'
import { UpgradeSystem } from './UpgradeSystem'
import type { UpgradeLevels } from '../types/game'

export const RewardSystem = {
  // Reward scales with cleared waves and kills so ending a run immediately
  // (wave 1, no kills) yields 0 Blue Mana.
  calculateBlueMana(
    waveReached: number,
    killCount: number,
    upgradeLevels: UpgradeLevels,
  ): number {
    const mult = UpgradeSystem.getManaGainMultiplier(upgradeLevels.blueManaGain)
    const base =
      Math.max(0, waveReached - 1) * BALANCE.reward.basePerWave +
      killCount * BALANCE.reward.perKill
    return Math.floor(base * mult)
  },
}
