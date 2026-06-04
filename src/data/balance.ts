export const BALANCE = {
  castle: {
    baseHp: 100,
    baseArmor: 0,
    baseShield: 40,
    baseRegen: 0,                // HP/sec before upgrades
    baseWaveRepair: 0,           // HP healed per wave before upgrades
    spikeIntervalSeconds: 3,     // spikes tick this often
  },
  fireMage: {
    baseDamage: 10,
    baseCastInterval: 1.5, // seconds
  },
  upgrades: {
    // per-level additions / multipliers, keyed to upgrade definitions
    castleMaxHpPerLevel: 20,           // +20 max HP per level
    castleArmorPerLevel: 3,            // +3 flat damage reduction per level
    castleStartingShieldPerLevel: 15,  // +15 Magic Shield per level
    castleRegenPerLevel: 1,            // +1 HP/sec per level
    castleWaveRepairPerLevel: 10,      // +10 HP repaired each wave per level
    castleSpikesPerLevel: 3,           // +3 spike damage per tick per level
    fireballDamagePerLevel: 0.15,      // +15% Fireball damage per level
    fireballCastSpeedPerLevel: 0.08,   // -8% cast interval per level
    blueManaGainPerLevel: 0.15,        // +15% mana reward per level
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
