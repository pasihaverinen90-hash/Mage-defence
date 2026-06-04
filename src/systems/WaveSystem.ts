import type { EnemyDefinition, EnemyInstance } from '../types/game'
import { REGULAR_ENEMY_POOL, BOSS_ENEMY } from '../data/enemies'
import { BALANCE } from '../data/balance'

export const WaveSystem = {
  isBossWave(wave: number): boolean {
    return wave % BALANCE.boss.waveInterval === 0
  },

  scaleEnemy(def: EnemyDefinition, wave: number): EnemyInstance {
    const waveIndex = wave - 1
    const hp = Math.floor(def.baseHp * Math.pow(def.hpScaling, waveIndex))
    const damage = Math.floor(def.baseDamage * Math.pow(def.damageScaling, waveIndex))

    if (def.isBoss) {
      return {
        definition: def,
        maxHp: hp * BALANCE.boss.hpMultiplier,
        hp: hp * BALANCE.boss.hpMultiplier,
        damage: damage * BALANCE.boss.damageMultiplier,
        attackInterval: def.baseAttackInterval,
      }
    }

    return {
      definition: def,
      maxHp: hp,
      hp: hp,
      damage,
      attackInterval: def.baseAttackInterval,
    }
  },

  getEnemiesForWave(wave: number): EnemyInstance[] {
    if (WaveSystem.isBossWave(wave)) {
      return [WaveSystem.scaleEnemy(BOSS_ENEMY, wave)]
    }

    const count = BALANCE.wave.enemiesPerWave
    const enemies: EnemyInstance[] = []
    // Cycle through the pool, favouring stronger enemies in later waves
    const poolIndex = Math.min(
      Math.floor((wave - 1) / 3),
      REGULAR_ENEMY_POOL.length - 1,
    )
    const def = REGULAR_ENEMY_POOL[poolIndex]
    for (let i = 0; i < count; i++) {
      enemies.push(WaveSystem.scaleEnemy(def, wave))
    }
    return enemies
  },
}
