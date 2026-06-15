import { V_WIDTH, WALL_Y } from '../config/constants.js';
import { SPELL_COSTS, THUNDER_SHOWER } from '../config/spells.js';
import { pushFx } from '../renderer/drawSumiFx.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';
import { SoundManager } from './SoundManager.js';

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
    let burning = false;
    enemies.forEach(e => {
      if (e.y > ff.yTop && e.y < ff.yBottom) {
        e.hp -= 30 * dt;
        e.burn = 0.5;
        burning = true;
      }
    });
    if (burning) SoundManager.playSfx('foxfire_burn');
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
    let hitAny = false;
    enemies.forEach(e => {
      if (Math.abs(e.y - w.y) < 120) {
        e.hp -= 200 * dt;
        e.y -= dt * 450;
        hitAny = true;
      }
    });
    if (hitAny) SoundManager.playSfx('dragonwave_impact');
    if (w.life <= 0) s.dragonWaves.splice(i, 1);
  }
}

export function tickThunderShower(s, dt) {
  if (!s.thunderImpacts) s.thunderImpacts = [];

  for (let i = s.thunderImpacts.length - 1; i >= 0; i--) {
    const impact = s.thunderImpacts[i];
    impact.delay -= dt;
    if (impact.delay > 0) continue;

    if (impact.target?.hp > 0) {
      impact.target.hp -= impact.damage;
    }
    SoundManager.playSfx('lightning_strike');
    s.thunderImpacts.splice(i, 1);
  }
}

// --- Trigger functions (called via React callbacks, operate directly on s) ---

function randomTargets(enemies, count) {
  return [...enemies]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}

export function triggerThunder(s, options = {}) {
  const cost = options.free ? 0 : SPELL_COSTS.THUNDER_SHOWER;
  if (s.command >= cost && s.gameState === 'COMBAT' && s.thunderCooldown <= 0) {
    s.command -= cost;
    bus.emit(EVENTS.COMMAND_CHANGED, { command: s.command });
    SoundManager.playSfx('thunder_cast');
    s.thunderCooldown = 2.0 * (s.shopSpellCooldownMult ?? 1.0);  // spell_mastery
    const enemies = s.units.filter(u => u.team === 'enemy' && u.hp > 0);
    const targets = randomTargets(enemies, THUNDER_SHOWER.strikes);
    if (!s.thunderImpacts) s.thunderImpacts = [];
    targets.forEach((t, index) => {
      const delay = THUNDER_SHOWER.strikeDelays[index] ?? 0;
      s.thunderImpacts.push({ target: t, delay, damage: THUNDER_SHOWER.damage });
      s.lightnings.push({ x: t.x, y: t.y, life: 0.42, delay });
      pushFx(s, { kind: 'lightning', layer: 'foreground', x: t.x, y: t.y, delay, life: 0.68, maxLife: 0.68, branches: 6 });
      pushFx(s, { kind: 'ground_star', layer: 'foreground', x: t.x, y: t.y, delay, radius: 94, color: '#facc15', life: 0.54, maxLife: 0.54 });
      pushFx(s, { kind: 'shockwave', layer: 'foreground', x: t.x, y: t.y, delay, radius: 104, color: '#ffffff', life: 0.54, maxLife: 0.54 });
    });
    pushFx(s, { kind: 'screen_pulse', layer: 'background', color: '#facc15', life: 0.22, maxLife: 0.22 });
    pushFx(s, { kind: 'screen_pulse', layer: 'background', delay: 1.15, color: '#facc15', life: 0.22, maxLife: 0.22 });
    s.screenShake = 0.4;
    bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
  }
}

export function triggerFoxFire(s, options = {}) {
  const cost = options.free ? 0 : SPELL_COSTS.FOX_FIRE;
  if (s.command >= cost && s.gameState === 'COMBAT' && s.foxFireCooldown <= 0) {
    s.command -= cost;
    bus.emit(EVENTS.COMMAND_CHANGED, { command: s.command });
    SoundManager.playSfx('foxfire_cast');
    s.foxFireCooldown = 10.0 * (s.shopSpellCooldownMult ?? 1.0);  // spell_mastery
    s.foxFires.push({ yTop: 1000, yBottom: 1200, life: 8.0, maxLife: 8.0, seed: Math.random() * 100000 });
    pushFx(s, { kind: 'fox_wall', layer: 'background', yTop: 1000, yBottom: 1200, life: 8.0, maxLife: 8.0 });
    pushFx(s, { kind: 'aura', layer: 'foreground', x: V_WIDTH / 2, y: 1100, radius: 190, color: '#ea580c', life: 0.9, maxLife: 0.9, spin: 0.7 });
  }
}

export function triggerDragonWave(s) {
  if (s.dragonUnlocked && s.command >= SPELL_COSTS.DRAGON_WAVE && s.gameState === 'COMBAT' && s.dragonCooldown <= 0) {
    s.command -= SPELL_COSTS.DRAGON_WAVE;
    bus.emit(EVENTS.COMMAND_CHANGED, { command: s.command });
    SoundManager.playSfx('dragonwave_cast');
    s.dragonCooldown = 15.0 * (s.shopSpellCooldownMult ?? 1.0);  // spell_mastery
    s.dragonWaves.push({ y: WALL_Y - 50, life: 2.0, maxLife: 2.0, seed: Math.random() * 100000 });
    pushFx(s, { kind: 'dragon_crest', layer: 'background', y: WALL_Y - 50, life: 2.0, maxLife: 2.0, vy: -600 });
    pushFx(s, { kind: 'screen_pulse', layer: 'background', color: '#38bdf8', life: 0.35, maxLife: 0.35 });
    s.screenShake = 1.0;
    bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
  }
}

export function triggerWarDrums(s) {
  if (s.command >= 200 && s.gameState === 'COMBAT') {
    s.command -= 200;
    bus.emit(EVENTS.COMMAND_CHANGED, { command: s.command });
    SoundManager.playSfx('wardrums_activate');
    s.warDrumsActive = 5.0;
    pushFx(s, { kind: 'aura', layer: 'foreground', x: V_WIDTH / 2, y: WALL_Y - 220, radius: 190, color: '#d4af37', life: 1.2, maxLife: 1.2, spin: 0.45 });
    pushFx(s, { kind: 'shockwave', layer: 'foreground', x: V_WIDTH / 2, y: WALL_Y - 220, radius: 220, color: '#d4af37', life: 0.55, maxLife: 0.55 });
  }
}

export function triggerHarvest(s) {
  if (s.command >= 300 && s.gameState === 'COMBAT') {
    s.command -= 300;
    bus.emit(EVENTS.COMMAND_CHANGED, { command: s.command });
    SoundManager.playSfx('harvest_activate');
    s.harvestActive = 10.0;
    pushFx(s, { kind: 'aura', layer: 'foreground', x: V_WIDTH / 2, y: WALL_Y - 250, radius: 170, color: '#4a5d23', life: 1.4, maxLife: 1.4, spin: -0.35 });
    pushFx(s, { kind: 'screen_pulse', layer: 'background', color: '#4a5d23', life: 0.25, maxLife: 0.25 });
  }
}

export function triggerResolve(s) {
  if (s.command >= 150 && s.gameState === 'COMBAT') {
    s.command -= 150;
    bus.emit(EVENTS.COMMAND_CHANGED, { command: s.command });
    let healedAny = false;
    s.units.forEach(u => {
      if (u.team === 'player' && (u.name === 'Hatamoto' || u.name === 'Bamboo Barricade')) {
        u.hp = Math.min(u.maxHp, u.hp + (u.maxHp * 0.5));
        s.floatingTexts.push({ x: u.x, y: u.y - 20, text: '+HP', color: '#4a5d23', life: 1.0, vy: -30 });
        healedAny = true;
      }
    });
    if (healedAny) {
      SoundManager.playSfx('resolve_heal');
      pushFx(s, { kind: 'aura', layer: 'foreground', x: V_WIDTH / 2, y: WALL_Y - 180, radius: 160, color: '#4a5d23', life: 0.95, maxLife: 0.95, spin: 0.3 });
      pushFx(s, { kind: 'shockwave', layer: 'foreground', x: V_WIDTH / 2, y: WALL_Y - 180, radius: 180, color: '#dfd4ba', life: 0.5, maxLife: 0.5 });
      s.screenShake = 0.3;
      bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
    }
  }
}
