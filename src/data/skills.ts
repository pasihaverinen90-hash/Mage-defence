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

export const FIRESTORM: SkillDefinition = {
  id: 'firestorm',
  name: 'Firestorm',
  emoji: '🌪️',
  mpCost: BALANCE.fireMage.firestorm.mpCost,
  cooldownSec: BALANCE.fireMage.firestorm.cooldownSec,
  targeting: 'area',
  effectKind: 'firestorm',
}

export const FIRE_ELEMENTAL: SkillDefinition = {
  id: 'fireElemental',
  name: 'Fire Elemental',
  emoji: '🌋',
  mpCost: BALANCE.fireMage.fireElemental.mpCost,
  cooldownSec: BALANCE.fireMage.fireElemental.cooldownSec,
  targeting: 'area',
  effectKind: 'fireElemental',
}

export const FIRE_MAGE_SKILLS: SkillDefinition[] = [FIRE_WALL, FIRESTORM, FIRE_ELEMENTAL]

export const CHAIN_LIGHTNING: SkillDefinition = {
  id: 'chainLightning',
  name: 'Chain Lightning',
  emoji: '⚡',
  mpCost: BALANCE.lightningMage.chainLightning.mpCost,
  cooldownSec: BALANCE.lightningMage.chainLightning.cooldownSec,
  targeting: 'none', // instant — auto-targets the closest enemy
  effectKind: 'chainLightning',
  range: BALANCE.lightningMage.chainLightning.range,
}

export const LIGHTNING_MAGE_SKILLS: SkillDefinition[] = [CHAIN_LIGHTNING]

export const PIERCING_SHOT: SkillDefinition = {
  id: 'piercingShot',
  name: 'Piercing Shot',
  emoji: '🏹',
  mpCost: BALANCE.archer.piercingShot.mpCost,
  cooldownSec: BALANCE.archer.piercingShot.cooldownSec,
  targeting: 'none', // instant — fires through the closest enemy's lane
  effectKind: 'piercingShot',
  range: BALANCE.archer.piercingShot.range,
}

export const ARCHER_SKILLS: SkillDefinition[] = [PIERCING_SHOT]

export const RAISE_SKELETON: SkillDefinition = {
  id: 'raiseSkeleton',
  name: 'Raise Skeleton',
  emoji: '💀',
  mpCost: BALANCE.necromancer.raiseSkeleton.mpCost,
  cooldownSec: BALANCE.necromancer.raiseSkeleton.cooldownSec,
  targeting: 'area', // placed on the battlefield like Fire Elemental
  effectKind: 'raiseSkeleton',
  range: BALANCE.necromancer.raiseSkeleton.range,
}

export const NECROMANCER_SKILLS: SkillDefinition[] = [RAISE_SKELETON]

export const BLIZZARD: SkillDefinition = {
  id: 'blizzard',
  name: 'Blizzard',
  emoji: '❄️',
  mpCost: BALANCE.iceMage.blizzard.mpCost,
  cooldownSec: BALANCE.iceMage.blizzard.cooldownSec,
  targeting: 'none', // auto, battlefield-wide — no placement, no single target
  effectKind: 'blizzard',
  range: BALANCE.iceMage.blizzard.range,
}

export const ICE_MAGE_SKILLS: SkillDefinition[] = [BLIZZARD]
