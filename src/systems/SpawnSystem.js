import { UNIT_TYPES } from '../config/units.js';
import { V_WIDTH, WALL_Y } from '../config/constants.js';
import { generateId } from '../core/utils.js';
import { initSlotArray } from './SlotManager.js';

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
  let range = baseStats.range;

  if (team === 'player' && typeKey !== 'BARRICADE' && typeKey !== 'CHAMPION' && typeKey !== 'ARROW_TOWER') {
    const troopBuff = 1 + ((s.troopLevel[typeKey] || 1) - 1) * 0.25;
    hp *= troopBuff;
    damage *= troopBuff;

    if (typeKey === 'YUMI' && metaRef.current.conqueredRegions.includes('TENGU_PEAKS')) damage *= 1.5;
    if (typeKey === 'HATAMOTO' && metaRef.current.conqueredRegions.includes('IRON_MINES')) hp *= 1.5;

    if (metaRef.current.equippedItem === 'DEMON_MASK') {
      hp *= 0.5;
      damage *= 3.0;
    }

    // Blessing & curse multipliers — stack multiplicatively with heirloom above.
    // activeDamageMult affects damage ONLY (not hp) — see Step 9 hallucination guard.
    hp     *= (metaRef.current.activeMaxHpMult      ?? 1.0);
    hp     *= (metaRef.current.activeCurseMaxHpMult  ?? 1.0);
    damage *= (metaRef.current.activeDamageMult      ?? 1.0);
    damage *= (metaRef.current.activeCurseDamageMult ?? 1.0);
    if (baseStats.type === 'ranged') range *= (metaRef.current.activeArcherRangeMult ?? 1.0);  // EAGLE_EYE blessing
    // Shop run-buffs (stored on game state in startCombat)
    hp     *= (s.shopUnitStatMult ?? 1.0);      // elite_training (+15% all stats)
    damage *= (s.shopUnitStatMult ?? 1.0);      // elite_training (+15% all stats)
    if (baseStats.type === 'ranged') damage *= (s.shopArcherFireMult ?? 1.0);  // flaming_arrows_shop (+25% archer dmg)
    // Note: activeAttackSpeedMult and activeMoveSpeedMult are applied per-frame in CombatSystem
  }

  if (typeKey === 'ARROW_TOWER') {
    hp *= (s.shopTowerHpMult ?? 1.0);  // iron_fortifications (+100% tower HP)
  }

  if (team === 'enemy') {
    const waveMult = Math.pow(1.15, s.wave - 1);
    const chapterEnemyStatMult = metaRef?.current?.activeChapterEnemyStatMult ?? 1;
    const mult = waveMult * chapterEnemyStatMult;
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
  if (team === 'player' && typeKey === 'CAVALRY' && metaRef.current.unlockedProvisions.includes('TAKEDA_CHARGE')) {
    chargeTimer = 2.0;
  }

  const idStr = generateId();
  const hash = parseInt(idStr, 36) % 1000;

  s.units.push({
    id: idStr, hashOffset: hash, team, ...baseStats,
    x: laneX + scatterX, y: spawnY + scatterY,
    hp, maxHp: hp, damage, range,
    speed: baseStats.speed * (0.9 + Math.random() * 0.2),
    attackCooldown: 0, swingPhase: 0,
    momentum: baseStats.momentum || 0,
    telegraphTimer: 0, lifeSpan, burn: 0, chargeTimer,
    stance: 'ATTACK'
  });

  const spawnedUnit = s.units[s.units.length - 1];
  initSlotArray(spawnedUnit);
  if (chargeTimer > 0) {
    s.floatingTexts.push({ x: spawnedUnit.x, y: spawnedUnit.y - 18, text: 'CHARGE', color: '#dfd4ba', life: 0.65, vy: -24 });
  }
}
