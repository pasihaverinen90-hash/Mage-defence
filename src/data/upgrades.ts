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
  fireMageMaxMp: {
    id: 'fireMageMaxMp', category: 'fireMage', field: 'maxMp',
    name: 'Max MP', description: '+20 max MP per level', emoji: '🔷',
    costBase: 14, costMultiplier: 1.6, maxLevel: 30,
  },
  fireMageMpRegen: {
    id: 'fireMageMpRegen', category: 'fireMage', field: 'mpRegen',
    name: 'MP Regen', description: '+1 MP/sec per level', emoji: '🌀',
    costBase: 16, costMultiplier: 1.6, maxLevel: 30,
  },
  blueManaGain: {
    id: 'blueManaGain', category: 'global', field: 'blueManaGain',
    name: 'Blue Mana Gain', description: '+15% mana reward per level', emoji: '💧',
    costBase: 20, costMultiplier: 1.8, maxLevel: 20,
  },
  iceShardDamage: {
    id: 'iceShardDamage', category: 'iceMage', field: 'iceShardDamage',
    name: 'Ice Shard Damage', description: '+15% Ice Shard damage per level', emoji: '❄️',
    costBase: 10, costMultiplier: 1.6, maxLevel: 50,
  },
  iceShardCastSpeed: {
    id: 'iceShardCastSpeed', category: 'iceMage', field: 'iceShardCastSpeed',
    name: 'Ice Cast Speed', description: '-8% cast interval per level', emoji: '⚡',
    costBase: 12, costMultiplier: 1.65, maxLevel: 10,
  },
  iceMageMaxMp: {
    id: 'iceMageMaxMp', category: 'iceMage', field: 'maxMp',
    name: 'Ice Max MP', description: '+20 max MP per level', emoji: '🔷',
    costBase: 14, costMultiplier: 1.6, maxLevel: 30,
  },
  iceMageMpRegen: {
    id: 'iceMageMpRegen', category: 'iceMage', field: 'mpRegen',
    name: 'Ice MP Regen', description: '+1 MP/sec per level', emoji: '🌀',
    costBase: 16, costMultiplier: 1.6, maxLevel: 30,
  },
  lightningBoltDamage: {
    id: 'lightningBoltDamage', category: 'lightningMage', field: 'lightningBoltDamage',
    name: 'Lightning Dmg', description: '+15% Lightning Bolt damage per level', emoji: '⚡',
    costBase: 10, costMultiplier: 1.6, maxLevel: 50,
  },
  lightningBoltCastSpeed: {
    id: 'lightningBoltCastSpeed', category: 'lightningMage', field: 'lightningBoltCastSpeed',
    name: 'Lightning Cast', description: '-8% cast interval per level', emoji: '⚡',
    costBase: 12, costMultiplier: 1.65, maxLevel: 10,
  },
  lightningMageMaxMp: {
    id: 'lightningMageMaxMp', category: 'lightningMage', field: 'maxMp',
    name: 'Lightning MP', description: '+20 max MP per level', emoji: '🔷',
    costBase: 14, costMultiplier: 1.6, maxLevel: 30,
  },
  lightningMageMpRegen: {
    id: 'lightningMageMpRegen', category: 'lightningMage', field: 'mpRegen',
    name: 'Lightning Regen', description: '+1 MP/sec per level', emoji: '🌀',
    costBase: 16, costMultiplier: 1.6, maxLevel: 30,
  },
  chainLightningDamage: {
    id: 'chainLightningDamage', category: 'lightningMage', field: 'chainLightningDamage',
    name: 'Chain Dmg', description: '+3 Chain Lightning damage per level', emoji: '⚡',
    costBase: 18, costMultiplier: 1.6, maxLevel: 30,
  },
  chainLightningJumps: {
    id: 'chainLightningJumps', category: 'lightningMage', field: 'chainLightningJumps',
    name: 'Chain Jumps', description: '+1 chain jump per level', emoji: '🔗',
    costBase: 40, costMultiplier: 2.0, maxLevel: 3,
  },
  chainLightningCooldown: {
    id: 'chainLightningCooldown', category: 'lightningMage', field: 'chainLightningCooldown',
    name: 'Chain Cooldown', description: '-1s Chain Lightning cooldown per level', emoji: '⌛',
    costBase: 30, costMultiplier: 1.8, maxLevel: 4,
  },
  arrowDamage: {
    id: 'arrowDamage', category: 'archer', field: 'arrowDamage',
    name: 'Arrow Damage', description: '+15% Arrow Shot damage per level', emoji: '🏹',
    costBase: 10, costMultiplier: 1.6, maxLevel: 50,
  },
  arrowAttackSpeed: {
    id: 'arrowAttackSpeed', category: 'archer', field: 'arrowAttackSpeed',
    name: 'Arrow Speed', description: '-8% attack interval per level', emoji: '⚡',
    costBase: 12, costMultiplier: 1.65, maxLevel: 10,
  },
  archerMaxMp: {
    id: 'archerMaxMp', category: 'archer', field: 'maxMp',
    name: 'Archer MP', description: '+20 max MP per level', emoji: '🔷',
    costBase: 14, costMultiplier: 1.6, maxLevel: 30,
  },
  archerMpRegen: {
    id: 'archerMpRegen', category: 'archer', field: 'mpRegen',
    name: 'Archer Regen', description: '+1 MP/sec per level', emoji: '🌀',
    costBase: 16, costMultiplier: 1.6, maxLevel: 30,
  },
  piercingShotDamage: {
    id: 'piercingShotDamage', category: 'archer', field: 'piercingShotDamage',
    name: 'Pierce Dmg', description: '+4 Piercing Shot damage per level', emoji: '🏹',
    costBase: 18, costMultiplier: 1.6, maxLevel: 30,
  },
  piercingShotWidth: {
    id: 'piercingShotWidth', category: 'archer', field: 'piercingShotWidth',
    name: 'Pierce Width', description: '+12 band width per level', emoji: '↕️',
    costBase: 20, costMultiplier: 1.6, maxLevel: 20,
  },
  piercingShotCooldown: {
    id: 'piercingShotCooldown', category: 'archer', field: 'piercingShotCooldown',
    name: 'Pierce Cooldown', description: '-1s Piercing Shot cooldown per level', emoji: '⌛',
    costBase: 30, costMultiplier: 1.8, maxLevel: 4,
  },
  shadowBoltDamage: {
    id: 'shadowBoltDamage', category: 'necromancer', field: 'shadowBoltDamage',
    name: 'Shadow Damage', description: '+15% Shadow Bolt damage per level', emoji: '🟣',
    costBase: 10, costMultiplier: 1.6, maxLevel: 50,
  },
  shadowBoltCastSpeed: {
    id: 'shadowBoltCastSpeed', category: 'necromancer', field: 'shadowBoltCastSpeed',
    name: 'Shadow Cast', description: '-8% cast interval per level', emoji: '⚡',
    costBase: 12, costMultiplier: 1.65, maxLevel: 10,
  },
  necromancerMaxMp: {
    id: 'necromancerMaxMp', category: 'necromancer', field: 'maxMp',
    name: 'Necro MP', description: '+20 max MP per level', emoji: '🔷',
    costBase: 14, costMultiplier: 1.6, maxLevel: 30,
  },
  necromancerMpRegen: {
    id: 'necromancerMpRegen', category: 'necromancer', field: 'mpRegen',
    name: 'Necro Regen', description: '+1 MP/sec per level', emoji: '🌀',
    costBase: 16, costMultiplier: 1.6, maxLevel: 30,
  },
  raiseSkeletonHp: {
    id: 'raiseSkeletonHp', category: 'necromancer', field: 'raiseSkeletonHp',
    name: 'Skeleton HP', description: '+20 skeleton HP per level', emoji: '🦴',
    costBase: 16, costMultiplier: 1.6, maxLevel: 30,
  },
  raiseSkeletonDuration: {
    id: 'raiseSkeletonDuration', category: 'necromancer', field: 'raiseSkeletonDuration',
    name: 'Skeleton Time', description: '+1s skeleton duration per level', emoji: '⏳',
    costBase: 18, costMultiplier: 1.6, maxLevel: 20,
  },
  raiseSkeletonDamage: {
    id: 'raiseSkeletonDamage', category: 'necromancer', field: 'raiseSkeletonDamage',
    name: 'Skeleton Dmg', description: '+2 skeleton melee damage per level', emoji: '💀',
    costBase: 16, costMultiplier: 1.6, maxLevel: 30,
  },
  raiseSkeletonCooldown: {
    id: 'raiseSkeletonCooldown', category: 'necromancer', field: 'raiseSkeletonCooldown',
    name: 'Skeleton CD', description: '-1s Raise Skeleton cooldown per level', emoji: '⌛',
    costBase: 30, costMultiplier: 1.8, maxLevel: 4,
  },
}

export interface UpgradeSection {
  label: string
  upgradeIds: string[]
  requiresRecruit?: string // only shown once this recruit is owned
}

export const UPGRADE_SECTIONS: UpgradeSection[] = [
  { label: '🏰 Castle', upgradeIds: ['castleMaxHp', 'castleArmor', 'castleStartingShield', 'castleRegen', 'castleWaveRepair', 'castleSpikes'] },
  { label: '🧙 Fire Mage', upgradeIds: ['fireballDamage', 'fireballCastSpeed', 'fireMageMaxMp', 'fireMageMpRegen'] },
  { label: '🥶 Ice Mage', upgradeIds: ['iceShardDamage', 'iceShardCastSpeed', 'iceMageMaxMp', 'iceMageMpRegen'], requiresRecruit: 'iceMage' },
  { label: '⚡ Lightning Mage', upgradeIds: ['lightningBoltDamage', 'lightningBoltCastSpeed', 'lightningMageMaxMp', 'lightningMageMpRegen', 'chainLightningDamage', 'chainLightningJumps', 'chainLightningCooldown'], requiresRecruit: 'lightningMage' },
  { label: '🏹 Archer', upgradeIds: ['arrowDamage', 'arrowAttackSpeed', 'archerMaxMp', 'archerMpRegen', 'piercingShotDamage', 'piercingShotWidth', 'piercingShotCooldown'], requiresRecruit: 'archer' },
  { label: '☠️ Necromancer', upgradeIds: ['shadowBoltDamage', 'shadowBoltCastSpeed', 'necromancerMaxMp', 'necromancerMpRegen', 'raiseSkeletonHp', 'raiseSkeletonDuration', 'raiseSkeletonDamage', 'raiseSkeletonCooldown'], requiresRecruit: 'necromancer' },
  { label: '💧 Global', upgradeIds: ['blueManaGain'] },
]
