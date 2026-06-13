import { CAVE_CONFIG } from '../config/cave.js';
import { V_WIDTH, WALL_Y } from '../config/constants.js';
import { isVisibleBossId } from '../config/campaign.js';
import { addParticle, spawnUnit } from './SpawnSystem.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';

const GOKI_MINE_INTERVAL = 6.5;
const KASHA_FIRE_INTERVAL = 5.0;

const BOSS_DEFS = {
  goki: {
    name: 'Goki',
    hp: 1500,
    damage: 32,
    speed: 20,
    radius: 64,
    color: '#8b7355',
    armor: '#1b1918',
    attackSpeed: 2.8,
  },
  kasha: {
    name: 'Kasha',
    hp: 1150,
    damage: 26,
    speed: 46,
    radius: 52,
    color: '#b84235',
    armor: '#1b1918',
    attackSpeed: 1.5,
  },
  daitengu: {
    name: 'Daitengu',
    hp: 1350,
    damage: 30,
    speed: 58,
    radius: 56,
    color: '#4a90e2',
    armor: '#1b1918',
    attackSpeed: 1.3,
  },
  yukionna: {
    name: 'Yuki-Onna',
    hp: 1500,
    damage: 34,
    speed: 32,
    radius: 58,
    color: '#a0c4ff',
    armor: '#1b1918',
    attackSpeed: 1.8,
  },
  otakemaru: {
    name: 'Otakemaru',
    hp: 1900,
    damage: 42,
    speed: 36,
    radius: 66,
    color: '#9b59b6',
    armor: '#1b1918',
    attackSpeed: 1.6,
  },
};

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

  const aliveBoss = s.units.some(u => u.team === 'enemy' && u.isChapterBoss && u.hp > 0);
  if (s.chapterBossSpawned && !aliveBoss) {
    s.gameState = 'REGION_VICTORY';
    bus.emit(EVENTS.GAME_STATE_CHANGED, { state: s.gameState });
  }
}

function ensureVisibleBoss(s, metaRef, bossId) {
  if (s.chapterBossSpawned) return;
  const def = BOSS_DEFS[bossId] ?? BOSS_DEFS.goki;
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
  s.floatingTexts.push({ x: boss.x, y: boss.y - 100, text: `${def.name.toUpperCase()} APPEARS`, color: '#d4af37', life: 2.0, vy: -25 });
  s.screenShake = Math.max(s.screenShake, 0.4);
  bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
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
  }

  s.bossHazards = s.bossHazards.filter(h => h.life > 0);

  const bossId = s.bossId ?? metaRef.current.activeBossId;
  if (bossId === 'goki') tickGokiMines(s, dt);
  if (bossId === 'kasha') tickKashaFireTrails(s, dt);
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
  });
  s.floatingTexts.push({ x: target.x, y: target.y - 70, text: 'MINE', color: '#8b7355', life: 0.9, vy: -18 });
  s.cave.mineTimer = GOKI_MINE_INTERVAL;
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
    });
  }
  s.floatingTexts.push({ x: target.x, y: 300, text: 'FIRE TRAIL', color: '#ea580c', life: 1.0, vy: -18 });
  s.cave.fireTimer = KASHA_FIRE_INTERVAL;
}

function detonateMudMine(s, hazard) {
  s.explosions.push({ x: hazard.x, y: hazard.y, r: hazard.radius * 1.35, life: 1.0, color: '#8b7355' });
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
