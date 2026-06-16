import { CAVE_CONFIG } from '../config/cave.js';
import { V_WIDTH, WALL_Y } from '../config/constants.js';
import { isVisibleBossId, getCampaignChapterIndex } from '../config/campaign.js';
import { BOSS_REGISTRY, getBossDef } from '../config/bosses.js';
import { addParticle, spawnUnit } from './SpawnSystem.js';
import { pushFx } from '../renderer/drawSumiFx.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';
import { SoundManager } from './SoundManager.js';

const GOKI_MINE_INTERVAL = 6.5;
const KASHA_FIRE_INTERVAL = 5.0;
const DAITENGU_STRIKE_INTERVAL = 4.5;
const YUKIONNA_FREEZE_INTERVAL = 5.5;
const OTAKEMARU_CHAOS_PHASE = 7.5;

// Boss arrives as a "boss wave": it spawns alongside an escort, then reinforcement
// waves keep pouring in so the player is never just trading blows with a lone boss.
const BOSS_REINFORCE_INTERVAL = 11.0;
const BOSS_REINFORCE_MAX_ENEMIES = 42; // skip a reinforcement tick if the field is already this crowded

// Boss stats + hazard ids now live in config/bosses.js (BOSS_REGISTRY).

export function tickCave(s, dt, metaRef) {
  if (!s.cave || !s.orb || s.waveState !== 'BOSS_PHASE') return;

  const bossId = s.bossId ?? metaRef.current.activeBossId;
  if (isVisibleBossId(bossId)) {
    tickVisibleBossPhase(s, dt, metaRef, bossId);
    return;
  }

  if (s.cave.hp <= 0) {
    s.gameState = 'REGION_VICTORY';
    bus.emit(EVENTS.GAME_STATE_CHANGED, { state: s.gameState });
    SoundManager.playSfx('region_victory_fanfare');
    return;
  }

  tickBossHazards(s, dt, metaRef);

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

function tickVisibleBossPhase(s, dt, metaRef, bossId) {
  ensureVisibleBoss(s, metaRef, bossId);
  tickBossHazards(s, dt, metaRef);
  tickBossReinforcements(s, dt, metaRef);

  const aliveBoss = s.units.some(u => u.team === 'enemy' && u.isChapterBoss && u.hp > 0);
  if (s.chapterBossSpawned && !aliveBoss) {
    s.gameState = 'REGION_VICTORY';
    bus.emit(EVENTS.GAME_STATE_CHANGED, { state: s.gameState });
    SoundManager.playSfx('region_victory_fanfare');
  }
}

/** Spawns a cluster of `count` enemies of `type` streaming in from the top, wave-style. */
function spawnEnemyCluster(s, metaRef, type, count, spread) {
  if (count <= 0) return;
  const centerX = 220 + Math.random() * (V_WIDTH - 440);
  for (let i = 0; i < count; i++) {
    const x = clamp(centerX + (Math.random() - 0.5) * spread, 70, V_WIDTH - 70);
    const y = -50 + (Math.random() - 0.5) * 90;
    spawnUnit(s, type, 'enemy', x, y, metaRef);
  }
}

/** The escort that storms in together with the boss so its arrival is a wave, not a duel. */
function spawnBossEscort(s, metaRef) {
  const tier = getCampaignChapterIndex(metaRef.current?.activeChapterId) ?? 0; // 0-based chapter
  spawnEnemyCluster(s, metaRef, 'REBEL', 10 + tier * 2, 520);
  spawnEnemyCluster(s, metaRef, 'SHINOBI', 2 + tier, 360);
  if (tier >= 2) spawnEnemyCluster(s, metaRef, 'TENGU', 4, 420);
}

/** Periodic reinforcement waves during the boss fight to keep the pressure on. */
function tickBossReinforcements(s, dt, metaRef) {
  if (!s.chapterBossSpawned) return;
  if (s.cave.reinforceTimer === undefined) s.cave.reinforceTimer = BOSS_REINFORCE_INTERVAL;

  s.cave.reinforceTimer -= dt;
  if (s.cave.reinforceTimer > 0) return;
  s.cave.reinforceTimer = BOSS_REINFORCE_INTERVAL;

  // Don't pile reinforcements on top of an already-overwhelmed field.
  const aliveEnemies = s.units.reduce((n, u) => (u.team === 'enemy' && u.hp > 0 ? n + 1 : n), 0);
  if (aliveEnemies >= BOSS_REINFORCE_MAX_ENEMIES) return;

  const tier = getCampaignChapterIndex(metaRef.current?.activeChapterId) ?? 0;
  spawnEnemyCluster(s, metaRef, 'REBEL', 5 + tier, 360);
  if (Math.random() > 0.5) spawnEnemyCluster(s, metaRef, 'SHINOBI', 2, 220);
  if (tier >= 2 && Math.random() > 0.5) spawnEnemyCluster(s, metaRef, 'TENGU', 3, 320);

  addParticle(s, s.cave.x, s.cave.y, '#b84235', 10, 280);
  s.screenShake = Math.max(s.screenShake, 0.18);
  bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
  SoundManager.playSfx('reinforcement_horn');
}

function ensureVisibleBoss(s, metaRef, bossId) {
  if (s.chapterBossSpawned) return;
  const def = getBossDef(bossId);
  spawnUnit(s, 'ONI', 'enemy', V_WIDTH / 2, 260, metaRef);
  const boss = s.units[s.units.length - 1];
  boss.name = def.name;
  boss.bossId = bossId;
  boss.isChapterBoss = true;
  boss.isElite = true;
  boss.hp = def.hp;
  boss.maxHp = def.hp;
  boss.damage = def.damage;
  boss.speed = def.speed;
  boss.radius = def.radius;
  boss.color = def.color;
  boss.armor = def.armor;
  boss.attackSpeed = def.attackSpeed;
  boss.renderLayer = 5;
  s.chapterBossSpawned = true;
  pushFx(s, { kind: 'summon_chakra', layer: 'background', x: boss.x, y: boss.y + boss.radius * 0.8, radius: boss.radius * 2.2, color: def.color, life: 1.7, maxLife: 1.7 });
  pushFx(s, { kind: 'ink_burst', layer: 'foreground', x: boss.x, y: boss.y, radius: boss.radius * 2.4, color: '#1b1918', life: 0.9, maxLife: 0.9, rays: 18 });
  pushFx(s, { kind: 'screen_pulse', layer: 'background', x: boss.x, y: boss.y, color: def.color, life: 0.45, maxLife: 0.45 });
  s.floatingTexts.push({ x: boss.x, y: boss.y - 100, text: `${def.name.toUpperCase()} APPEARS`, color: '#d4af37', life: 2.0, vy: -25 });
  s.screenShake = Math.max(s.screenShake, 0.65);
  bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
  SoundManager.playSfx('boss_appear');

  // The boss never arrives alone — its escort storms the field with it.
  spawnBossEscort(s, metaRef);
  s.cave.reinforceTimer = BOSS_REINFORCE_INTERVAL;
}

function tickBossHazards(s, dt, metaRef) {
  if (!s.bossHazards) s.bossHazards = [];

  for (const hazard of s.bossHazards) {
    if (hazard.armTimer > 0) hazard.armTimer -= dt;
    hazard.life -= dt;

    if (hazard.type === 'mud_mine' && hazard.armTimer <= 0) {
      const victim = s.units.find(u => u.team === 'player' && u.hp > 0 && Math.hypot(u.x - hazard.x, u.y - hazard.y) <= hazard.radius);
      if (victim) {
        detonateMudMine(s, hazard);
        hazard.life = 0;
      }
    }

    if (hazard.type === 'fire_zone' && hazard.armTimer <= 0) {
      applyFireZoneDamage(s, hazard, dt);
    }

    // Lightning is a timed strike: it detonates the instant its telegraph expires.
    if (hazard.type === 'lightning_strike' && hazard.armTimer <= 0) {
      detonateLightning(s, hazard);
      hazard.life = 0;
    }

    // Freeze is a lingering zone, like fire — but it chills instead of burning.
    if (hazard.type === 'freeze_zone' && hazard.armTimer <= 0) {
      applyFreezeZone(s, hazard, dt);
    }
  }

  s.bossHazards = s.bossHazards.filter(h => h.life > 0);

  // Dispatch the boss's signature hazard from the registry. No fallback: an unknown
  // bossId (e.g. the cave/orb path with no visible chapter boss) spawns no hazards,
  // exactly as before this registry existed.
  const bossId = s.bossId ?? metaRef.current.activeBossId;
  const def = BOSS_REGISTRY[bossId];
  if (def) {
    switch (def.hazard) {
      case 'mud_mines':         tickGokiMines(s, dt); break;
      case 'fire_trails':       tickKashaFireTrails(s, dt); break;
      case 'lightning_strikes': tickDaitenguLightning(s, dt); break;
      case 'freeze_zones':      tickYukionnaFreeze(s, dt); break;
      case 'elemental_chaos':   tickOtakemaruChaos(s, dt); break;
      default: break;
    }
  }
}

function tickGokiMines(s, dt) {
  if (s.cave.mineTimer === undefined) s.cave.mineTimer = 2.5;
  s.cave.mineTimer -= dt;
  if (s.cave.mineTimer > 0) return;

  const target = pickPlayerPressurePoint(s);
  s.bossHazards.push({
    id: `mine_${Date.now()}_${Math.random()}`,
    type: 'mud_mine',
    x: target.x,
    y: target.y,
    radius: 72,
    armTimer: 1.2,
    life: 10,
    damage: 32,
    slowTimer: 4,
    maxLife: 10,
    seed: Math.random() * 100000,
  });
  pushFx(s, { kind: 'aura', layer: 'background', x: target.x, y: target.y, radius: 92, color: '#8b7355', life: 1.15, maxLife: 1.15, spin: 0.25 });
  s.floatingTexts.push({ x: target.x, y: target.y - 70, text: 'MINE', color: '#8b7355', life: 0.9, vy: -18 });
  s.cave.mineTimer = GOKI_MINE_INTERVAL;
  SoundManager.playSfx('boss_mining_attack');
}

function tickKashaFireTrails(s, dt) {
  if (s.cave.fireTimer === undefined) s.cave.fireTimer = 2.0;
  s.cave.fireTimer -= dt;
  if (s.cave.fireTimer > 0) return;

  const target = pickPlayerPressurePoint(s);
  const dir = Math.random() > 0.5 ? 1 : -1;
  for (let i = 0; i < 5; i++) {
    const y = clamp(360 + i * 180, 260, WALL_Y - 90);
    const x = clamp(target.x + dir * (i - 2) * 60 + (Math.random() - 0.5) * 80, 120, V_WIDTH - 120);
    s.bossHazards.push({
      id: `fire_${Date.now()}_${i}_${Math.random()}`,
      type: 'fire_zone',
      x,
      y,
      radius: 78,
      armTimer: 0.75,
      life: 5,
      damagePerSec: 13,
      maxLife: 5,
      seed: Math.random() * 100000,
    });
  }
  pushFx(s, { kind: 'aura', layer: 'background', x: target.x, y: 640, radius: 150, color: '#ea580c', life: 1.0, maxLife: 1.0, spin: 0.8 });
  s.floatingTexts.push({ x: target.x, y: 300, text: 'FIRE TRAIL', color: '#ea580c', life: 1.0, vy: -18 });
  s.cave.fireTimer = KASHA_FIRE_INTERVAL;
  SoundManager.playSfx('boss_swift_attack');
}

// ── Daitengu — Lightning Strikes ─────────────────────────────────────────────
// Telegraphs a strike on the densest knot of player units, then detonates as burst
// AoE. Punishes clumping: spread out and a single bolt clips far fewer units.
function tickDaitenguLightning(s, dt) {
  if (s.cave.lightningTimer === undefined) s.cave.lightningTimer = 2.0;
  s.cave.lightningTimer -= dt;
  if (s.cave.lightningTimer > 0) return;

  const target = pickClusterPoint(s);
  s.bossHazards.push({
    id: `bolt_${Date.now()}_${Math.random()}`,
    type: 'lightning_strike',
    x: target.x,
    y: target.y,
    radius: 96,
    armTimer: 0.95,   // telegraph window before the bolt lands
    life: 4,          // safety cap; it actually detonates at armTimer <= 0
    damage: 40,
    slowTimer: 1.5,
    maxLife: 4,
    seed: Math.random() * 100000,
  });
  s.floatingTexts.push({ x: target.x, y: target.y - 80, text: 'LIGHTNING', color: '#facc15', life: 0.9, vy: -18 });
  s.cave.lightningTimer = DAITENGU_STRIKE_INTERVAL;
  SoundManager.playSfx('boss_swift_attack');
}

/** Returns the position of the player unit with the most nearby allies (the clump). */
function pickClusterPoint(s) {
  const players = s.units.filter(u =>
    u.team === 'player' && u.hp > 0 && u.type !== 'friction' && u.y > 280 && u.y < WALL_Y
  );
  if (players.length === 0) return pickPlayerPressurePoint(s);

  let best = players[0];
  let bestCount = -1;
  for (const u of players) {
    let count = 0;
    for (const v of players) {
      if (Math.hypot(u.x - v.x, u.y - v.y) < 110) count++;
    }
    if (count > bestCount) { bestCount = count; best = u; }
  }
  return {
    x: clamp(best.x, 120, V_WIDTH - 120),
    y: clamp(best.y, 320, WALL_Y - 100),
  };
}

function detonateLightning(s, hazard) {
  pushFx(s, { kind: 'lightning', layer: 'foreground', x: hazard.x, y: hazard.y, seed: hazard.seed, branches: 5, startY: -140, life: 0.4, maxLife: 0.4 });
  pushFx(s, { kind: 'screen_pulse', layer: 'background', x: hazard.x, y: hazard.y, color: '#facc15', life: 0.4, maxLife: 0.4 });
  pushFx(s, { kind: 'ground_star', layer: 'foreground', x: hazard.x, y: hazard.y, radius: hazard.radius * 1.1, color: '#facc15', life: 0.42, maxLife: 0.42 });
  addParticle(s, hazard.x, hazard.y, '#facc15', 18, 300);
  addParticle(s, hazard.x, hazard.y, '#ffffff', 8, 200);

  s.units.forEach(u => {
    if (u.team !== 'player' || u.hp <= 0) return;
    const dist = Math.hypot(u.x - hazard.x, u.y - hazard.y);
    if (dist > hazard.radius) return;
    const falloff = 1 - (dist / hazard.radius) * 0.4;
    u.hp -= hazard.damage * falloff;
    u.slowTimer = Math.max(u.slowTimer ?? 0, hazard.slowTimer);
    u.slowMult = 0.6;
  });

  s.screenShake = Math.max(s.screenShake, 0.4);
  bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
  SoundManager.playSfx('mine_explode');
}

// ── Yuki-Onna — Deep Freeze ──────────────────────────────────────────────────
// Drops a spread of lingering frost zones that heavily slow (and lightly chip) any
// player units standing in them — area denial that punishes a static frontline.
function tickYukionnaFreeze(s, dt) {
  if (s.cave.freezeTimer === undefined) s.cave.freezeTimer = 2.2;
  s.cave.freezeTimer -= dt;
  if (s.cave.freezeTimer > 0) return;

  const target = pickPlayerPressurePoint(s);
  for (let i = 0; i < 3; i++) {
    const x = clamp(target.x + (Math.random() - 0.5) * 260, 120, V_WIDTH - 120);
    const y = clamp(target.y + (Math.random() - 0.5) * 220, 320, WALL_Y - 90);
    s.bossHazards.push({
      id: `frost_${Date.now()}_${i}_${Math.random()}`,
      type: 'freeze_zone',
      x,
      y,
      radius: 92,
      armTimer: 0.8,
      life: 6,
      damagePerSec: 5,
      slowMult: 0.4,
      maxLife: 6,
      seed: Math.random() * 100000,
    });
  }
  pushFx(s, { kind: 'aura', layer: 'background', x: target.x, y: target.y, radius: 150, color: '#a0c4ff', life: 1.0, maxLife: 1.0, spin: -0.4 });
  s.floatingTexts.push({ x: target.x, y: target.y - 70, text: 'DEEP FREEZE', color: '#a0c4ff', life: 1.0, vy: -18 });
  s.cave.freezeTimer = YUKIONNA_FREEZE_INTERVAL;
  SoundManager.playSfx('boss_mining_attack');
}

function applyFreezeZone(s, hazard, dt) {
  if (Math.random() < dt * 8) {
    addParticle(
      s,
      hazard.x + (Math.random() - 0.5) * hazard.radius,
      hazard.y + (Math.random() - 0.5) * hazard.radius,
      '#cfe8ff',
      1,
      70
    );
  }

  s.units.forEach(u => {
    if (u.team !== 'player' || u.hp <= 0) return;
    if (Math.hypot(u.x - hazard.x, u.y - hazard.y) > hazard.radius) return;
    u.hp -= hazard.damagePerSec * dt;
    // Refresh a short slow each tick so it wears off shortly after leaving the zone.
    u.slowTimer = Math.max(u.slowTimer ?? 0, 0.4);
    u.slowMult = hazard.slowMult;
  });
}

// ── Otakemaru — Elemental Chaos ──────────────────────────────────────────────
// Cycles through the other four bosses' signature hazards, one element per phase, so
// the player has to keep re-reading the board. Reuses each tick verbatim — the sub
// timers (mineTimer/fireTimer/lightningTimer/freezeTimer) live on s.cave and persist.
function tickOtakemaruChaos(s, dt) {
  if (s.cave.chaosPhase === undefined) {
    s.cave.chaosPhase = 0;
    s.cave.chaosTimer = OTAKEMARU_CHAOS_PHASE;
  }
  s.cave.chaosTimer -= dt;
  if (s.cave.chaosTimer <= 0) {
    s.cave.chaosPhase = (s.cave.chaosPhase + 1) % 4;
    s.cave.chaosTimer = OTAKEMARU_CHAOS_PHASE;
    const labels = ['EARTH', 'FLAME', 'STORM', 'FROST'];
    s.floatingTexts.push({ x: V_WIDTH / 2, y: 240, text: `OTAKEMARU CALLS ${labels[s.cave.chaosPhase]}`, color: '#9b59b6', life: 1.6, vy: -16 });
  }

  switch (s.cave.chaosPhase) {
    case 0:  tickGokiMines(s, dt); break;
    case 1:  tickKashaFireTrails(s, dt); break;
    case 2:  tickDaitenguLightning(s, dt); break;
    default: tickYukionnaFreeze(s, dt); break;
  }
}

function detonateMudMine(s, hazard) {
  s.explosions.push({ x: hazard.x, y: hazard.y, r: hazard.radius * 1.35, life: 1.0, color: '#8b7355' });
  pushFx(s, { kind: 'shockwave', layer: 'foreground', x: hazard.x, y: hazard.y, radius: hazard.radius * 1.65, color: '#8b7355', life: 0.65, maxLife: 0.65 });
  pushFx(s, { kind: 'ink_burst', layer: 'foreground', x: hazard.x, y: hazard.y, radius: hazard.radius * 1.55, color: '#1b1918', life: 0.75, maxLife: 0.75, rays: 16 });
  pushFx(s, { kind: 'ground_star', layer: 'foreground', x: hazard.x, y: hazard.y, radius: hazard.radius * 1.25, color: '#dfd4ba', life: 0.42, maxLife: 0.42 });
  addParticle(s, hazard.x, hazard.y, '#8b7355', 24, 260);
  addParticle(s, hazard.x, hazard.y, '#1b1918', 10, 180);

  s.units.forEach(u => {
    if (u.team !== 'player' || u.hp <= 0) return;
    const dist = Math.hypot(u.x - hazard.x, u.y - hazard.y);
    if (dist > hazard.radius) return;
    const falloff = 1 - (dist / hazard.radius) * 0.35;
    u.hp -= hazard.damage * falloff;
    u.slowTimer = Math.max(u.slowTimer ?? 0, hazard.slowTimer);
    u.slowMult = 0.55;
  });

  s.screenShake = Math.max(s.screenShake, 0.25);
  bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
  SoundManager.playSfx('mine_explode');
}

function applyFireZoneDamage(s, hazard, dt) {
  if (Math.random() < dt * 12) {
    addParticle(
      s,
      hazard.x + (Math.random() - 0.5) * hazard.radius,
      hazard.y + (Math.random() - 0.5) * hazard.radius,
      '#ea580c',
      1,
      90
    );
  }

  s.units.forEach(u => {
    if (u.team !== 'player' || u.hp <= 0) return;
    const dist = Math.hypot(u.x - hazard.x, u.y - hazard.y);
    if (dist <= hazard.radius) {
      u.hp -= hazard.damagePerSec * dt;
    }
  });
}

function pickPlayerPressurePoint(s) {
  const candidates = s.units.filter(u =>
    u.team === 'player' &&
    u.hp > 0 &&
    u.type !== 'friction' &&
    u.y > 280 &&
    u.y < WALL_Y
  );

  if (candidates.length === 0) {
    return {
      x: 220 + Math.random() * (V_WIDTH - 440),
      y: 560 + Math.random() * 520,
    };
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    x: clamp(picked.x + (Math.random() - 0.5) * 140, 120, V_WIDTH - 120),
    y: clamp(picked.y + (Math.random() - 0.5) * 120, 320, WALL_Y - 100),
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
  if (!s.cave || s.cave.hp <= 0 || s.waveState !== 'BOSS_PHASE') return;
  if (isVisibleBossId(s.bossId)) return;

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
