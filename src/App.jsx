import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// --- Phase 1: Config & Core imports ---
import { V_WIDTH, V_HEIGHT, WALL_Y } from './config/constants.js';
import { COLORS } from './config/colors.js';
import { UNIT_TYPES } from './config/units.js';
import { BARRACKS_DEFS, BARRACKS_LAYOUT } from './config/barracks.js';
import { getCost, getSquadCap } from './core/utils.js';

import { CommandPanel } from './ui/panels/CommandPanel.jsx';
import { CombatScreen } from './ui/screens/CombatScreen.jsx';
import { HubTestScreen } from './ui/screens/HubTestScreen.jsx';

// --- Phase 2: System imports ---
import { spawnUnit as _spawnUnit, addParticle as _addParticle } from './systems/SpawnSystem.js';
import { triggerThunder as _triggerThunder, triggerFoxFire as _triggerFoxFire, triggerDragonWave as _triggerDragonWave, triggerWarDrums as _triggerWarDrums, triggerHarvest as _triggerHarvest, triggerResolve as _triggerResolve } from './systems/SpellSystem.js';
import { generateMap, applyNodeCompletion } from './systems/MapGenerator.js';

// --- Phase 5: Hook & Input imports ---
import { useMeta } from './hooks/useMeta.js';
import { useRunState } from './hooks/useRunState.js';
import { useGameLoop } from './hooks/useGameLoop.js';
import { useGameEvents } from './hooks/useGameEvents.js';
import { createInputHandlers } from './input/InputHandler.js';
import { spriteRenderer } from './renderer/SpriteRenderer.js';

export default function App() {
  const fgCanvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const [uiTick, setUiTick] = useState(0);
  const [armedSpell, setArmedSpell] = useState('BARRICADE');
  const armedSpellRef = useRef(armedSpell);
  useEffect(() => { armedSpellRef.current = armedSpell; }, [armedSpell]);
  
  const { meta, setMeta, metaRef } = useMeta();
  const { runState, setRunState, runStateRef, startRun, endRun } = useRunState();

  // mapNodes is lifted here so it survives HubTestScreen unmounting during combat.
  const [mapNodes, setMapNodes] = useState(() => generateMap(Date.now(), 0));

  const state = useRef({
    command: 0, totalCommand: 0, wave: 1, fever: 0, feverActive: 0, screenShake: 0, conscriptCooldown: 0,
    units: [], projectiles: [], explosions: [], floatingTexts: [], particles: [], slashTrails: [], lightnings: [], dragonWaves: [], foxFires: [],
    isSlashing: false, lastSlashPos: null,
    focusedBuilding: null,
    barracks: { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
    troopLevel: { HATAMOTO: 1, YUMI: 1, CAVALRY: 1, HOROKU: 1 },
    autoUnlocked: { HATAMOTO: false, YUMI: false, CAVALRY: false, HOROKU: false },
    timers: { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
    visuals: { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
    
    thunderCooldown: 0, foxFireCooldown: 0, dragonCooldown: 0,
    heroUnlocked: false, heroCooldown: 0,
    gameState: 'MAP_SCREEN', currentRegion: null,
    waveState: 'PRE_WAVE', waveTimer: 6.0, squadsToSpawn: [], enemiesInWave: 0, inkLineY: 0,
    lastTime: performance.now(), earnedHonor: 0,
    warDrumsActive: 0, harvestActive: 0,
    frontlineSlots: new Array(9).fill(null), 
    backlineSlots: new Array(9).fill(null),
    
    guardQuotas: { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
    recalcGuardsFlag: false,
    lastPlayerUnitCount: 0
  });

  const initRun = useCallback(() => {
    state.current = {
      ...state.current,
      gameState: 'MAP_SCREEN',
      currentRegion: null,
      focusedBuilding: null,
      earnedHonor: 0
    };
    setUiTick(t => t + 1);
  }, []);

  useEffect(() => { 
      setMeta(prev => ({ ...prev, conqueredRegions: [] }));
      initRun(); 
  }, [initRun, setMeta]);

  const startCombat = useCallback((regionId) => {
    if (!spriteRenderer.isLoaded()) {
      spriteRenderer.loadAllSprites().then(() => {
        console.log('[Sprites] All sprites loaded');
      }).catch(err => {
        console.warn('[Sprites] Failed to load some sprites:', err);
      });
    }
    
    state.current = {
      ...state.current, 
      command: 150, totalCommand: 150, wave: 1, fever: 0, feverActive: 0, screenShake: 0, conscriptCooldown: 0,
      units: [], projectiles: [], explosions: [], floatingTexts: [], particles: [], slashTrails: [], lightnings: [], dragonWaves: [], foxFires: [],
      focusedBuilding: null,
      barracks: { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
      troopLevel: { HATAMOTO: 1, YUMI: 1, CAVALRY: 1, HOROKU: 1 },
      autoUnlocked: { HATAMOTO: false, YUMI: false, CAVALRY: false, HOROKU: false },
      timers: { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
      visuals: { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
      
      thunderCooldown: 0, foxFireCooldown: 0, dragonCooldown: 0, heroUnlocked: false, heroCooldown: 0,
      warDrumsActive: 0, harvestActive: 0,
      frontlineSlots: new Array(9).fill(null), 
      backlineSlots: new Array(9).fill(null),
      gameState: 'COMBAT', currentRegion: regionId,
      waveState: 'PRE_WAVE', waveTimer: 6.0, squadsToSpawn: [], enemiesInWave: 0, inkLineY: 0,
      
      guardQuotas: { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
      recalcGuardsFlag: true,
      lastPlayerUnitCount: 0
    };
    
    const bgCtx = bgCanvasRef.current?.getContext('2d');
    if (bgCtx) {
      bgCtx.fillStyle = COLORS.parchment; 
      bgCtx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
    }
    setUiTick(t => t + 1);
  }, []);

  const handleRegionVictory = useCallback(() => {
    const regionId      = state.current.currentRegion;
    const currentRun    = runStateRef.current;

    if (regionId && !meta.conqueredRegions.includes(regionId)) {
      setMeta(prev => ({ ...prev, conqueredRegions: [...prev.conqueredRegions, regionId] }));
    }

    // Mark the completed combat node in the map (immutable update)
    if (regionId) {
      setMapNodes(prev => prev ? applyNodeCompletion(prev, regionId) : prev);
    }

    // Boss completion: award honor, increment run counter, end run, fresh map
    if (currentRun?.currentNodeType === 'boss') {
      setMeta(prev => ({
        ...prev,
        honor:     prev.honor + (currentRun.honorEarned ?? 0),
        totalRuns: (prev.totalRuns ?? 0) + 1,
      }));
      endRun();
      setMapNodes(generateMap(Date.now(), (meta.totalRuns ?? 0) + 1));
      state.current.gameState = 'MAP_SCREEN';
    } else if (regionId === 'THE_ABYSS') {
      state.current.gameState = 'CAMPAIGN_OVER';
    } else {
      state.current.gameState = 'MAP_SCREEN';
    }

    state.current.currentRegion = null;
    setUiTick(t => t + 1);
  }, [meta.conqueredRegions, meta.totalRuns, runStateRef, setMeta, endRun, setMapNodes]);

  const handlePlayNode = useCallback((node) => {
    // Auto-start a run if none is active (first node of a fresh map)
    const activeRun = runStateRef.current ?? startRun(meta);
    startCombat(node.id);
    setRunState(() => ({
      ...activeRun,
      currentNodeId:      node.id,
      currentNodeType:    node.type,
      currentNodeVariant: node.variant ?? null,
      currentNodeThreat:  node.threat  ?? 1,
      currentNodeWaves:   node.waves   ?? 3,
    }));
  }, [meta, runStateRef, startRun, startCombat, setRunState]);

  const spawnUnit = useCallback((typeKey, team, customX = null, customY = null) => {
    _spawnUnit(state.current, typeKey, team, customX, customY, metaRef);
  }, [metaRef]);

  // --- Centralized UI Action Handlers ---
  const buildBarracks = useCallback((bKey, cost, maxTime) => {
    const s = state.current;
    if (s.command >= cost && s.gameState === 'COMBAT') {
      s.command -= cost;
      s.barracks[bKey] = 1;
      s.timers[bKey] = maxTime;
      setUiTick(t => t + 1);
    }
  }, []);

  const upgradeTroopLevel = useCallback((bKey, cost) => {
    const s = state.current;
    if (s.command >= cost && s.gameState === 'COMBAT') {
      s.command -= cost;
      s.troopLevel[bKey]++;
      setUiTick(t => t + 1);
    }
  }, []);

  const upgradeBarracksCap = useCallback((bKey, cost) => {
    const s = state.current;
    if (s.command >= cost && s.gameState === 'COMBAT') {
      s.command -= cost;
      s.barracks[bKey]++;
      setUiTick(t => t + 1);
    }
  }, []);

  const hireDrill = useCallback((bKey, cost) => {
    const s = state.current;
    if (s.command >= cost && s.gameState === 'COMBAT') {
      s.command -= cost;
      s.autoUnlocked[bKey] = true;
      setUiTick(t => t + 1);
    }
  }, []);

  const unlockHero = useCallback((cost) => {
    const s = state.current;
    if (s.command >= cost && s.gameState === 'COMBAT') {
      s.command -= cost;
      s.heroUnlocked = true;
      setUiTick(t => t + 1);
    }
  }, []);

  const unlockProvision = useCallback((pKey, cost) => {
    if (metaRef.current.honor >= cost) {
      setMeta(prev => ({ 
        ...prev, 
        honor: prev.honor - cost, 
        unlockedProvisions: [...prev.unlockedProvisions, pKey] 
      }));
    }
  }, [setMeta, metaRef]);

  const equipProvision = useCallback((pKey) => {
    setMeta(prev => ({ 
      ...prev, 
      equippedItem: prev.equippedItem === pKey ? null : pKey 
    }));
  }, [setMeta]);

  const resetDynasty = useCallback(() => {
    const s = state.current;
    setMeta(prev => ({ 
      ...prev, 
      honor: prev.honor + s.earnedHonor, 
      conqueredRegions: [] 
    }));
    initRun();
  }, [initRun, setMeta]);

  const triggerWarDrums  = useCallback(() => _triggerWarDrums(state.current), []);
  const triggerHarvest   = useCallback(() => _triggerHarvest(state.current), []);
  const triggerResolve   = useCallback(() => _triggerResolve(state.current), []);
  const triggerThunder   = useCallback(() => _triggerThunder(state.current), []);
  const triggerFoxFire   = useCallback(() => _triggerFoxFire(state.current), []);
  const triggerDragonWave= useCallback(() => _triggerDragonWave(state.current), []);
  
  const changeQuota = useCallback((key, delta) => {
      const s = state.current;
      const level = s.barracks[key] || 0;
      const cap = getSquadCap(key, level, metaRef.current.equippedItem, metaRef.current.conqueredRegions);
      const newQuota = Math.max(0, Math.min(cap, (s.guardQuotas[key] || 0) + delta));
      
      s.guardQuotas[key] = newQuota;
      s.recalcGuardsFlag = true;
      setUiTick(t => t+1);
  }, [metaRef]);

  // Hook up Game Loop
  useGameLoop(state, fgCanvasRef, bgCanvasRef, metaRef, setUiTick);

  // Hook up Event Bus
  useGameEvents(setUiTick);

  // Hook up Input Handlers
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useMemo(() => 
    createInputHandlers(state, fgCanvasRef, setUiTick, metaRef, spawnUnit, armedSpellRef, setArmedSpell),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const s = state.current;
  const activeUnits = s.units.filter(u => u.team === 'player' && u.hp > 0 && u.type !== 'friction' && u.type !== 'hero').length;
  const maxTroops = Object.keys(BARRACKS_DEFS).reduce((sum, key) => sum + getSquadCap(key, s.barracks[key] || 0, meta.equippedItem, meta.conqueredRegions), 0);

  return (
    <div className="flex h-screen w-full bg-[#1b1918] text-[#1b1918] font-serif overflow-hidden select-none relative">
      {/* MAP SCREEN HUB (MACRO UI) */}
      {s.gameState === 'MAP_SCREEN' && (
        <HubTestScreen 
          meta={meta}
          setMeta={setMeta}
          runState={runState}
          setRunState={setRunState}
          startRun={startRun}
          onPlayNode={handlePlayNode}
          mapNodes={mapNodes}
          setMapNodes={setMapNodes}
          unlockProvision={unlockProvision}
          equipProvision={equipProvision}
        />
      )}

      {/* COMBAT SCREEN - Always mounted for canvas context persistence */}
      <CombatScreen 
        s={s} 
        meta={meta} 
        setMeta={setMeta} 
        armedSpell={armedSpell} 
        bgCanvasRef={bgCanvasRef} 
        fgCanvasRef={fgCanvasRef} 
        handlePointerDown={handlePointerDown} 
        handlePointerMove={handlePointerMove} 
        handlePointerUp={handlePointerUp} 
        initRun={initRun} 
        handleRegionVictory={handleRegionVictory} 
      />

      {/* RIGHT: COMMAND DASHBOARD - Only in combat */}
      {s.gameState !== 'MAP_SCREEN' && (
        <CommandPanel 
          s={s} 
          activeTroops={activeUnits} 
          maxTroops={maxTroops} 
          meta={meta} 
          setMeta={setMeta} 
          setUiTick={setUiTick} 
          changeQuota={changeQuota} 
          triggerWarDrums={triggerWarDrums} 
          triggerHarvest={triggerHarvest} 
          triggerResolve={triggerResolve} 
          triggerThunder={triggerThunder} 
          triggerFoxFire={triggerFoxFire} 
          triggerDragonWave={triggerDragonWave}
          buildBarracks={buildBarracks}
          upgradeTroopLevel={upgradeTroopLevel}
          upgradeBarracksCap={upgradeBarracksCap}
          hireDrill={hireDrill}
          unlockHero={unlockHero}
        />
      )}
    </div>
  );
}