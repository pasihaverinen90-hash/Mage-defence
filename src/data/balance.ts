export const BALANCE = {
  mage: {
    baseHp: 100,
    baseDamage: 10,
    baseCastInterval: 1.5, // seconds
    baseDamageReduction: 0,
  },
  castle: {
    // Temporary flat starting Magic Shield until the castle upgrade tree exists.
    baseShield: 40,
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
    perKill: 1,
  },
  boss: {
    waveInterval: 10, // every 10th wave is a boss wave
    hpMultiplier: 4,
    damageMultiplier: 2,
  },
  wave: {
    secondsPerWave: 9, // wave number ticks up on this cadence (continuous pressure)
  },
  arena: {
    mageX: 100,      // mage stands near the left, on the gate
    laneY: 210,      // vertical centre line (mage / fireball origin)
    spawnX: 760,     // enemies spawn near the right
    meleeX: 185,     // enemies stop here and attack the castle
    laneTop: 120,    // top of the battlefield band where enemies spawn
    laneBottom: 300, // bottom of the battlefield band
  },
  spawn: {
    baseIntervalSeconds: 1.4,   // gap between spawns early on
    minIntervalSeconds: 0.45,   // fastest spawn cadence at high waves
    intervalRampPerWave: 0.05,  // spawns speed up each wave
    initialDelaySeconds: 0.4,   // delay before the very first spawn
    maxActive: 24,              // soft cap on concurrent enemies (perf safety)
  },
}
