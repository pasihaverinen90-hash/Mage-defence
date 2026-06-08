import type { EnemyDefinition, RunEnemy } from '../types/game'
import { REGULAR_ENEMY_POOL, BOSS_ENEMY } from '../data/enemies'
import { BALANCE } from '../data/balance'

export const WaveSystem = {
  isBossWave(wave: number): boolean {
    return wave % BALANCE.boss.waveInterval === 0
  },

  // Seconds between continuous spawns; the cadence speeds up as the wave rises.
  getSpawnInterval(wave: number): number {
    const s = BALANCE.spawn
    return Math.max(
      s.minIntervalSeconds,
      s.baseIntervalSeconds - (wave - 1) * s.intervalRampPerWave,
    )
  },

  // Pick a regular enemy for the wave. Stronger types unlock over time and we
  // mix across all unlocked tiers so the pressure stays varied.
  pickEnemyForWave(wave: number): EnemyDefinition {
    const maxIndex = Math.min(
      Math.floor((wave - 1) / 3),
      REGULAR_ENEMY_POOL.length - 1,
    )
    const index = Math.floor(Math.random() * (maxIndex + 1))
    return REGULAR_ENEMY_POOL[index]
  },

  getBossEnemy(): EnemyDefinition {
    return BOSS_ENEMY
  },

  // Build a live lane enemy with wave-scaled stats at a given position.
  createRunEnemy(
    def: EnemyDefinition,
    wave: number,
    id: string,
    x: number,
    y: number,
  ): RunEnemy {
    const waveIndex = wave - 1
    let hp = Math.floor(def.baseHp * Math.pow(def.hpScaling, waveIndex))
    let damage = Math.floor(def.baseDamage * Math.pow(def.damageScaling, waveIndex))

    if (def.isBoss) {
      hp *= BALANCE.boss.hpMultiplier
      damage *= BALANCE.boss.damageMultiplier
    }

    return {
      id,
      definition: def,
      hp,
      maxHp: hp,
      damage,
      attackInterval: def.baseAttackInterval,
      attackTimer: def.baseAttackInterval,
      x,
      y,
      speed: def.movementSpeed,
      baseSpeed: def.movementSpeed,
      slowFactor: 1,
      slowTimer: 0,
      stopX: BALANCE.arena.meleeX + def.stopDistanceFromWall,
      attacking: false,
    }
  },
}
