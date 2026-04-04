// --- CAVE & ORB CONFIG ---
// Alternative win condition: destroy the enemy cave by destroying orbs

import { V_WIDTH } from './constants.js';

export const CAVE_CONFIG = {
  // Cave settings
  cave: {
    x: V_WIDTH / 2,           // Center of map horizontally
    y: 120,                   // Near top of battlefield
    maxHp: 500,               // HP to destroy cave for victory
    radius: 80,               // Visual/collision radius
  },

  // Orb settings
  orb: {
    x: V_WIDTH / 2,           // Center of map horizontally
    y: 800,                   // Middle of battlefield (risk zone)
    maxHp: 150,               // HP per orb instance
    radius: 40,               // Visual/collision radius
    respawnTime: 45,          // Seconds until orb respawns
  },

  // Shockwave settings (when orb is destroyed)
  shockwave: {
    radius: 250,              // Area of effect
    damage: 9999,             // Instant kill for weak enemies
    caveDamage: 50,           // Damage dealt to cave per orb destruction
    maxEnemyHp: 200,          // Only enemies with hp <= this are killed
  }
};
