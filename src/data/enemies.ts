import type { EnemyDefinition } from '../types/game'

export const ENEMIES: Record<string, EnemyDefinition> = {
  slime: {
    id: 'slime',
    name: 'Slime',
    emoji: '🟢',
    baseHp: 20,
    baseDamage: 4,
    baseAttackInterval: 2.0,
    movementSpeed: 40,
    hpScaling: 1.12,
    damageScaling: 1.08,
    isBoss: false,
    attackType: 'melee',
    stopDistanceFromWall: 0,
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    emoji: '👺',
    baseHp: 40,
    baseDamage: 7,
    baseAttackInterval: 1.6,
    movementSpeed: 55,
    hpScaling: 1.14,
    damageScaling: 1.09,
    isBoss: false,
    attackType: 'melee',
    stopDistanceFromWall: 0,
  },
  skeletonMage: {
    id: 'skeletonMage',
    name: 'Skeleton Mage',
    emoji: '💀',
    baseHp: 30,
    baseDamage: 12,
    baseAttackInterval: 2.2,
    movementSpeed: 35,
    hpScaling: 1.13,
    damageScaling: 1.12,
    isBoss: false,
    attackType: 'ranged',
    stopDistanceFromWall: 175, // stops well short of the wall and shoots
    projectileSpeed: 280,
    projectileEmoji: '🔮',
  },
  arcaneBrute: {
    id: 'arcaneBrute',
    name: 'Arcane Brute',
    emoji: '👹',
    baseHp: 150,
    baseDamage: 18,
    baseAttackInterval: 2.5,
    movementSpeed: 22,
    hpScaling: 1.18,
    damageScaling: 1.14,
    isBoss: true,
    attackType: 'melee',
    stopDistanceFromWall: 0,
  },
}

// Ordered pool for regular waves (non-boss). Skeleton Mage (ranged) is placed
// at tier 1 so ranged pressure shows up by ~wave 4.
export const REGULAR_ENEMY_POOL: EnemyDefinition[] = [
  ENEMIES.slime,
  ENEMIES.skeletonMage,
  ENEMIES.goblin,
]

export const BOSS_ENEMY: EnemyDefinition = ENEMIES.arcaneBrute
