import type { MageStats } from '../types/game'

export const CombatSystem = {
  mageAttack(stats: MageStats): number {
    return stats.damage
  },

  enemyAttack(enemyDamage: number, mageReduction: number): number {
    return Math.max(1, enemyDamage - mageReduction)
  },
}
