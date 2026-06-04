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
    perKill: 1,
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
  arena: {
    mageX: 100,      // mage stands near the left
    laneY: 210,      // vertical centre of the lane
    spawnX: 760,     // enemies spawn near the right
    meleeX: 185,     // enemies stop here and attack the mage
    laneJitter: 26,  // +/- vertical spread so enemies don't fully overlap
  },
  spawn: {
    intervalSeconds: 1.2,      // delay between enemy spawns within a wave
    initialDelaySeconds: 0.4,  // delay before the first enemy of a wave
    interWaveSeconds: 0.6,     // pause between clearing a wave and the next
  },
}
