import { getSquadCap } from './utils.js';
import { BARRACKS_DEFS } from '../config/barracks.js';
import { UNIT_TYPES } from '../config/units.js';
import { V_WIDTH, SLOT_OFFSETS } from '../config/constants.js';

/**
 * Recalculates guard/defend/patrol stance assignments for all units of a
 * given barracks type. Called whenever player unit count changes or quotas
 * change (via recalcGuardsFlag).
 *
 * @param {object} s       - game state (state.current)
 * @param {string} bKey    - barracks key e.g. 'HATAMOTO'
 */
export function recalculateGuards(s, bKey) {
  const def = BARRACKS_DEFS[bKey];
  if (!def) return;

  const uName = UNIT_TYPES[def.unit].name;
  const isRanged = def.unit === 'YUMI' || def.unit === 'HOROKU';
  const isCav = def.unit === 'CAVALRY';
  const quota = s.guardQuotas[bKey] || 0;

  // Filter and sort by Y descending (closest to gate selected first)
  const myUnits = s.units.filter(u => u.team === 'player' && u.name === uName && u.hp > 0);
  myUnits.sort((a, b) => b.y - a.y);

  let frontIdx = 0;
  let backIdx = 0;

  for (let i = 0; i < myUnits.length; i++) {
    const u = myUnits[i];
    if (i < quota) {
      if (isCav) {
        u.stance = 'PATROL';
        u.patrolDir = (i % 2 === 0) ? 1 : -1;
        u.defendY = 1200;
      } else {
        u.stance = 'DEFEND';
        const baseY = isRanged ? 1180 : 1100;
        const idx = isRanged ? backIdx++ : frontIdx++;
        u.slotType = isRanged ? 'back' : 'front';

        const row = Math.floor(idx / SLOT_OFFSETS.length);
        u.slotIndex = idx % SLOT_OFFSETS.length;

        u.defendX = (V_WIDTH / 2) + (SLOT_OFFSETS[u.slotIndex] * 130);
        u.defendY = baseY + (row * 35);

        const slotArr = isRanged ? s.backlineSlots : s.frontlineSlots;
        slotArr[u.slotIndex] = { id: u.id, type: def.unit };
      }
    } else {
      u.stance = 'ATTACK';
      u.defendX = null;
      u.defendY = null;
      if (u.slotType) {
        const arr = u.slotType === 'front' ? s.frontlineSlots : s.backlineSlots;
        if (arr[u.slotIndex]?.id === u.id) arr[u.slotIndex] = null;
        u.slotType = null;
        u.slotIndex = null;
      }
    }
  }
}

/**
 * Returns the initial game state object.
 * Called in startCombat() and state.current initialisation.
 */
export function createInitialState() {
  return {
    koku: 0, totalKoku: 0, wave: 1, fever: 0, feverActive: 0,
    screenShake: 0, conscriptCooldown: 0,
    units: [], projectiles: [], explosions: [], floatingTexts: [],
    particles: [], slashTrails: [], lightnings: [], dragonWaves: [], foxFires: [],
    isSlashing: false, lastSlashPos: null,
    focusedBuilding: null,
    barracks:    { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
    troopLevel:  { HATAMOTO: 1, YUMI: 1, CAVALRY: 1, HOROKU: 1 },
    autoUnlocked:{ HATAMOTO: false, YUMI: false, CAVALRY: false, HOROKU: false },
    timers:      { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
    visuals:     { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
    thunderCooldown: 0, foxFireCooldown: 0, dragonCooldown: 0,
    heroUnlocked: false, heroCooldown: 0,
    gameState: 'MAP_SCREEN', currentRegion: null,
    waveState: 'PRE_WAVE', waveTimer: 6.0, squadsToSpawn: [],
    enemiesInWave: 0, inkLineY: 0,
    lastTime: performance.now(), earnedHonor: 0,
    warDrumsActive: 0, harvestActive: 0,
    frontlineSlots: new Array(9).fill(null),
    backlineSlots:  new Array(9).fill(null),
    guardQuotas:       { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
    recalcGuardsFlag:  false,
    lastPlayerUnitCount: 0
  };
}
