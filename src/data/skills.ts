import type { SkillDefinition } from '../types/game'
import { BALANCE } from './balance'

// Manual skills are data-driven so Firestorm / Fire Elemental can slot in later
// as additional SkillDefinitions with their own effectKind + targeting.
export const FIRE_WALL: SkillDefinition = {
  id: 'fireWall',
  name: 'Fire Wall',
  emoji: '🔥',
  mpCost: BALANCE.fireMage.fireWall.mpCost,
  cooldownSec: BALANCE.fireMage.fireWall.cooldownSec,
  targeting: 'pointX',
  effectKind: 'fireWall',
}

export const FIRE_MAGE_SKILLS: SkillDefinition[] = [FIRE_WALL]
