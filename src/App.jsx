import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// --- Phase 1: Config & Core imports ---
import { V_WIDTH, V_HEIGHT, WALL_Y } from './config/constants.js';
import { COLORS } from './config/colors.js';
import { UNIT_TYPES } from './config/units.js';
import { BARRACKS_DEFS, BARRACKS_LAYOUT } from './config/barracks.js';
import { getCost, getSquadCap } from './core/utils.js';
import { CAVE_CONFIG } from './config/cave.js';

import { CommandPanel } from './ui/panels/CommandPanel.jsx';
import { CombatScreen } from './ui/screens/CombatScreen.jsx';
import { HubTestScreen } from './ui/screens/HubTestScreen.jsx';
import { SumiResultScreen } from './ui/screens/SumiResultScreen.jsx';

// --- Phase 2: System imports ---
import { spawnUnit as _spawnUnit, addParticle as _addParticle } from './systems/SpawnSystem.js';
import { triggerThunder as _triggerThunder, triggerFoxFire as _triggerFoxFire, triggerDragonWave as _triggerDragonWave, triggerWarDrums as _triggerWarDrums, triggerHarvest as _triggerHarvest, triggerResolve as _triggerResolve } from './systems/SpellSystem.js';
import { generateMap, applyNodeCompletion } from './systems/MapGenerator.js';
import { computeBlessingMultipliers, computeCurseMultipliers } from './systems/EventSystem.js';

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

  // For testing our new Sumi Result screen
  const [testResultContext, setTestResultContext] = useState(null);

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
    lastPlayerUnitCount: 0,
    
    cave: null,
    orb: null,
    
    combatStats: null,
  });

  const initRun = useCallback(() => {
    state.current = {
      ...state.current,
      gameState: 'MAP_SCREEN',
      currentRegion: null,
      focusedBuilding: null,
      earnedHonor: 0
    };
    // Reset conqueredRegions here so mount + resetDynasty both go through one path
    setMeta(prev => ({ ...prev, conqueredRegions: [] }));
    setUiTick(t => t + 1);
  }, [setMeta]);

  // Single call on mount — setMeta + setUiTick are batched together by React 18
  useEffect(() => { 
    initRun(); 

    // Setup global hooks for testing the Sumi Result Screen
    window.testSumiScreen = (type = 'battle_win') => {
      const mockData = {
        type,
        time: '4m 12s',
        title: type === 'battle_win' ? 'VICTORY' : type === 'battle_loss' ? 'DEFEAT' : type === 'event' ? 'FATE' : 'MARKET',
        stats: ['battle_win', 'battle_loss'].includes(type) ? {
          wavesConquered: type === 'battle_win' ? '5' : '3',
          totalWaves: '5',
          damageDealt: 14502,
          enemiesSlain: {
            total: 104,
            types: [
              { name: 'Peasant', count: 68 },
              { name: 'Oni', count: 24 },
              { name: 'Tengu', count: 12 }
            ]
          }
        } : null,
        resources: [
          { name: 'Honor', change: type === 'battle_loss' ? '-25' : '+150', color: type === 'battle_loss' ? 'text-[#b84235]' : 'text-[#d4af37]' },
          { name: 'Command', change: '+75', color: 'text-[#4a5d23]' }
        ],
        impacts: type === 'event' ? [
          { description: "The troops are inspired by the shrine.", color: "text-[#d4af37]" },
          { description: "+10% Max HP for next combat.", color: "text-[#4a5d23]" }
        ] : []
      };
      // If it's shop or event, we maybe don't have battle stats
      setTestResultContext(mockData);
    };

    window.closeSumiScreen = () => setTestResultContext(null);

    return () => {
      delete window.testSumiScreen;
      delete window.closeSumiScreen;
    };
  }, [initRun]);

  const startCombat = useCallback((regionId, explicitNode = null) => {
    if (!spriteRenderer.isLoaded()) {
      spriteRenderer.loadAllSprites().catch(err => {
        console.warn('[Sprites] Failed to load some sprites:', err);
      });
    }
    
    // Determine safely if this is a boss battle
    const isBoss = explicitNode ? explicitNode.type === 'boss' : metaRef.current.activeNodeType === 'boss';
    
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
      isBossNode: isBoss,
      
      guardQuotas: { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
      recalcGuardsFlag: true,
      lastPlayerUnitCount: 0,
      
      cave: isBoss ? {
        x: CAVE_CONFIG.cave.x,
        y: CAVE_CONFIG.cave.y,
        hp: CAVE_CONFIG.cave.maxHp,
        maxHp: CAVE_CONFIG.cave.maxHp,
        radius: CAVE_CONFIG.cave.radius,
      } : null,
      orb: isBoss ? {
        x: CAVE_CONFIG.orb.x,
        y: CAVE_CONFIG.orb.y,
        hp: CAVE_CONFIG.orb.maxHp,
        maxHp: CAVE_CONFIG.orb.maxHp,
        radius: CAVE_CONFIG.orb.radius,
        active: false,
        respawnTimer: undefined,
      } : null,
      
      combatStats: {
        damageDealt: 0,
        enemiesSlain: { total: 0, types: {} },
        startTime: performance.now(),
        lastTimeElapsedStr: '',
        conqueredWaves: 0 // Will track highest wave reached
      }
    };
    
    // Auto-spawn garrison units if a rest-node garrison was set this run
    // Read from runStateRef (holds pre-update value at this point — React hasn't re-rendered yet)
    const garrison = runStateRef.current?.pendingGarrison;
    if (garrison) {
      const garrisonUnits = {
        small:  [{ type: 'HATAMOTO', count: 2 }],
        medium: [{ type: 'HATAMOTO', count: 2 }, { type: 'YUMI', count: 1 }],
        large:  [{ type: 'HATAMOTO', count: 2 }, { type: 'YUMI', count: 1 }, { type: 'CAVALRY', count: 1 }],
      }[garrison.size] ?? [];

      garrisonUnits.forEach(({ type, count }) => {
        for (let i = 0; i < count; i++) {
          _spawnUnit(state.current, type, 'player', null, null, metaRef);
        }
      });
    }

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
    const combatHonor   = state.current.earnedHonor || 0;

    if (regionId && !meta.conqueredRegions.includes(regionId)) {
      setMeta(prev => ({ ...prev, conqueredRegions: [...prev.conqueredRegions, regionId] }));
    }

    if (regionId) {
      setMapNodes(prev => prev ? applyNodeCompletion(prev, regionId) : prev);
    }

    // IMMEDIATE HONOR: Add combat honor to meta.honor right away (for all node types)
    if (combatHonor > 0) {
      setMeta(prev => ({ ...prev, honor: prev.honor + combatHonor }));
    }

    // Boss completion: increment run counter, end run, generate fresh map
    if (currentRun?.currentNodeType === 'boss') {
      setMeta(prev => ({
        ...prev,
        totalRuns: (prev.totalRuns ?? 0) + 1,
      }));
      endRun();
      // Use metaRef to avoid reading a stale totalRuns from the closure
      setMapNodes(generateMap(Date.now(), (metaRef.current.totalRuns ?? 0) + 1));
      state.current.gameState = 'MAP_SCREEN';
    } else if (regionId === 'THE_ABYSS') {
      state.current.gameState = 'CAMPAIGN_OVER';
    } else {
      state.current.gameState = 'MAP_SCREEN';
    }

    // Accumulate combat honor into run state + decrement blessing durations
    if (currentRun) {
      setRunState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          honorEarned: (prev.honorEarned || 0) + combatHonor,
          blessings: prev.blessings
            .map(b => typeof b.combatsRemaining === 'number' && b.combatsRemaining !== Infinity
              ? { ...b, combatsRemaining: b.combatsRemaining - 1 }
              : b  // 'run' (Infinity) or non-numeric durations pass through unchanged
            )
            .filter(b => b.combatsRemaining !== 0),
        };
      });
    }

    // Clear stale node-context fields from meta so they don't bleed into the next combat
    setMeta(prev => ({
      ...prev,
      activeNodeType: null, activeNodeVariant: null, activeNodeThreat: 1, activeNodeWaves: 3,
      activeDamageMult: 1.0, activeAttackSpeedMult: 1.0, activeMaxHpMult: 1.0,
      activeArcherRangeMult: 1.0, activeMoveSpeedMult: 1.0,
      activeCurseDamageMult: 1.0, activeCurseMaxHpMult: 1.0,
    }));

    state.current.currentRegion = null;
    setUiTick(t => t + 1);
  }, [meta.conqueredRegions, meta.totalRuns, runStateRef, setMeta, setRunState, endRun, setMapNodes]);

  const handlePlayNode = useCallback((node) => {
    // 1. Compute blessing/curse multipliers from current run
    const blessingMults = computeBlessingMultipliers(runStateRef.current?.blessings ?? []);
    const curseMults    = computeCurseMultipliers(runStateRef.current?.curses ?? []);

    // 2. Inject multipliers + node context into metaRef so combat systems see them immediately
    setMeta(prev => ({
      ...prev,
      // Blessing multipliers (each starts at 1.0, additively modified)
      activeDamageMult:      blessingMults.damage,
      activeAttackSpeedMult: blessingMults.attackSpeed,
      activeMaxHpMult:       blessingMults.maxHp,
      activeArcherRangeMult: blessingMults.archerRange,
      activeMoveSpeedMult:   blessingMults.moveSpeed,
      // Curse multipliers
      activeCurseDamageMult: curseMults.damage,
      activeCurseMaxHpMult:  curseMults.maxHp,
      // Node context — read by WaveSystem (wave count fix) and SpawnSystem (budget scaling)
      activeNodeType:    node.type,
      activeNodeVariant: node.variant ?? null,
      activeNodeThreat:  node.threat  ?? 1,
      activeNodeWaves:   node.waves   ?? 3,   // ← fixes WaveSystem Gap #9
      // Carry garrison forward from run state (cleared in setRunState below)
      pendingGarrison: runStateRef.current?.pendingGarrison ?? null,
    }));

    // 3. Update runState with current node (and clear pendingGarrison so it is only consumed once)
    const activeRun = runStateRef.current ?? startRun(meta);
    setRunState(() => ({
      ...activeRun,
      currentNodeId:      node.id,
      currentNodeType:    node.type,
      currentNodeVariant: node.variant ?? null,
      currentNodeThreat:  node.threat  ?? 1,
      currentNodeWaves:   node.waves   ?? 3,
      pendingGarrison:    null,   // consumed — garrison spawns in startCombat
    }));

    // 4. Reset combat state and enter COMBAT screen
    startCombat(node.id, node);
  }, [meta, runStateRef, startRun, startCombat, setRunState, setMeta]);

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
      <SumiResultScreen data={testResultContext} onClose={() => setTestResultContext(null)} />
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