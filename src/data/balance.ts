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
  // Recruits have no MP — their one auto skill scales off a single "mastery"
  // level (cooldown + main effect together). mastery*PerLevel live with each skill.
  iceMage: {
    baseDamage: 8,
    baseCastInterval: 1.7, // seconds
    slowFactor: 0.6, // Ice Shard slows the target to 60% speed
    slowDurationSec: 1.5,
    blizzard: {
      cooldownSec: 14,
      minCooldownSec: 6,
      baseDurationSec: 5,
      baseSlowPercent: 0.25, // 25% slow → factor 0.75
      maxSlowPercent: 0.5, // capped so it never freezes the field
      baseTickDamage: 2, // light DoT (control skill, not burst)
      tickInterval: 0.5,
      range: 700, // auto-cast when enemy pressure is within this distance
      masterySlowPerLevel: 0.025,    // +2.5% slow per mastery (capped at maxSlowPercent)
      masteryDurationPerLevel: 0.4,  // +0.4s duration per mastery
      masteryDamagePerLevel: 0.6,    // +0.6 tick damage per mastery
      masteryCooldownPerLevel: 0.8,  // -0.8s cooldown per mastery
    },
  },
  lightningMage: {
    baseDamage: 6, // lower than Fire Mage but faster
    baseCastInterval: 1.0, // seconds (fast)
    chainLightning: {
      cooldownSec: 6,
      minCooldownSec: 2,
      baseDamage: 14,
      baseJumps: 2, // extra targets beyond the first (hits up to 3)
      jumpRadius: 90,
      falloff: 0.6, // each jump deals 60% of the previous hit
      range: 700, // auto-cast when an enemy is within this distance
      masteryDamagePerLevel: 2.5,    // +2.5 damage per mastery
      masteryCooldownPerLevel: 0.4,  // -0.4s cooldown per mastery
      masteryJumpsEvery: 4,          // +1 extra jump every 4 mastery levels
    },
  },
  archer: {
    baseDamage: 7, // single-target, lower per hit but fast
    baseCastInterval: 0.8, // seconds (fastest defender)
    piercingShot: {
      cooldownSec: 7,
      minCooldownSec: 3,
      baseDamage: 20,
      baseWidth: 40, // vertical band thickness (hits enemies near the target's Y)
      range: 760, // auto-cast when an enemy is within this distance
      masteryDamagePerLevel: 3,      // +3 damage per mastery
      masteryWidthPerLevel: 6,       // +6 band width per mastery
      masteryCooldownPerLevel: 0.4,  // -0.4s cooldown per mastery
    },
  },
  necromancer: {
    baseDamage: 11, // moderate, slower than Archer
    baseCastInterval: 1.6, // seconds (slow)
    raiseSkeleton: {
      cooldownSec: 10,
      minCooldownSec: 4,
      baseHp: 60,
      baseDurationSec: 8,
      baseAoeDamage: 5, // small melee swipe
      aoeInterval: 1.0,
      tauntRadius: 90,
      aoeRadius: 55,
      range: 700, // auto-cast when enemy pressure is within this distance
      masteryHpPerLevel: 12,         // +12 skeleton HP per mastery
      masteryDamagePerLevel: 1.5,    // +1.5 melee damage per mastery
      masteryDurationPerLevel: 0.5,  // +0.5s duration per mastery
      masteryCooldownPerLevel: 0.6,  // -0.6s cooldown per mastery
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
    iceShardDamagePerLevel: 0.15,      // +15% Ice Shard damage per level
    iceShardCastSpeedPerLevel: 0.08,   // -8% cast interval per level
    lightningBoltDamagePerLevel: 0.15,    // +15% Lightning Bolt damage per level
    lightningBoltCastSpeedPerLevel: 0.08, // -8% cast interval per level
    arrowDamagePerLevel: 0.15,            // +15% Arrow Shot damage per level
    arrowAttackSpeedPerLevel: 0.08,       // -8% attack interval per level
    shadowBoltDamagePerLevel: 0.15,       // +15% Shadow Bolt damage per level
    shadowBoltCastSpeedPerLevel: 0.08,    // -8% cast interval per level
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
