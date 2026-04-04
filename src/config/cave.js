// --- CAVE & ORB CONFIG ---
// Alternative win condition: destroy the enemy cave by destroying orbs

import { V_WIDTH } from './constants.js';

export const CAVE_CONFIG = {
  // Cave settings
  cave: {
    x: V_WIDTH / 2,           // Center of map horizontally
    y: 120,                   // Near top of battlefield
    maxHp: 500,               // HP to destroy cave for victory (5 orb kills @ 100 dmg each)
    radius: 80,               // Visual/collision radius
  },

  // Orb settings
  orb: {
    x: V_WIDTH / 2,           // Center of map horizontally
    y: 800,                   // Middle of battlefield (risk zone)
    maxHp: 120,               // HP per orb instance (was 150 — easier to focus-fire)
    radius: 40,               // Visual/collision radius
    respawnTime: 20,          // Seconds until orb respawns (was 45 — less dead time)
  },

  // Shockwave settings (when orb is destroyed)
  shockwave: {
    radius: 250,              // Area of effect
    damage: 9999,             // Instant kill for weak enemies
    caveDamage: 100,          // Damage dealt to cave per orb destruction (was 50 — now 5 kills = win)
    maxEnemyHp: 200,          // Only enemies with hp <= this are killed
  },

  // Rage mode — cave fights back below 50% HP
  rage: {
    threshold: 0.5,           // Fraction of cave HP that activates rage
    spawnInterval: 8,         // Seconds between rage spawns
    spawnCount: 2,            // Number of enemies spawned per rage tick
  },

  // Melee push — player melee units near the cave deal tick damage
  meleePush: {
    reachY: 80,               // How far below cave.y melee units must be to deal damage (cave.y + radius + this)
    damagePerUnitPerSec: 2,   // HP/sec per melee unit in range
  },
};
