import { ENEMY_COSTS, CAMPAIGN_MAP } from '../config/campaign.js';
import { spawnUnit } from './SpawnSystem.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';

/**
 * Generates a list of enemy squads for a given wave number.
 * nodeContext allows elite/boss nodes to scale the budget.
 * @param {number} waveNum
 * @param {{ nodeType?: string, nodeVariant?: string, nodeThreat?: number } | null} nodeContext
 * @returns {Array<{type: string, count: number, spread: number}>}
 */
export function generateWave(waveNum, nodeContext = null) {
  let budget = 40 + (waveNum * 45) + Math.floor(Math.pow(waveNum, 1.3) * 5);

  if (nodeContext?.nodeType === 'elite') {
    const threatBonus = 1 + ((nodeContext.nodeThreat - 3) * 0.25);
    budget = Math.floor(budget * Math.max(1.0, threatBonus));
  }
  if (nodeContext?.nodeType === 'boss') {
    budget = Math.floor(budget * 2.0);
  }

  // TODO: Step 10 — Elite wave special abilities
  // if (nodeContext?.nodeVariant === 'onmyoji_ritual') applyPoisonPonds(s);
  // if (nodeContext?.nodeVariant === 'tengu_master')    applyRedThunder(s);
  // if (nodeContext?.nodeVariant === 'shinobi_squad')   applyExplodingBombers(s);
  const squads = [];
  if (waveNum === 1) { squads.push({ type: 'REBEL', count: 4, spread: 80 }); return squads; }
  if (waveNum === 2) { squads.push({ type: 'REBEL', count: 12, spread: 150 }); return squads; }
  if (waveNum === 3) {
    squads.push({ type: 'REBEL', count: 12, spread: 120 });
    squads.push({ type: 'SHINOBI', count: 2, spread: 60 });
    return squads;
  }

  if (waveNum % 5 === 0) {
    const oniCount = Math.floor(waveNum / 5);
    squads.push({ type: 'ONI', count: oniCount, spread: 100 });
    budget -= ENEMY_COSTS.ONI * oniCount;
  }

  while (budget >= ENEMY_COSTS.REBEL) {
    let type = 'REBEL'; let count = 0; let cost = 0;
    const r = Math.random();
    if (waveNum >= 3 && r > 0.7 && budget >= ENEMY_COSTS.TENGU * 4)            { type = 'TENGU';   count = 4 + Math.floor(Math.random() * 3); }
    else if (waveNum >= 4 && r > 0.85 && budget >= ENEMY_COSTS.ONMYOJI)        { type = 'ONMYOJI'; count = 1 + Math.floor(Math.random() * 2); }
    else if (waveNum >= 2 && r > 0.45 && r <= 0.7 && budget >= ENEMY_COSTS.SHINOBI * 2) { type = 'SHINOBI'; count = 2 + Math.floor(Math.random() * 2); }
    else if (budget >= ENEMY_COSTS.REBEL * 5)                                   { type = 'REBEL';   count = 5 + Math.floor(Math.random() * 10); }
    else                                                                         { type = 'REBEL';   count = Math.max(1, Math.floor(budget / ENEMY_COSTS.REBEL)); }

    cost = ENEMY_COSTS[type] * count;
    if (cost <= budget) { squads.push({ type, count, spread: count * 15 }); budget -= cost; }
    else { budget = 0; }
  }
  return squads;
}

/**
 * Ticks the wave state machine (PRE_WAVE → SPAWNING → CLEANUP).
 * @param {object} s           - game state
 * @param {number} dt
 * @param {object} metaRef     - React ref to meta state
 */
export function tickWaveState(s, dt, metaRef) {
  const enemies = s.units.filter(u => u.team === 'enemy');

  if (s.waveState === 'PRE_WAVE') {
    s.waveTimer -= dt;
    if (s.waveTimer <= 0) {
      s.waveState = 'SPAWNING';
      s.squadsToSpawn = generateWave(s.wave, {
        nodeType:    metaRef.current.activeNodeType    ?? 'combat',
        nodeVariant: metaRef.current.activeNodeVariant ?? null,
        nodeThreat:  metaRef.current.activeNodeThreat  ?? 1,
      });
      s.enemiesInWave = s.squadsToSpawn.reduce((sum, sq) => sum + sq.count, 0);
      s.waveTimer = 1.0;
      bus.emit(EVENTS.WAVE_CHANGED, { 
        wave: s.wave, 
        waveState: s.waveState, 
        waveTimer: s.waveTimer 
      });
    }
  } else if (s.waveState === 'SPAWNING') {
    s.waveTimer -= dt;
    if (s.waveTimer <= 0) {
      if (s.squadsToSpawn.length > 0) {
        const squad = s.squadsToSpawn.shift();
        const centerX = 200 + Math.random() * (1200 - 400);
        for (let i = 0; i < squad.count; i++) {
          const offsetX = (Math.random() - 0.5) * squad.spread;
          spawnUnit(s, squad.type, 'enemy', Math.max(50, Math.min(1200 - 50, centerX + offsetX)), -50 + (Math.random() - 0.5) * 80, metaRef);
        }
        s.waveTimer = 3.0 + (s.wave * 0.15) + (Math.random() * 2.0);
      } else {
        s.waveState = 'CLEANUP';
        bus.emit(EVENTS.WAVE_CHANGED, { 
          wave: s.wave, 
          waveState: s.waveState, 
          waveTimer: s.waveTimer 
        });
      }
    }
  } else if (s.waveState === 'CLEANUP') {
    const threshold = Math.max(2, Math.floor(s.enemiesInWave * 0.20));
    if (enemies.length <= threshold) {
      const regionDef = CAMPAIGN_MAP[s.currentRegion];
      // In conquest mode s.currentRegion is a node ID — CAMPAIGN_MAP returns undefined.
      // Fall back to activeNodeWaves injected by handlePlayNode (Gap #9 fix).
      const maxWaves = regionDef?.waves ?? (metaRef.current.activeNodeWaves ?? 3);
      if (s.wave >= maxWaves) {
        s.gameState = 'REGION_VICTORY';
        bus.emit(EVENTS.GAME_STATE_CHANGED, { state: s.gameState });
      } else {
        const isReformation = s.wave % 3 === 0;
        s.wave++;
        s.waveState = 'PRE_WAVE';
        s.waveTimer = isReformation ? 15.0 : 6.0;
        bus.emit(EVENTS.WAVE_CHANGED, { 
          wave: s.wave, 
          waveState: s.waveState, 
          waveTimer: s.waveTimer 
        });
      }
    }
  }
}
