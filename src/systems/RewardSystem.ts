import { BALANCE } from '../data/balance'
import { UpgradeSystem } from './UpgradeSystem'

export const RewardSystem = {
  // Reward scales with cleared waves and kills so ending a run immediately
  // (wave 1, no kills) yields 0 Blue Mana. `manaGainLevel` is the player's
  // global Blue Mana Gain upgrade level.
  calculateBlueMana(
    waveReached: number,
    killCount: number,
    manaGainLevel: number,
  ): number {
    const mult = UpgradeSystem.getManaGainMultiplier(manaGainLevel)
    const base =
      Math.max(0, waveReached - 1) * BALANCE.reward.basePerWave +
      killCount * BALANCE.reward.perKill
    return Math.floor(base * mult)
  },
}
