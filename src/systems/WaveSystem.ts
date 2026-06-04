import type { EnemyDefinition, RunEnemy } from '../types/game'
import { REGULAR_ENEMY_POOL, BOSS_ENEMY } from '../data/enemies'
import { BALANCE } from '../data/balance'

export const WaveSystem = {
  isBossWave(wave: number): boolean {
    return wave % BALANCE.boss.waveInterval === 0
  },

  // Ordered list of enemy definitions to spawn over time during a wave.
  getSpawnPlanForWave(wave: number): EnemyDefinition[] {
    if (WaveSystem.isBossWave(wave)) {
      return [BOSS_ENEMY]
    }

    // Favour stronger enemies in later waves by walking up the pool.
    const poolIndex = Math.min(
      Math.floor((wave - 1) / 3),
      REGULAR_ENEMY_POOL.length - 1,
    )
    const def = REGULAR_ENEMY_POOL[poolIndex]
    return Array.from({ length: BALANCE.wave.enemiesPerWave }, () => def)
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
      hasReachedMage: false,
    }
  },
}
