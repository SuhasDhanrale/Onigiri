import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// --- Phase 1: Config & Core imports ---
import { V_WIDTH, V_HEIGHT, WALL_Y } from './config/constants.js';
import { COLORS } from './config/colors.js';
import { UNIT_TYPES } from './config/units.js';
import { BARRACKS_DEFS, BARRACKS_LAYOUT } from './config/barracks.js';
import { getCost, getSquadCap } from './core/utils.js';
import { CAVE_CONFIG } from './config/cave.js';
import { CAMPAIGN_CHAPTER_IDS, getCampaignChapter, getChapterBossId, getChapterEnemyStatMultiplier } from './config/campaign.js';

import { CommandPanel } from './ui/panels/CommandPanel.jsx';
import { DevModifierOverlay } from './ui/panels/DevModifierOverlay.jsx';
import { CombatScreen } from './ui/screens/CombatScreen.jsx';
import { HomeScreen } from './ui/screens/HomeScreen.jsx';
import { HubTestScreen } from './ui/screens/HubTestScreen.jsx';
import { SumiResultScreen } from './ui/screens/SumiResultScreen.jsx';

// --- Phase 2: System imports ---
import { spawnUnit as _spawnUnit, addParticle as _addParticle } from './systems/SpawnSystem.js';
import { triggerThunder as _triggerThunder, triggerFoxFire as _triggerFoxFire, triggerDragonWave as _triggerDragonWave, triggerWarDrums as _triggerWarDrums, triggerHarvest as _triggerHarvest, triggerResolve as _triggerResolve } from './systems/SpellSystem.js';
import { generateMap, applyNodeCompletion } from './systems/MapGenerator.js';
import { computeBlessingMultipliers, computeCurseMultipliers, tickCurses, getCurseHonorMult } from './systems/EventSystem.js';
import { computeShopModifiers } from './systems/ShopSystem.js';
import { applyNodeRewardToRunState, makeNodeFromRun, resolveNodeVictoryReward, summarizeResolvedReward } from './systems/NodeRewardSystem.js';

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

  // Result screen context for combat
  const [resultContext, setResultContext] = useState(null);
  const [showHome, setShowHome] = useState(true);

  // mapNodes is lifted here so it survives HubTestScreen unmounting during combat.
  const [mapNodes, setMapNodes] = useState(() => generateMap(Date.now(), 0));

  const state = useRef({
    command: 0, totalCommand: 0, wave: 1, fever: 0, feverActive: 0, screenShake: 0, conscriptCooldown: 0,
    units: [], projectiles: [], explosions: [], floatingTexts: [], particles: [], slashTrails: [], lightnings: [], dragonWaves: [], foxFires: [], bossHazards: [],
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
    bossId: null,
    chapterBossSpawned: false,
    
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
    setShowHome(true);
    setUiTick(t => t + 1);
  }, [setMeta]);

  useEffect(() => { 
    initRun(); 
  }, [initRun]);

  useEffect(() => {
    const s = state.current;
    if (s.gameState === 'REGION_VICTORY' && !resultContext) {
      const combatStats = s.combatStats;
      if (combatStats) {
        const elapsed = performance.now() - combatStats.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const timeStr = `${minutes}m ${seconds}s`;

        const enemiesSlainTypes = Object.entries(combatStats.enemiesSlain.types)
          .map(([name, count]) => ({ name, count }));

        const currentRun = runStateRef.current;
        const totalWaves = currentRun?.currentNodeWaves ?? metaRef.current.activeNodeWaves ?? s.wave;
        const isBossClear = currentRun?.currentNodeType === 'boss';
        const nodeReward = resolveNodeVictoryReward(makeNodeFromRun(currentRun), currentRun);
        let combatHonor = s.earnedHonor || 0;
        combatHonor = Math.round(combatHonor * getCurseHonorMult(currentRun?.curses ?? []));
        if (isBossClear && (currentRun?.curses ?? []).some(c => c.id === 'FOX_DEBT')) {
          combatHonor = Math.round(combatHonor * 0.5);
        }
        const nodeRewardSummary = summarizeResolvedReward(nodeReward);
        const resources = [
          ...(combatHonor > 0 ? [{ name: 'Combat Honor', change: `+${combatHonor}`, color: 'text-[#d4af37]' }] : []),
          ...nodeRewardSummary.resources,
        ];
        
        setResultContext({
          type: 'battle_win',
          time: timeStr,
          title: 'VICTORY',
          stats: {
            wavesConquered: combatStats.conqueredWaves,
            totalWaves,
            damageDealt: combatStats.damageDealt,
            enemiesSlain: {
              total: combatStats.enemiesSlain.total,
              types: enemiesSlainTypes
            }
          },
          resources,
          impacts: nodeRewardSummary.impacts
        });
      }
    }
    
    if (s.gameState === 'GAMEOVER' && !resultContext) {
      const combatStats = s.combatStats;
      if (combatStats) {
        const elapsed = performance.now() - combatStats.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const timeStr = `${minutes}m ${seconds}s`;

        const enemiesSlainTypes = Object.entries(combatStats.enemiesSlain.types)
          .map(([name, count]) => ({ name, count }));

        const currentRun = runStateRef.current;
        const totalWaves = currentRun?.currentNodeWaves ?? metaRef.current.activeNodeWaves ?? s.wave;
        const combatHonor = s.earnedHonor || 0;
        
        setResultContext({
          type: 'battle_loss',
          time: timeStr,
          title: 'DEFEAT',
          stats: {
            wavesConquered: combatStats.conqueredWaves,
            totalWaves,
            damageDealt: combatStats.damageDealt,
            enemiesSlain: {
              total: combatStats.enemiesSlain.total,
              types: enemiesSlainTypes
            }
          },
          resources: [
            { name: 'Honor', change: `+${combatHonor}`, color: 'text-[#d4af37]' }
          ],
          impacts: []
        });
      }
    }
  }, [uiTick, resultContext]);

  const startCombat = useCallback((regionId, explicitNode = null) => {
    if (!spriteRenderer.isLoaded()) {
      spriteRenderer.loadAllSprites().catch(err => {
        console.warn('[Sprites] Failed to load some sprites:', err);
      });
    }
    
    // Determine safely if this is a boss battle
    const isBoss = explicitNode ? explicitNode.type === 'boss' : metaRef.current.activeNodeType === 'boss';
    const bossId = isBoss
      ? (explicitNode?.bossId ?? getChapterBossId(runStateRef.current?.chapterId ?? metaRef.current.activeChapterId))
      : null;

    // Q1=A: combat seeds from the run's baseCommand (unified economy); legacy 150 fallback if no run yet
    const startCommand = runStateRef.current?.baseCommand ?? 150;

    // Phase C: run-duration shop buffs, read at combat start and stored on game state
    const shopMods = computeShopModifiers(runStateRef.current?.shopPurchases);

    state.current = {
      ...state.current, 
      command: startCommand, totalCommand: startCommand, wave: 1, fever: 0, feverActive: 0, screenShake: 0, conscriptCooldown: 0,
      units: [], projectiles: [], explosions: [], floatingTexts: [], particles: [], slashTrails: [], lightnings: [], dragonWaves: [], foxFires: [], bossHazards: [],
      focusedBuilding: null,
      barracks: { 
        HATAMOTO: metaRef.current.unlockedBarracks?.includes('HATAMOTO') ? 1 : 0, 
        YUMI: metaRef.current.unlockedBarracks?.includes('YUMI') ? 1 : 0, 
        CAVALRY: metaRef.current.unlockedBarracks?.includes('CAVALRY') ? 1 : 0, 
        HOROKU: metaRef.current.unlockedBarracks?.includes('HOROKU') ? 1 : 0 
      },
      troopLevel: { HATAMOTO: 1, YUMI: 1, CAVALRY: 1, HOROKU: 1 },
      autoUnlocked: { 
        HATAMOTO: metaRef.current.unlockedBarracks?.includes('HATAMOTO') || false, 
        YUMI: metaRef.current.unlockedBarracks?.includes('YUMI') || false, 
        CAVALRY: metaRef.current.unlockedBarracks?.includes('CAVALRY') || false, 
        HOROKU: metaRef.current.unlockedBarracks?.includes('HOROKU') || false 
      },
      timers: { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
      visuals: { HATAMOTO: 0, YUMI: 0, CAVALRY: 0, HOROKU: 0 },
      
      thunderCooldown: 0, foxFireCooldown: 0, dragonCooldown: 0, heroUnlocked: false, heroCooldown: 0,
      warDrumsActive: 0, harvestActive: 0,
      frontlineSlots: new Array(9).fill(null), 
      backlineSlots: new Array(9).fill(null),
      shopUnitStatMult: shopMods.unitStatMult, shopArcherFireMult: shopMods.archerFireMult,
      shopBarracksTimeMult: shopMods.barracksTimeMult, shopSpellCooldownMult: shopMods.spellCooldownMult,
      shopTowerHpMult: shopMods.towerHpMult,  // iron_fortifications: +100% Arrow Tower HP
      dragonUnlocked: shopMods.dragonUnlocked,  // dragon_scroll (Q3=A): Dragon Wave locked until purchased
      gameState: 'COMBAT', currentRegion: regionId,
      waveState: 'PRE_WAVE', waveTimer: 6.0, squadsToSpawn: [], enemiesInWave: 0, inkLineY: 0,
      isBossNode: isBoss,
      bossId,
      chapterBossSpawned: false,
      
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
    
    // FR-Q=A: apply run-scoped barracks unlocks (fresh_recruits) on top of meta unlocks
    for (const key of (runStateRef.current?.shopBarracksUnlocks ?? [])) {
      if (state.current.barracks[key] !== undefined) {
        state.current.barracks[key] = 1;
        state.current.autoUnlocked[key] = true;
      }
    }

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

    // Pre-spawn Hatamotos if unlocked
    if (metaRef.current.unlockedBarracks?.includes('HATAMOTO')) {
      _spawnUnit(state.current, 'HATAMOTO', 'player', null, null, metaRef);
      _spawnUnit(state.current, 'HATAMOTO', 'player', null, null, metaRef);
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
    const isBossClear   = currentRun?.currentNodeType === 'boss';
    const chapterId     = currentRun?.chapterId ?? metaRef.current.activeChapterId ?? null;
    let combatHonor     = state.current.earnedHonor || 0;
    const combatCommandLeft = state.current.command ?? 0;  // Q1=A: leftover combat command banks back to the run
    const nodeReward = resolveNodeVictoryReward(makeNodeFromRun(currentRun), currentRun);

    // D2: curses bite the combat honor reward (read from pre-combat curses)
    combatHonor = Math.round(combatHonor * getCurseHonorMult(currentRun?.curses ?? []));  // OUTLAW -30%
    if (isBossClear && (currentRun?.curses ?? []).some(c => c.id === 'FOX_DEBT')) {
      combatHonor = Math.round(combatHonor * 0.5);  // FOX_DEBT -50% boss rewards
    }

    if (regionId) {
      setMapNodes(prev => prev ? applyNodeCompletion(prev, regionId) : prev);
    }

    const totalHonorReward = combatHonor + (nodeReward.honor ?? 0);
    if (totalHonorReward > 0) {
      setMeta(prev => ({ ...prev, honor: prev.honor + totalHonorReward }));
    }

    if (isBossClear) {
      const completedChapterIndex = CAMPAIGN_CHAPTER_IDS.indexOf(chapterId);
      const nextChapterId = completedChapterIndex >= 0
        ? (CAMPAIGN_CHAPTER_IDS[completedChapterIndex + 1] ?? null)
        : null;
      const isCampaignComplete = !nextChapterId;

      setMeta(prev => ({
        ...prev,
        conqueredRegions: chapterId && !prev.conqueredRegions.includes(chapterId)
          ? [...prev.conqueredRegions, chapterId]
          : prev.conqueredRegions,
        totalRuns: (prev.totalRuns ?? 0) + 1,
        activeChapterId: nextChapterId,
      }));
      endRun();
      if (isCampaignComplete) {
        state.current.gameState = 'CAMPAIGN_OVER';
        setShowHome(false);
      } else {
        state.current.gameState = 'MAP_SCREEN';
        setShowHome(true);
      }
    } else {
      state.current.gameState = 'MAP_SCREEN';
    }

    if (currentRun) {
      setRunState(prev => {
        if (!prev) return prev;
        const nextRun = {
          ...prev,
          baseCommand: combatCommandLeft,  // Q1=A: unified economy — carry combat command into the run pool
          honorEarned: (prev.honorEarned || 0) + combatHonor,
          curses: tickCurses(prev.curses, { combat: true, node: true }),  // D1: a combat is also a node visit
          blessings: prev.blessings
            .map(b => typeof b.combatsRemaining === 'number' && b.combatsRemaining !== Infinity
              ? { ...b, combatsRemaining: b.combatsRemaining - 1 }
              : b
            )
            .filter(b => b.combatsRemaining !== 0),
        };
        return applyNodeRewardToRunState(nextRun, nodeReward);
      });
    }

    setMeta(prev => ({
      ...prev,
      activeNodeType: null, activeNodeVariant: null, activeNodeThreat: 1, activeNodeWaves: 3,
      activeDamageMult: 1.0, activeAttackSpeedMult: 1.0, activeMaxHpMult: 1.0,
      activeArcherRangeMult: 1.0, activeMoveSpeedMult: 1.0, activeCommandDropMult: 1.0,
      activeCurseDamageMult: 1.0, activeCurseMaxHpMult: 1.0, activeSquadCapBonus: 0, activeBossId: null,
    }));

    state.current.currentRegion = null;
    setUiTick(t => t + 1);
  }, [runStateRef, setMeta, setRunState, endRun, setMapNodes, metaRef]);

  const handlePlayNode = useCallback((node) => {
    const activeRun = runStateRef.current ?? startRun(meta);

    // 1. Compute run and chapter multipliers
    const blessingMults = computeBlessingMultipliers(activeRun?.blessings ?? []);
    const curseMults    = computeCurseMultipliers(activeRun?.curses ?? []);
    const chapter       = getCampaignChapter(activeRun?.chapterId);
    const chapterEnemyStatMult = getChapterEnemyStatMultiplier(chapter.id);
    const bossId        = node.type === 'boss' ? getChapterBossId(chapter.id) : null;
    const combatNode    = bossId ? { ...node, bossId } : node;

    // 2. Inject multipliers + node context into metaRef so combat systems see them immediately
    setMeta(prev => ({
      ...prev,
      // Blessing multipliers (each starts at 1.0, additively modified)
      activeDamageMult:      blessingMults.damage,
      activeAttackSpeedMult: blessingMults.attackSpeed,
      activeMaxHpMult:       blessingMults.maxHp,
      activeArcherRangeMult: blessingMults.archerRange,
      activeMoveSpeedMult:   blessingMults.moveSpeed,
      activeCommandDropMult: blessingMults.commandDrop,
      // Curse multipliers
      activeCurseDamageMult: curseMults.damage,
      activeCurseMaxHpMult:  curseMults.maxHp,
      // Node context — read by WaveSystem (wave count fix) and SpawnSystem (budget scaling)
      activeNodeType:    node.type,
      activeNodeVariant: node.variant ?? null,
      activeNodeThreat:  node.threat  ?? 1,
      activeChapterId:            chapter.id,
      activeChapterThreat:        chapter.threatLevel ?? 1,
      activeChapterEnemyStatMult: chapterEnemyStatMult,
      activeNodeWaves:   node.waves   ?? 3,   // ← fixes WaveSystem Gap #9
      activeSquadCapBonus: activeRun?.squadCapBonus ?? 0,
      activeBossId: bossId,
      // Carry garrison forward from run state (cleared in setRunState below)
      pendingGarrison: activeRun?.pendingGarrison ?? null,
    }));

    // 3. Update runState with current node (and clear pendingGarrison so it is only consumed once)
    setRunState(() => ({
      ...activeRun,
      currentNodeId:      node.id,
      currentNodeType:    node.type,
      currentNodeVariant: node.variant ?? null,
      currentNodeThreat:  node.threat  ?? 1,
      currentNodeWaves:   node.waves   ?? 3,
      currentBossId:      bossId,
      pendingGarrison:    null,   // consumed — garrison spawns in startCombat
    }));

    // 4. Reset combat state and enter COMBAT screen
    startCombat(node.id, combatNode);
  }, [meta, runStateRef, startRun, startCombat, setRunState, setMeta]);

  const handleStartChapter = useCallback((chapterId) => {
    const existingRun = runStateRef.current;
    const activeRun = existingRun?.chapterId === chapterId
      ? existingRun
      : startRun(metaRef.current, chapterId);

    if (existingRun?.chapterId !== chapterId) {
      setMapNodes(generateMap(activeRun.mapSeed, activeRun.chapterNumber));
    }

    setMeta(prev => ({ ...prev, activeChapterId: chapterId }));
    state.current.gameState = 'MAP_SCREEN';
    setShowHome(false);
    setUiTick(t => t + 1);
  }, [metaRef, runStateRef, setMapNodes, setMeta, startRun]);

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
      const cap = getSquadCap(key, level, metaRef.current.equippedItem, metaRef.current.conqueredRegions, metaRef.current.activeSquadCapBonus ?? 0);
      const newQuota = Math.max(0, Math.min(cap, (s.guardQuotas[key] || 0) + delta));
      
      s.guardQuotas[key] = newQuota;
      s.recalcGuardsFlag = true;
      setUiTick(t => t+1);
  }, [metaRef]);

  const handleResultClose = useCallback(() => {
    const isLoss = resultContext?.type === 'battle_loss';
    setResultContext(null);
    
    if (isLoss) {
      setMeta(prev => ({ 
        ...prev, 
        honor: prev.honor + state.current.earnedHonor, 
        conqueredRegions: [] 
      }));
      initRun();
    } else {
      handleRegionVictory();
    }
  }, [resultContext, setMeta, initRun, handleRegionVictory]);

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
  const activeUnits = s.units.filter(u => u.team === 'player' && u.hp > 0 && u.type !== 'friction' && u.type !== 'hero' && u.name !== 'Arrow Tower').length;
  const maxTroops = Object.keys(BARRACKS_DEFS).reduce((sum, key) => sum + getSquadCap(key, s.barracks[key] || 0, meta.equippedItem, meta.conqueredRegions, meta.activeSquadCapBonus ?? 0), 0);

  return (
    <div className="flex h-screen w-full bg-[#1b1918] text-[#1b1918] font-serif overflow-hidden select-none relative">
      <SumiResultScreen data={resultContext} onClose={handleResultClose} />
      {showHome && (
        <HomeScreen
          meta={meta}
          onStartChapter={handleStartChapter}
        />
      )}

      {/* MAP SCREEN HUB (MACRO UI) */}
      {!showHome && s.gameState === 'MAP_SCREEN' && (
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

      {/* DEV-only read-only modifier overlay (no-op in production builds) */}
      {s.gameState !== 'MAP_SCREEN' && (
        <DevModifierOverlay runState={runState} meta={meta} s={s} />
      )}

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
