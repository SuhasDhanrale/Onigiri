import { ENEMY_COSTS, CAMPAIGN_MAP, isVisibleBossId } from '../config/campaign.js';
import { getCompressedWavePressure, getPlayableWaveCount, getWaveCompressionMultiplier } from '../config/waves.js';
import { spawnUnit } from './SpawnSystem.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';
import { SoundManager } from './SoundManager.js';

/**
 * Generates a list of enemy squads for a given wave number.
 * nodeContext lets generated map nodes affect wave count, threat, and broad enemy identity.
 * @param {number} waveNum
 * @param {{ nodeType?: string, nodeVariant?: string, nodeThreat?: number, nodeWaves?: number, chapterId?: string } | null} nodeContext
 * @returns {Array<{type: string, count: number, spread: number}>}
 */
export function generateWave(waveNum, nodeContext = null) {
  const pressureWave = getCompressedWavePressure(waveNum, nodeContext?.nodeType, nodeContext?.nodeWaves);
  const compressionMult = getWaveCompressionMultiplier(nodeContext?.nodeType, nodeContext?.nodeWaves);
  const budgetMult = getNodeBudgetMultiplier(nodeContext) * compressionMult;
  let budget = Math.floor((40 + (pressureWave * 45) + Math.floor(Math.pow(pressureWave, 1.3) * 5)) * budgetMult);
  const squads = [];

  if (pressureWave === 1) {
    squads.push({ type: 'REBEL', count: scaleCount(4, budgetMult), spread: 80 });
    return finalizeSquads(squads, waveNum, pressureWave, nodeContext);
  }
  if (pressureWave === 2) {
    squads.push({ type: 'REBEL', count: scaleCount(12, budgetMult), spread: 150 });
    return finalizeSquads(squads, waveNum, pressureWave, nodeContext);
  }
  if (pressureWave === 3) {
    squads.push({ type: 'REBEL', count: scaleCount(12, budgetMult), spread: 120 });
    squads.push({ type: 'SHINOBI', count: scaleCount(2, budgetMult), spread: 60 });
    return finalizeSquads(squads, waveNum, pressureWave, nodeContext);
  }

  if (pressureWave % 5 === 0) {
    const oniCount = Math.floor(pressureWave / 5);
    squads.push({ type: 'ONI', count: oniCount, spread: 100 });
    budget -= ENEMY_COSTS.ONI * oniCount;
  }

  while (budget >= ENEMY_COSTS.REBEL) {
    const r = Math.random();
    let squad;
    if (pressureWave >= 3 && r > 0.7 && budget >= ENEMY_COSTS.TENGU * 4) {
      squad = { type: 'TENGU', count: 4 + Math.floor(Math.random() * 3) };
    } else if (pressureWave >= 4 && r > 0.85 && budget >= ENEMY_COSTS.ONMYOJI) {
      squad = { type: 'ONMYOJI', count: 1 + Math.floor(Math.random() * 2) };
    } else if (pressureWave >= 2 && r > 0.45 && r <= 0.7 && budget >= ENEMY_COSTS.SHINOBI * 2) {
      squad = { type: 'SHINOBI', count: 2 + Math.floor(Math.random() * 2) };
    } else if (budget >= ENEMY_COSTS.REBEL * 5) {
      squad = { type: 'REBEL', count: 5 + Math.floor(Math.random() * 10) };
    } else {
      squad = { type: 'REBEL', count: Math.max(1, Math.floor(budget / ENEMY_COSTS.REBEL)) };
    }

    const cost = ENEMY_COSTS[squad.type] * squad.count;
    if (cost <= budget) {
      squads.push({ ...squad, spread: squad.count * 15 });
      budget -= cost;
    } else {
      budget = 0;
    }
  }

  return finalizeSquads(squads, waveNum, pressureWave, nodeContext);
}

function getNodeBudgetMultiplier(nodeContext) {
  if (!nodeContext) return 1.0;
  if (nodeContext.nodeType === 'boss') return 2.0;
  if (nodeContext.nodeType === 'elite') {
    return Math.max(1.0, 1 + (((nodeContext.nodeThreat ?? 4) - 3) * 0.25));
  }
  if (nodeContext.nodeType === 'combat') {
    return Math.max(1.0, 1 + (((nodeContext.nodeThreat ?? 1) - 1) * 0.15));
  }
  return 1.0;
}

function scaleCount(count, multiplier) {
  return Math.max(1, Math.round(count * multiplier));
}

function applyNodeVariantSquads(squads, waveNum, pressureWave, nodeContext) {
  const variant = nodeContext?.nodeVariant;
  const maxWaves = nodeContext?.nodeWaves
    ? getPlayableWaveCount(nodeContext?.nodeType, nodeContext.nodeWaves)
    : null;
  const isFinalWave = maxWaves !== null && waveNum >= maxWaves;
  const next = squads.map(squad => ({ ...squad }));

  switch (variant) {
    case 'swarm':
      next.forEach(squad => {
        if (squad.type === 'REBEL') squad.count = scaleCount(squad.count, 1.5);
      });
      break;
    case 'tengu_master':
      next.push({ type: 'TENGU', count: 2 + Math.floor(pressureWave / 2), spread: 90 });
      break;
    case 'shinobi_squad':
      next.push({ type: 'SHINOBI', count: 2 + pressureWave, spread: 90 });
      break;
    case 'onmyoji_ritual':
      next.push({ type: 'ONMYOJI', count: isFinalWave ? 2 : 1, spread: 70 });
      break;
    case 'oni_warlord':
      if (isFinalWave) next.push({ type: 'ONI', count: 1, spread: 100 });
      else next.push({ type: 'REBEL', count: 6 + pressureWave, spread: 120 });
      break;
    case 'yamabushi':
      next.push({ type: 'ONMYOJI', count: isFinalWave ? 2 : 1, spread: 70 });
      break;
    case 'ronin_duel':
      if (isFinalWave) next.push({ type: 'SHINOBI', count: 1, spread: 30 });
      break;
    default:
      break;
  }

  return next;
}

function applyChapterSquads(squads, pressureWave, nodeContext) {
  const next = squads.map(squad => ({ ...squad }));
  if (nodeContext?.chapterId === 'RIVERLANDS' && pressureWave >= 4) {
    next.push({ type: 'REBEL', count: 6 + pressureWave, spread: 120 });
  }
  if (nodeContext?.chapterId === 'OUTSKIRTS' && pressureWave >= 2) {
    next.push({ type: 'SHINOBI', count: Math.max(1, Math.floor(pressureWave / 2)), spread: 80 });
  }
  return next;
}

function finalizeSquads(squads, waveNum, pressureWave, nodeContext) {
  return applyNodeVariantSquads(applyChapterSquads(squads, pressureWave, nodeContext), waveNum, pressureWave, nodeContext);
}

/**
 * Ticks the wave state machine (PRE_WAVE -> SPAWNING -> CLEANUP).
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
        nodeWaves:   metaRef.current.activeNodeWaves   ?? 3,
        chapterId:   metaRef.current.activeChapterId    ?? null,
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
    const regionDef = CAMPAIGN_MAP[s.currentRegion];
    const configuredWaves = regionDef?.waves ?? (metaRef.current.activeNodeWaves ?? 3);
    const maxWaves = getPlayableWaveCount(metaRef.current.activeNodeType, configuredWaves);
    const isFinalWave = s.wave >= maxWaves;
    const threshold = isFinalWave ? 0 : Math.max(2, Math.floor(s.enemiesInWave * 0.20));

    if (enemies.length <= threshold) {
      if (s.combatStats) {
        s.combatStats.conqueredWaves = Math.max(s.combatStats.conqueredWaves ?? 0, s.wave);
      }

      if (s.wave >= maxWaves) {
        if (s.isBossNode) {
          s.waveState = 'BOSS_PHASE';
          if (s.orb) {
            s.orb.active = !isVisibleBossId(s.bossId ?? metaRef.current.activeBossId);
          }
          bus.emit(EVENTS.WAVE_CHANGED, {
            wave: s.wave,
            waveState: s.waveState,
            waveTimer: 0
          });
        } else {
          s.gameState = 'REGION_VICTORY';
          bus.emit(EVENTS.GAME_STATE_CHANGED, { state: s.gameState });
          SoundManager.playSfx('region_victory_fanfare');
        }
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
