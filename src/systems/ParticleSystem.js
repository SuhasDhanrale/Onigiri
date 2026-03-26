import { V_WIDTH } from '../config/constants.js';

/**
 * Ticks particle positions and removes expired particles.
 * Also ticks floatingTexts, slashTrails, explosions, lightnings.
 * @param {object} s   - game state
 * @param {number} dt
 */
export function tickParticles(s, dt) {
  for (let i = s.particles.length - 1; i >= 0; i--) {
    const p = s.particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) s.particles.splice(i, 1);
  }
  for (let i = s.lightnings.length - 1; i >= 0; i--) {
    s.lightnings[i].life -= dt;
    if (s.lightnings[i].life <= 0) s.lightnings.splice(i, 1);
  }
}

/**
 * Ticks floating texts, slash trails, and explosions.
 * @param {object} s   - game state
 * @param {number} dt
 */
export function tickEffects(s, dt) {
  for (let i = s.explosions.length - 1; i >= 0; i--) {
    s.explosions[i].life -= dt;
    if (s.explosions[i].life <= 0) s.explosions.splice(i, 1);
  }
  for (let i = s.slashTrails.length - 1; i >= 0; i--) {
    s.slashTrails[i].life -= dt * 4;
    if (s.slashTrails[i].life <= 0) s.slashTrails.splice(i, 1);
  }
  for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
    s.floatingTexts[i].life -= dt;
    s.floatingTexts[i].y += s.floatingTexts[i].vy * dt;
    if (s.floatingTexts[i].life <= 0) s.floatingTexts.splice(i, 1);
  }
}

/**
 * Ticks the ink line (enemy advance indicator) and spawns ink drip particles.
 * @param {object} s   - game state
 * @param {number} dt
 */
export function tickInkLine(s, dt) {
  const enemies = s.units.filter(u => u.team === 'enemy');
  let targetInkY = -100;
  enemies.forEach(e => { if (e.y < 1320 && e.y > targetInkY) targetInkY = e.y + 60; });
  if (s.waveState !== 'SPAWNING' && enemies.length === 0) targetInkY = -100;

  const diff = targetInkY - s.inkLineY;
  s.inkLineY += diff * dt * 1.5;

  if (s.inkLineY > 0 && Math.random() < dt * 15) {
    s.particles.push({
      x: Math.random() * V_WIDTH, y: s.inkLineY + (Math.random() - 0.5) * 60,
      vx: 0, vy: Math.random() * 80 + 30,
      life: 1.0 + Math.random(),
      color: Math.random() > 0.3 ? 'rgba(27, 25, 24, 0.25)' : 'rgba(184, 66, 53, 0.3)',
      r: Math.random() * 4 + 1,
      isDrip: true
    });
  }
}
