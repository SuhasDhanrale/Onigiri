import { V_HEIGHT } from '../config/constants.js';
import { damageOrb } from './CaveSystem.js';

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
        s.screenShake = 0.4;
        
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
            if (!p.pierce) hit = true;
            if (hit) break;
          }
        }
      }

      if (hit || p.y < -100 || p.y > V_HEIGHT + 100) s.projectiles.splice(i, 1);
    }
  }
}
