import type { FireMageStats, CastleState } from '../types/game'

export const CombatSystem = {
  mageAttack(stats: FireMageStats): number {
    return stats.damage
  },

  enemyAttack(enemyDamage: number, mageReduction: number): number {
    return Math.max(1, enemyDamage - mageReduction)
  },

  // Apply an incoming hit to the castle. Armor reduces it (min 1), then the
  // Magic Shield absorbs first and any overflow drops Castle HP.
  // Returns the post-armor damage absorbed/dealt across shield + HP.
  applyDamageToCastle(castle: CastleState, rawDamage: number): number {
    const dealt = Math.max(1, rawDamage - castle.armor)
    const absorbed = Math.min(castle.shield, dealt)
    castle.shield -= absorbed
    const overflow = dealt - absorbed
    if (overflow > 0) castle.hp = Math.max(0, castle.hp - overflow)
    return dealt
  },
}
