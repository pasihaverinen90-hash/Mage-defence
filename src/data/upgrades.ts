import type { UpgradeDefinition } from '../types/game'

export const UPGRADES: Record<string, UpgradeDefinition> = {
  spellPower: {
    id: 'spellPower',
    name: 'Spell Power',
    description: '+15% damage per level',
    emoji: '🔥',
    costBase: 10,
    costMultiplier: 1.6,
    maxLevel: 50,
  },
  maxHp: {
    id: 'maxHp',
    name: 'Max HP',
    description: '+20 HP per level',
    emoji: '❤️',
    costBase: 8,
    costMultiplier: 1.5,
    maxLevel: 50,
  },
  castSpeed: {
    id: 'castSpeed',
    name: 'Cast Speed',
    description: '-8% cast interval per level',
    emoji: '⚡',
    costBase: 12,
    costMultiplier: 1.65,
    maxLevel: 10, // hard cap so interval never reaches 0
  },
  magicBarrier: {
    id: 'magicBarrier',
    name: 'Magic Barrier',
    description: '+3 damage reduction per level',
    emoji: '🛡️',
    costBase: 15,
    costMultiplier: 1.7,
    maxLevel: 30,
  },
  blueManaGain: {
    id: 'blueManaGain',
    name: 'Blue Mana Gain',
    description: '+15% mana reward per level',
    emoji: '💧',
    costBase: 20,
    costMultiplier: 1.8,
    maxLevel: 20,
  },
}

export const UPGRADE_ORDER: string[] = [
  'spellPower',
  'maxHp',
  'castSpeed',
  'magicBarrier',
  'blueManaGain',
]
