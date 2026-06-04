export const BALANCE = {
  mage: {
    baseHp: 100,
    baseDamage: 10,
    baseCastInterval: 1.5, // seconds
    baseDamageReduction: 0,
  },
  upgrades: {
    // per level multipliers / additions
    spellPowerPerLevel: 0.15,    // +15% damage per level
    maxHpPerLevel: 20,            // +20 HP per level
    castSpeedPerLevel: 0.08,     // -8% interval per level
    magicBarrierPerLevel: 3,     // +3 flat damage reduction per level
    blueManaGainPerLevel: 0.15,  // +15% mana reward per level
  },
  reward: {
    basePerWave: 5,
  },
  boss: {
    waveInterval: 10, // every 10th wave is a boss wave
    hpMultiplier: 4,
    damageMultiplier: 2,
  },
  wave: {
    enemiesPerWave: 3,
    bossEnemiesPerWave: 1,
  },
}
