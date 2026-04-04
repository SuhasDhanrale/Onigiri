import { CAVE_CONFIG } from '../config/cave.js';
import { addParticle, spawnUnit } from './SpawnSystem.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';

export function tickCave(s, dt, metaRef) {
  if (!s.cave || !s.orb) return;

  if (s.cave.hp <= 0) {
    s.gameState = 'REGION_VICTORY';
    bus.emit(EVENTS.GAME_STATE_CHANGED, { state: s.gameState });
    return;
  }

  // --- Orb respawn cycle ---
  if (s.orb.hp <= 0 && s.orb.respawnTimer === undefined) {
    destroyOrb(s);
    s.orb.respawnTimer = CAVE_CONFIG.orb.respawnTime;
  }

  if (s.orb.respawnTimer !== undefined && s.orb.respawnTimer > 0) {
    s.orb.respawnTimer -= dt;
    if (s.orb.respawnTimer <= 0) {
      s.orb.hp = s.orb.maxHp;
      s.orb.respawnTimer = undefined;
      s.orb.active = true;
      addParticle(s, s.orb.x, s.orb.y, '#7a5c61', 15, 300);
    }
  }

  // --- Rage mode: cave spawns enemies when HP < 50% ---
  const rageThreshold = CAVE_CONFIG.rage.threshold;
  const isRaging = (s.cave.hp / s.cave.maxHp) < rageThreshold;

  if (isRaging) {
    if (s.cave.rageSpawnTimer === undefined) {
      // First activation — stagger initial spawn by half interval
      s.cave.rageSpawnTimer = CAVE_CONFIG.rage.spawnInterval * 0.5;
    }
    s.cave.rageSpawnTimer -= dt;
    if (s.cave.rageSpawnTimer <= 0) {
      const count = CAVE_CONFIG.rage.spawnCount;
      for (let i = 0; i < count; i++) {
        const offsetX = (Math.random() - 0.5) * 120;
        spawnUnit(s, 'REBEL', 'enemy', s.cave.x + offsetX, s.cave.y + 20, metaRef);
      }
      // Visual burst from cave mouth
      addParticle(s, s.cave.x, s.cave.y, '#b84235', 12, 300);
      addParticle(s, s.cave.x, s.cave.y, '#7a5c61', 8, 200);
      s.screenShake = 0.2;
      bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
      s.cave.rageSpawnTimer = CAVE_CONFIG.rage.spawnInterval;
    }
  } else {
    // Reset rage timer if HP recovers above threshold (edge case safety)
    s.cave.rageSpawnTimer = undefined;
  }
}

export function destroyOrb(s) {
  const cfg = CAVE_CONFIG.shockwave;
  
  addParticle(s, s.orb.x, s.orb.y, '#b84235', 30, 500);
  addParticle(s, s.orb.x, s.orb.y, '#7a5c61', 20, 400);

  s.units.forEach(u => {
    if (u.team === 'enemy' && u.hp > 0 && u.hp <= cfg.maxEnemyHp) {
      const dist = Math.hypot(u.x - s.orb.x, u.y - s.orb.y);
      if (dist <= cfg.radius) {
        u.hp = 0;
        addParticle(s, u.x, u.y, '#b84235', 5, 200);
      }
    }
  });

  s.cave.hp -= cfg.caveDamage;
  s.screenShake = 0.5;
  bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });

  s.orb.active = false;
}

export function canAttackOrb(s, unit) {
  if (!s.orb || !s.orb.active || s.orb.hp <= 0) return false;
  if (unit.team !== 'player') return false;
  if (unit.type !== 'ranged' && unit.type !== 'siege') return false;
  
  const dist = Math.hypot(unit.x - s.orb.x, unit.y - s.orb.y);
  return dist <= unit.range;
}

export function damageOrb(s, damage) {
  if (!s.orb || !s.orb.active || s.orb.hp <= 0) return;
  
  s.orb.hp -= damage;
  if (s.orb.hp < 0) s.orb.hp = 0;
  
  addParticle(s, s.orb.x + (Math.random() - 0.5) * 40, s.orb.y + (Math.random() - 0.5) * 40, '#b84235', 3, 150);
}

/**
 * Melee units that push far enough north (near the cave) deal slow chip damage to the cave.
 * Weak by design — rewards aggressive play without replacing the orb path.
 */
export function tickMeleeCaveDamage(s, dt) {
  if (!s.cave || s.cave.hp <= 0) return;

  const cfg = CAVE_CONFIG.meleePush;
  const reachY = s.cave.y + s.cave.radius + cfg.reachY;

  const meleeNearCave = s.units.filter(u =>
    u.team === 'player' &&
    (u.type === 'melee' || u.type === 'cavalry' || u.type === 'shield') &&
    u.hp > 0 &&
    u.y <= reachY
  );

  if (meleeNearCave.length > 0) {
    s.cave.hp -= meleeNearCave.length * cfg.damagePerUnitPerSec * dt;
    if (s.cave.hp < 0) s.cave.hp = 0;

    // Occasional visual spark so the player knows something is happening
    if (Math.random() < dt * meleeNearCave.length * 2) {
      addParticle(s, s.cave.x + (Math.random() - 0.5) * s.cave.radius, s.cave.y + (Math.random() - 0.5) * s.cave.radius, '#d4af37', 3, 150);
    }
  }
}
