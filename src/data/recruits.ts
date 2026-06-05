import type { DefenderDefinition } from '../types/game'
import { BALANCE } from './balance'

// Recruits occupy the Tower North / Tower South slots. Only the Ice Mage exists
// for now; Lightning Mage / Archer / Necromancer arrive in later slices.
export const ICE_MAGE: DefenderDefinition = {
  id: 'iceMage',
  name: 'Ice Mage',
  emoji: '🥶',
  basicAttackName: 'Ice Shard',
  basicAttackEmoji: '❄️',
  slowFactor: BALANCE.iceMage.slowFactor,
  slowDurationSec: BALANCE.iceMage.slowDurationSec,
}

export interface RecruitInfo {
  definition: DefenderDefinition
  cost: number // Blue Mana to unlock
}

export const RECRUITS: Record<string, RecruitInfo> = {
  iceMage: { definition: ICE_MAGE, cost: 150 },
}
