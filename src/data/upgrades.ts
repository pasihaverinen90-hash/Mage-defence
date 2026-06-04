import type { UpgradeDefinition } from '../types/game'

// Only upgrades whose gameplay already exists are listed here (buyable/visible).
// Hidden future upgrades (castle regen/waveRepair/spikes, fire mage MP & skill
// upgrades) live in the save structure but are added here once their feature
// lands. Costs match the pre-migration values so migrated levels stay consistent.
export const UPGRADES: Record<string, UpgradeDefinition> = {
  castleMaxHp: {
    id: 'castleMaxHp', category: 'castle', field: 'maxHp',
    name: 'Castle Max HP', description: '+20 max HP per level', emoji: '🏰',
    costBase: 8, costMultiplier: 1.5, maxLevel: 50,
  },
  castleArmor: {
    id: 'castleArmor', category: 'castle', field: 'armor',
    name: 'Castle Armor', description: '+3 damage reduction per level', emoji: '🧱',
    costBase: 15, costMultiplier: 1.7, maxLevel: 30,
  },
  castleStartingShield: {
    id: 'castleStartingShield', category: 'castle', field: 'startingShield',
    name: 'Starting Shield', description: '+15 Magic Shield per level', emoji: '🛡️',
    costBase: 12, costMultiplier: 1.6, maxLevel: 30,
  },
  castleRegen: {
    id: 'castleRegen', category: 'castle', field: 'regen',
    name: 'Castle Regen', description: '+1 HP/sec per level', emoji: '💚',
    costBase: 14, costMultiplier: 1.6, maxLevel: 30,
  },
  castleWaveRepair: {
    id: 'castleWaveRepair', category: 'castle', field: 'waveRepair',
    name: 'Wave Repair', description: '+10 HP repaired each wave per level', emoji: '🔧',
    costBase: 16, costMultiplier: 1.6, maxLevel: 30,
  },
  castleSpikes: {
    id: 'castleSpikes', category: 'castle', field: 'spikes',
    name: 'Spikes', description: '+3 dmg to wall enemies every 3s per level', emoji: '⛏️',
    costBase: 18, costMultiplier: 1.65, maxLevel: 30,
  },
  fireballDamage: {
    id: 'fireballDamage', category: 'fireMage', field: 'fireballDamage',
    name: 'Fireball Damage', description: '+15% Fireball damage per level', emoji: '🔥',
    costBase: 10, costMultiplier: 1.6, maxLevel: 50,
  },
  fireballCastSpeed: {
    id: 'fireballCastSpeed', category: 'fireMage', field: 'fireballCastSpeed',
    name: 'Fireball Cast Speed', description: '-8% cast interval per level', emoji: '⚡',
    costBase: 12, costMultiplier: 1.65, maxLevel: 10,
  },
  blueManaGain: {
    id: 'blueManaGain', category: 'global', field: 'blueManaGain',
    name: 'Blue Mana Gain', description: '+15% mana reward per level', emoji: '💧',
    costBase: 20, costMultiplier: 1.8, maxLevel: 20,
  },
}

export interface UpgradeSection {
  label: string
  upgradeIds: string[]
}

export const UPGRADE_SECTIONS: UpgradeSection[] = [
  { label: '🏰 Castle', upgradeIds: ['castleMaxHp', 'castleArmor', 'castleStartingShield', 'castleRegen', 'castleWaveRepair', 'castleSpikes'] },
  { label: '🧙 Fire Mage', upgradeIds: ['fireballDamage', 'fireballCastSpeed'] },
  { label: '💧 Global', upgradeIds: ['blueManaGain'] },
]
