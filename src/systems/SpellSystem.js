import { WALL_Y } from '../config/constants.js';
import { addParticle } from './SpawnSystem.js';

/**
 * Ticks fox fire zones — damages enemies inside and spawns fire particles.
 * @param {object} s   - game state
 * @param {number} dt
 */
export function tickFoxFires(s, dt) {
  const enemies = s.units.filter(u => u.team === 'enemy');
  for (let i = s.foxFires.length - 1; i >= 0; i--) {
    const ff = s.foxFires[i];
    ff.life -= dt;
    enemies.forEach(e => {
      if (e.y > ff.yTop && e.y < ff.yBottom) {
        e.hp -= 30 * dt;
        e.burn = 0.5;
      }
    });
    if (Math.random() < dt * 40) {
      s.particles.push({
        x: Math.random() * 1200, y: ff.yBottom - Math.random() * 200,
        vx: (Math.random() - 0.5) * 50, vy: -100 - Math.random() * 100,
        life: 0.5 + Math.random(), color: '#ea580c', r: Math.random() * 5 + 3
      });
    }
    if (ff.life <= 0) s.foxFires.splice(i, 1);
  }
}

/**
 * Ticks dragon wave projectiles — moves them upward and damages enemies.
 * @param {object} s   - game state
 * @param {number} dt
 */
export function tickDragonWaves(s, dt) {
  const enemies = s.units.filter(u => u.team === 'enemy');
  for (let i = s.dragonWaves.length - 1; i >= 0; i--) {
    const w = s.dragonWaves[i];
    w.life -= dt;
    w.y -= dt * 600;
    enemies.forEach(e => {
      if (Math.abs(e.y - w.y) < 120) {
        e.hp -= 200 * dt;
        e.y -= dt * 450;
      }
    });
    if (w.life <= 0) s.dragonWaves.splice(i, 1);
  }
}

// --- Trigger functions (called via React callbacks, operate directly on s) ---

export function triggerThunder(s, setUiTick) {
  if (s.koku >= 150 && s.gameState === 'COMBAT' && s.thunderCooldown <= 0) {
    s.koku -= 150;
    s.thunderCooldown = 2.0;
    const enemies = s.units.filter(u => u.team === 'enemy' && u.hp > 0);
    const targets = enemies.sort((a, b) => b.hp - a.hp).slice(0, 3);
    targets.forEach(t => {
      t.hp -= 300;
      s.lightnings.push({ x: t.x, y: t.y, life: 0.5 });
    });
    s.screenShake = 0.4;
    setUiTick(t => t + 1);
  }
}

export function triggerFoxFire(s, setUiTick) {
  if (s.koku >= 250 && s.gameState === 'COMBAT' && s.foxFireCooldown <= 0) {
    s.koku -= 250;
    s.foxFireCooldown = 10.0;
    s.foxFires.push({ yTop: 1000, yBottom: 1200, life: 8.0 });
    setUiTick(t => t + 1);
  }
}

export function triggerDragonWave(s, setUiTick) {
  if (s.koku >= 600 && s.gameState === 'COMBAT' && s.dragonCooldown <= 0) {
    s.koku -= 600;
    s.dragonCooldown = 15.0;
    s.dragonWaves.push({ y: WALL_Y - 50, life: 2.0 });
    s.screenShake = 1.0;
    setUiTick(t => t + 1);
  }
}

export function triggerWarDrums(s, setUiTick) {
  if (s.koku >= 200 && s.gameState === 'COMBAT') {
    s.koku -= 200;
    s.warDrumsActive = 5.0;
    setUiTick(t => t + 1);
  }
}

export function triggerHarvest(s, setUiTick) {
  if (s.koku >= 300 && s.gameState === 'COMBAT') {
    s.koku -= 300;
    s.harvestActive = 10.0;
    setUiTick(t => t + 1);
  }
}

export function triggerResolve(s, setUiTick) {
  if (s.koku >= 150 && s.gameState === 'COMBAT') {
    s.koku -= 150;
    let healedAny = false;
    s.units.forEach(u => {
      if (u.team === 'player' && (u.name === 'Hatamoto' || u.name === 'Bamboo Barricade')) {
        u.hp = Math.min(u.maxHp, u.hp + (u.maxHp * 0.5));
        s.floatingTexts.push({ x: u.x, y: u.y - 20, text: '+HP', color: '#4a5d23', life: 1.0, vy: -30 });
        healedAny = true;
      }
    });
    if (healedAny) s.screenShake = 0.3;
    setUiTick(t => t + 1);
  }
}
