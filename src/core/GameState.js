
/**
 * Returns the initial game state object.
 * Called in startCombat() and state.current initialisation.
 */
export function createInitialState() {
  return {
    command: 0, totalCommand: 0, wave: 1, fever: 0, feverActive: 0,
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
