import type { DefenderDefinition, DefenderSlot, DefenderSlotId } from '../types/game'
import { BALANCE } from './balance'

// The Fire Mage hero. Future recruits (Ice/Lightning/Archer/Necromancer) will
// be additional DefenderDefinitions assigned to the tower slots.
export const FIRE_MAGE: DefenderDefinition = {
  id: 'fireMage',
  name: 'Fire Mage',
  emoji: '🧙',
  basicAttackName: 'Fireball',
}

const A = BALANCE.arena

// Three wall positions. Only the hero slot is occupied for now; the towers are
// future recruit slots and start locked.
export const DEFENDER_SLOTS: Record<DefenderSlotId, DefenderSlot> = {
  towerNorth: { id: 'towerNorth', name: 'Tower North', x: A.mageX, y: A.towerNorthY, unlocked: false },
  hero: { id: 'hero', name: 'Fire Mage', x: A.mageX, y: A.laneY, unlocked: true },
  towerSouth: { id: 'towerSouth', name: 'Tower South', x: A.mageX, y: A.towerSouthY, unlocked: false },
}
