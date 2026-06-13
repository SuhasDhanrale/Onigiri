import { V_HEIGHT } from '../config/constants.js';
import { damageOrb } from './CaveSystem.js';
import { pushFx } from '../renderer/drawSumiFx.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';

function bumpShake(s, amount) {
  s.screenShake = Math.max(s.screenShake, amount);
  bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
}

/**
 * Ticks all projectiles — moves them, checks hits, removes expired ones.
 * @param {object} s   - game state
 * @param {number} dt
 */
export function tickProjectiles(s, dt) {
  for (let i = s.projectiles.length - 1; i >= 0; i--) {
    const p = s.projectiles[i];

    if (p.type === 'lob') {
      p.progress += dt / p.travelTime;
      p.x = p.startX + (p.targetX - p.startX) * p.progress;
      p.y = p.startY + (p.targetY - p.startY) * p.progress;
      p.z = Math.sin(p.progress * Math.PI) * 150;

      if (p.progress >= 1.0) {
        bumpShake(s, 0.4);
        pushFx(s, { kind: 'shockwave', layer: 'foreground', x: p.x, y: p.y, radius: 126, color: '#dfd4ba', life: 0.42, maxLife: 0.42 });
        pushFx(s, { kind: 'impact_sparks', layer: 'foreground', x: p.x, y: p.y, radius: 82, color: '#d4af37', life: 0.34, maxLife: 0.34, rays: 12 });
        pushFx(s, { kind: 'smoke_puff', layer: 'foreground', x: p.x, y: p.y, radius: 74, color: 'rgba(27, 25, 24, 0.45)', life: 0.8, maxLife: 0.8 });
        
        if (p.isOrbAttack && s.orb && s.orb.active) {
          damageOrb(s, p.damage);
        } else {
          s.units.forEach(u => {
            if (u.team !== p.team && u.type !== 'flying' && Math.hypot(u.x - p.x, u.y - p.y) < 120) {
              u.hp -= p.damage;
              if (p.team === 'player' && s.combatStats) s.combatStats.damageDealt += p.damage;
              if (u.type !== 'shield' && u.type !== 'boss') {
                const angle = Math.atan2(u.y - p.y, u.x - p.x);
                u.x += Math.cos(angle) * 80;
                u.y += Math.sin(angle) * 80;
              } else {
                u.y += p.team === 'player' ? -15 : 15;
              }
            }
          });
        }
        s.projectiles.splice(i, 1);
      }
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      let hit = false;

      if (p.isOrbAttack && s.orb && s.orb.active) {
        const orbDist = Math.hypot(s.orb.x - p.x, s.orb.y - p.y);
        if (orbDist < s.orb.radius + 15) {
          damageOrb(s, p.damage);
          pushFx(s, { kind: 'impact_sparks', layer: 'foreground', x: s.orb.x, y: s.orb.y, radius: 54, color: '#b84235', life: 0.28, maxLife: 0.28, rays: 8 });
          pushFx(s, { kind: 'shockwave', layer: 'foreground', x: s.orb.x, y: s.orb.y, radius: 70, color: '#dfd4ba', life: 0.26, maxLife: 0.26 });
          hit = true;
        }
      } else {
        for (let j = 0; j < s.units.length; j++) {
          const u = s.units[j];
          if (u.team !== p.team && (u.x - p.x) ** 2 + (u.y - p.y) ** 2 < (u.radius + 15) ** 2) {
            let dmg = p.damage;
            if (u.type === 'shield' && p.vy > 0 && u.team === 'enemy') dmg *= 0.2;
            u.hp -= dmg;
            if (p.team === 'player' && s.combatStats) s.combatStats.damageDealt += dmg;
            if (p.isFlaming) u.burn = Math.max(u.burn || 0, 4.0);
            pushFx(s, {
              kind: 'impact_sparks',
              layer: 'foreground',
              x: p.x,
              y: p.y,
              radius: p.isFlaming ? 58 : 34,
              color: p.isFlaming ? '#ea580c' : '#dfd4ba',
              life: p.isFlaming ? 0.34 : 0.22,
              maxLife: p.isFlaming ? 0.34 : 0.22,
              rays: p.isFlaming ? 10 : 6,
            });
            if (p.isFlaming) {
              pushFx(s, { kind: 'smoke_puff', layer: 'foreground', x: p.x, y: p.y, radius: 36, color: 'rgba(234, 88, 12, 0.28)', life: 0.5, maxLife: 0.5, puffs: 4 });
            }
            if (!p.pierce) hit = true;
            if (hit) break;
          }
        }
      }

      if (hit || p.y < -100 || p.y > V_HEIGHT + 100) s.projectiles.splice(i, 1);
    }
  }
}
