import type { MageStats, EnemyInstance } from '../types/game'

export interface CombatResult {
  damageToEnemy: number
  damageToMage: number
}

export const CombatSystem = {
  mageAttack(stats: MageStats): number {
    return stats.damage
  },

  enemyAttack(enemy: EnemyInstance, mageReduction: number): number {
    const raw = enemy.damage
    return Math.max(1, raw - mageReduction)
  },
}
