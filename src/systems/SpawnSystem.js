import { UNIT_TYPES } from '../config/units.js';
import { CAMPAIGN_MAP } from '../config/campaign.js';
import { V_WIDTH, WALL_Y } from '../config/constants.js';
import { generateId } from '../core/utils.js';

/**
 * Adds burst particles to the state.
 * @param {object} s     - game state
 * @param {number} x
 * @param {number} y
 * @param {string} color
 * @param {number} count
 * @param {number} speed
 */
export function addParticle(s, x, y, color, count = 5, speed = 400) {
  for (let i = 0; i < count; i++) {
    s.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      life: 0.5 + Math.random() * 0.5,
      color,
      r: Math.random() * 6 + 2
    });
  }
}

/**
 * Spawns a unit into the game state.
 * @param {object} s          - game state
 * @param {string} typeKey    - key from UNIT_TYPES
 * @param {string} team       - 'player' | 'enemy'
 * @param {number|null} customX
 * @param {number|null} customY
 * @param {object} metaRef    - React ref to meta state
 */
export function spawnUnit(s, typeKey, team, customX = null, customY = null, metaRef) {
  const baseStats = UNIT_TYPES[typeKey];
  if (!baseStats) return;

  if (typeKey === 'BARRICADE' && team === 'player') {
    const barricades = s.units.filter(u => u.name === 'Bamboo Barricade' && u.team === 'player' && u.hp > 0);
    if (barricades.length >= 4) {
      const oldest = barricades[0];
      if (oldest) { oldest.hp = 0; oldest.noReward = true; }
    }
  }

  const laneX = customX !== null ? customX : 100 + (Math.random() * (V_WIDTH - 200));
  let hp = baseStats.hp;
  let damage = baseStats.damage;

  if (team === 'player' && typeKey !== 'BARRICADE' && typeKey !== 'CHAMPION') {
    const troopBuff = 1 + ((s.troopLevel[typeKey] || 1) - 1) * 0.25;
    hp *= troopBuff;
    damage *= troopBuff;

    if (typeKey === 'YUMI' && metaRef.current.conqueredRegions.includes('TENGU_PEAKS')) damage *= 1.5;
    if (typeKey === 'HATAMOTO' && metaRef.current.conqueredRegions.includes('IRON_MINES')) hp *= 1.5;

    if (metaRef.current.equippedHeirloom === 'DEMON_MASK') {
      hp *= 0.5;
      damage *= 3.0;
    }
  }

  if (team === 'enemy') {
    const threatMult = CAMPAIGN_MAP[s.currentRegion]?.threatLevel || 1;
    const mult = Math.pow(1.15, s.wave - 1) * (1 + (threatMult - 1) * 0.25);
    hp *= mult;
    damage *= mult;
  }

  let spawnY = customY !== null ? customY : -50;
  if (team === 'player' && customY === null) spawnY = WALL_Y - 20;

  const scatterX = (Math.random() - 0.5) * 15;
  const scatterY = (Math.random() - 0.5) * 15;

  let lifeSpan = undefined;
  if (typeKey === 'CHAMPION') lifeSpan = 12.0;

  let chargeTimer = 0;
  if (team === 'player' && typeKey === 'CAVALRY' && metaRef.current.unlockedTechs.includes('TAKEDA_CHARGE')) {
    chargeTimer = 2.0;
  }

  const idStr = generateId();
  const hash = parseInt(idStr, 36) % 1000;

  s.units.push({
    id: idStr, hashOffset: hash, team, ...baseStats,
    x: laneX + scatterX, y: spawnY + scatterY,
    hp, maxHp: hp, damage,
    speed: baseStats.speed * (0.9 + Math.random() * 0.2),
    attackCooldown: 0, swingPhase: 0,
    momentum: baseStats.momentum || 0,
    telegraphTimer: 0, lifeSpan, burn: 0, chargeTimer,
    stance: 'ATTACK'
  });
}
