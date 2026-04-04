import { CAVE_CONFIG } from '../config/cave.js';
import { addParticle } from './SpawnSystem.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';

export function tickCave(s, dt) {
  if (!s.cave || !s.orb) return;

  if (s.cave.hp <= 0) {
    s.gameState = 'REGION_VICTORY';
    bus.emit(EVENTS.GAME_STATE_CHANGED, { state: s.gameState });
    return;
  }

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
