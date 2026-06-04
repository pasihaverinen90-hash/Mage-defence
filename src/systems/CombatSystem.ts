import type { MageStats, CastleState } from '../types/game'

export const CombatSystem = {
  mageAttack(stats: MageStats): number {
    return stats.damage
  },

  enemyAttack(enemyDamage: number, mageReduction: number): number {
    return Math.max(1, enemyDamage - mageReduction)
  },

  // Apply an incoming hit to the castle: armor reduces it (min 1), then HP drops.
  // Returns the damage actually dealt.
  applyDamageToCastle(castle: CastleState, rawDamage: number): number {
    const dealt = Math.max(1, rawDamage - castle.armor)
    castle.hp = Math.max(0, castle.hp - dealt)
    return dealt
  },
}
