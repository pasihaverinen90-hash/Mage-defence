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
    baseMaxMp: 100,
    baseMpRegen: 5, // MP/sec
    fireWall: {
      mpCost: 30,
      cooldownSec: 6,
      baseTickDamage: 8,
      tickInterval: 0.5, // seconds between burns
      baseDurationSec: 4,
      baseWidth: 46, // x-thickness of the burning zone
      height: 190, // covers the full enemy band
    },
    firestorm: {
      mpCost: 45,
      cooldownSec: 9,
      baseTickDamage: 6,
      tickInterval: 0.5,
      baseDurationSec: 5,
      baseRadius: 70,
    },
    fireElemental: {
      mpCost: 60,
      cooldownSec: 14,
      baseHp: 120,
      baseDurationSec: 10,
      baseAoeDamage: 10,
      aoeInterval: 1.0, // Fire Bash every second
      tauntRadius: 95, // enemies within this distance target the elemental
      aoeRadius: 75, // Fire Bash reach
    },
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
    fireMageMaxMpPerLevel: 20,         // +20 max MP per level
    fireMageMpRegenPerLevel: 1,        // +1 MP/sec per level
    fireWallDamagePerLevel: 2,         // +2 tick damage per level
    fireWallDurationPerLevel: 0.5,     // +0.5s duration per level
    fireWallSizePerLevel: 8,           // +8 width per level
    firestormDamagePerLevel: 2,        // +2 tick damage per level
    firestormDurationPerLevel: 0.5,    // +0.5s duration per level
    firestormAreaPerLevel: 8,          // +8 radius per level
    fireElementalPowerPerLevel: 3,     // +3 Fire Bash damage per level
    fireElementalDurationPerLevel: 1,  // +1s duration per level
    fireElementalHealthPerLevel: 30,   // +30 HP per level
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
    towerNorthY: 135, // future recruit slot position on the wall
    towerSouthY: 285, // future recruit slot position on the wall
  },
  spawn: {
    baseIntervalSeconds: 1.4,   // gap between spawns early on
    minIntervalSeconds: 0.45,   // fastest spawn cadence at high waves
    intervalRampPerWave: 0.05,  // spawns speed up each wave
    initialDelaySeconds: 0.4,   // delay before the very first spawn
    maxActive: 24,              // soft cap on concurrent enemies (perf safety)
  },
}
