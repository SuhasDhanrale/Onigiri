import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Phase 1: Config & Core imports ---
import { V_WIDTH, V_HEIGHT, WALL_Y, BATTLE_LINE_Y, SLOT_OFFSETS } from './config/constants.js';
import { COLORS } from './config/colors.js';
import { UNIT_TYPES } from './config/units.js';
import { BARRACKS_DEFS, BARRACKS_LAYOUT } from './config/barracks.js';
import { CAMPAIGN_MAP, ENEMY_COSTS } from './config/campaign.js';
import { PERMANENT_TECHS, HEIRLOOMS } from './config/progression.js';

import { CommandPanel } from './ui/panels/CommandPanel.jsx';
import { CombatScreen } from './ui/screens/CombatScreen.jsx';
import { MapScreen } from './ui/screens/MapScreen.jsx';
import { generateId, getCost, getSquadCap, lineCircleCollide } from './core/utils.js';
import { createInitialState } from './core/GameState.js'; // Note: createInitialState is the only export now, but App.jsx has inline state currently

// --- Phase 2: System imports ---
import { recalculateGuards } from './systems/GuardSystem.js';
import { spawnUnit as _spawnUnit, addParticle as _addParticle } from './systems/SpawnSystem.js';
import { generateWave, tickWaveState } from './systems/WaveSystem.js';
import { tickBarracks } from './systems/BarracksSystem.js';
import { tickFoxFires, tickDragonWaves, triggerThunder as _triggerThunder, triggerFoxFire as _triggerFoxFire, triggerDragonWave as _triggerDragonWave, triggerWarDrums as _triggerWarDrums, triggerHarvest as _triggerHarvest, triggerResolve as _triggerResolve } from './systems/SpellSystem.js';
import { tickProjectiles } from './systems/ProjectileSystem.js';
import { tickParticles, tickEffects, tickInkLine } from './systems/ParticleSystem.js';
import { processDeaths } from './systems/RewardSystem.js';
import { tickUnits } from './systems/CombatSystem.js';

// --- Phase 3: Renderer imports ---
import { drawGame } from './renderer/GameRenderer.js';

export default function App() {
  const fgCanvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const [uiTick, setUiTick] = useState(0);
  const [armedSpell, setArmedSpell] = useState('BARRICADE'); // STEP 2: Armed Spell State
  
  const [meta, setMeta] = useState({ 
      honor: 0, 
      unlockedHeirlooms: [], 
      equippedHeirloom: null,
      conqueredRegions: [],
      unlockedTechs: []
  });
  
  const metaRef = useRef(meta);
  useEffect(() => { metaRef.current = meta; }, [meta]);

  const state = useRef({
    koku: 0, totalKoku: 0, wave: 1, fever: 0, feverActive: 0, screenShake: 0, conscriptCooldown: 0,
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
    
    // STEP 3: Guard Quotas State Initialization
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
  }, [initRun]);

  const startCombat = useCallback((regionId) => {
    state.current = {
      ...state.current, 
      koku: 150, totalKoku: 150, wave: 1, fever: 0, feverActive: 0, screenShake: 0, conscriptCooldown: 0,
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
      
      // STEP 3: Guard Quotas Reset
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
    const regionId = state.current.currentRegion;
    if (regionId && !meta.conqueredRegions.includes(regionId)) {
        setMeta(prev => ({ ...prev, conqueredRegions: [...prev.conqueredRegions, regionId] }));
    }
    
    if (regionId === 'THE_ABYSS') {
        state.current.gameState = 'CAMPAIGN_OVER';
    } else {
        state.current.gameState = 'MAP_SCREEN';
    }
    state.current.currentRegion = null;
    setUiTick(t => t+1);
  }, [meta.conqueredRegions]);

  const addParticle = (x, y, color, count = 5, speed = 400) => {
    _addParticle(state.current, x, y, color, count, speed);
  };

  
  // --- Centralized UI Action Handlers ---
  const buildBarracks = useCallback((bKey, cost, maxTime) => {
    const s = state.current;
    if (s.koku >= cost && s.gameState === 'COMBAT') {
      s.koku -= cost;
      s.barracks[bKey] = 1;
      s.timers[bKey] = maxTime;
      setUiTick(t => t + 1);
    }
  }, []);

  const upgradeTroopLevel = useCallback((bKey, cost) => {
    const s = state.current;
    if (s.koku >= cost && s.gameState === 'COMBAT') {
      s.koku -= cost;
      s.troopLevel[bKey]++;
      setUiTick(t => t + 1);
    }
  }, []);

  const upgradeBarracksCap = useCallback((bKey, cost) => {
    const s = state.current;
    if (s.koku >= cost && s.gameState === 'COMBAT') {
      s.koku -= cost;
      s.barracks[bKey]++;
      setUiTick(t => t + 1);
    }
  }, []);

  const hireDrill = useCallback((bKey, cost) => {
    const s = state.current;
    if (s.koku >= cost && s.gameState === 'COMBAT') {
      s.koku -= cost;
      s.autoUnlocked[bKey] = true;
      setUiTick(t => t + 1);
    }
  }, []);

  const unlockHero = useCallback((cost) => {
    const s = state.current;
    if (s.koku >= cost && s.gameState === 'COMBAT') {
      s.koku -= cost;
      s.heroUnlocked = true;
      setUiTick(t => t + 1);
    }
  }, []);

  const unlockHeirloom = useCallback((hKey, cost) => {
    if (metaRef.current.honor >= cost) {
      setMeta(prev => ({ 
        ...prev, 
        honor: prev.honor - cost, 
        unlockedHeirlooms: [...prev.unlockedHeirlooms, hKey] 
      }));
    }
  }, []);

  const equipHeirloom = useCallback((hKey) => {
    setMeta(prev => ({ 
      ...prev, 
      equippedHeirloom: prev.equippedHeirloom === hKey ? null : hKey 
    }));
  }, []);

  const unlockTech = useCallback((tKey, cost) => {
    if (metaRef.current.honor >= cost) {
      setMeta(prev => ({ 
        ...prev, 
        honor: prev.honor - cost, 
        unlockedTechs: [...prev.unlockedTechs, tKey] 
      }));
    }
  }, []);

  const resetDynasty = useCallback(() => {
    const s = state.current;
    setMeta(prev => ({ 
      ...prev, 
      honor: prev.honor + s.earnedHonor, 
      conqueredRegions: [] 
    }));
    initRun();
  }, [initRun]);

  const spawnUnit = useCallback((typeKey, team, customX = null, customY = null) => {
    _spawnUnit(state.current, typeKey, team, customX, customY, metaRef);
  }, []);

  const generateWaveCallback = useCallback((waveNum) => generateWave(waveNum), []);

  const buySystem = useCallback((dict, key, costMultKey) => {
    const s = state.current;
    const def = dict[key];
    const level = s[costMultKey][key];
    const cost = getCost(def.baseCost, def.costMult, level);
    if (s.koku >= cost) {
      s.koku -= cost;
      s[costMultKey][key]++;
      setUiTick(t => t + 1);
      return true;
    }
    return false;
  }, []);

  const triggerWarDrums  = useCallback(() => _triggerWarDrums(state.current,  setUiTick), []);
  const triggerHarvest   = useCallback(() => _triggerHarvest(state.current,   setUiTick), []);
  const triggerResolve   = useCallback(() => _triggerResolve(state.current,   setUiTick), []);
  const triggerThunder   = useCallback(() => _triggerThunder(state.current,   setUiTick), []);
  const triggerFoxFire   = useCallback(() => _triggerFoxFire(state.current,   setUiTick), []);
  const triggerDragonWave= useCallback(() => _triggerDragonWave(state.current,setUiTick), []);
  
  // STEP 3: Handle UI Guard Quota Interaction
  const changeQuota = useCallback((key, delta) => {
      const s = state.current;
      const level = s.barracks[key] || 0;
      const cap = getSquadCap(key, level, metaRef.current.equippedHeirloom, metaRef.current.conqueredRegions);
      const newQuota = Math.max(0, Math.min(cap, (s.guardQuotas[key] || 0) + delta));
      
      s.guardQuotas[key] = newQuota;
      s.recalcGuardsFlag = true;
      setUiTick(t => t+1);
  }, []);

  const handlePointerDown = useCallback((e) => {
    const s = state.current;
    if (s.gameState !== 'COMBAT') return;
    const { x, y } = getCanvasPos(e);
    if (s.feverActive > 0) { s.isSlashing = true; s.lastSlashPos = { x, y }; return; }
    
    let clickedBuilding = null;
    Object.entries(BARRACKS_LAYOUT).forEach(([key, layout]) => {
      if (Math.abs(x - layout.x) < layout.w / 1.8 && y > layout.y - layout.h && y < layout.y + 100) clickedBuilding = key;
    });

    const isImperial = metaRef.current.equippedHeirloom === 'IMPERIAL_BANNER';
    const bannerMult = isImperial ? 1.5 : 1.0;

    if (clickedBuilding) {
       const level = s.barracks[clickedBuilding];
       if (level > 0) {
           const def = BARRACKS_DEFS[clickedBuilding];
           const cap = getSquadCap(clickedBuilding, level, metaRef.current.equippedHeirloom, metaRef.current.conqueredRegions);
           const currentCount = s.units.filter(u => u.name === UNIT_TYPES[def.unit].name && u.team === 'player' && u.hp > 0).length;
           
           if (currentCount < cap) {
               const maxTime = def.spawnRate * bannerMult;
               
               s.timers[clickedBuilding] -= (maxTime * 0.20);
               s.visuals[clickedBuilding] = 0.6; 
               addParticle(BARRACKS_LAYOUT[clickedBuilding].x, BARRACKS_LAYOUT[clickedBuilding].y - 50, '#facc15', 15, 300);
               s.floatingTexts.push({ x: BARRACKS_LAYOUT[clickedBuilding].x, y: BARRACKS_LAYOUT[clickedBuilding].y - 80, text: '+20%', color: '#facc15', life: 0.8, vy: -50 });
           } else {
               s.visuals[clickedBuilding] = 0.2; 
               s.floatingTexts.push({ x: BARRACKS_LAYOUT[clickedBuilding].x, y: BARRACKS_LAYOUT[clickedBuilding].y - 80, text: 'FULL', color: '#b84235', life: 0.6, vy: -30 });
           }
       } else {
           s.floatingTexts.push({ x: BARRACKS_LAYOUT[clickedBuilding].x, y: BARRACKS_LAYOUT[clickedBuilding].y - 80, text: 'UNLOCK IN COMMAND', color: COLORS.ink, life: 1.0, vy: -20 });
       }
    } else {
        // STEP 2: The Snap (Attention Break)
        if (s.focusedBuilding !== null) {
            s.focusedBuilding = null;
            s.floatingTexts.push({ x, y, text: '[ FOCUS BROKEN ]', color: '#b84235', life: 1.5, vy: -30 });
            setUiTick(t => t + 1);
        }

        // STEP 2: One-Click Canvas Execution
        if (armedSpell === 'BARRICADE') {
            if (y < WALL_Y + 150 && y > 100 && s.conscriptCooldown <= 0) {
                spawnUnit('BARRICADE', 'player', x, y);
                addParticle(x, y, COLORS.khaki, 8); 
                s.conscriptCooldown = 0.5;
            }
        } 
        
        // Revert to Barricade after any spell/trap is deployed
        setArmedSpell('BARRICADE');
    }
  }, [spawnUnit, armedSpell]);

  const getCanvasPos = (e) => {
    const canvas = fgCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (V_WIDTH / rect.width), y: (e.clientY - rect.top) * (V_HEIGHT / rect.height) };
  };

  const handlePointerMove = useCallback((e) => {
    const s = state.current;
    if (!s.isSlashing || s.feverActive <= 0 || s.gameState !== 'COMBAT') return;
    const { x, y } = getCanvasPos(e);
    const prev = s.lastSlashPos;
    if (!prev) return;
    if ((x - prev.x)**2 + (y - prev.y)**2 > 600) { 
      s.slashTrails.push({ x1: prev.x, y1: prev.y, x2: x, y2: y, life: 1.0 });
      let hitAny = false;
      s.units.filter(u => u.team === 'enemy').forEach(u => {
        if (lineCircleCollide(prev.x, prev.y, x, y, u.x, u.y, u.radius + 40)) {
          u.hp -= 500; hitAny = true;
          u.burn = 6.0; 
        }
      });
      if (hitAny) s.screenShake = 0.3; 
      s.lastSlashPos = { x, y };
    }
  }, []);

  const handlePointerUp = useCallback(() => { state.current.isSlashing = false; state.current.lastSlashPos = null; }, []);

  const spawnHero = () => {
      const s = state.current;
      if (s.heroUnlocked && s.heroCooldown <= 0) {
         spawnUnit('CHAMPION', 'player', V_WIDTH / 2, WALL_Y - 50);
         s.screenShake = 1.0; s.heroCooldown = 40.0;
         setUiTick(t => t+1);
      }
  };
  
  const triggerWrath = () => {
      const s = state.current;
      if (s.fever >= 100) {
          s.fever = 0; s.feverActive = 7.0; s.screenShake = 0.6;
          setUiTick(t => t+1);
      }
  }

  useEffect(() => {
    const fgCanvas = fgCanvasRef.current;
    const fgCtx = fgCanvas?.getContext('2d');
    if (!fgCtx) return;
    let animationFrameId;

    const updateGame = (dt, s, now) => {
      // Guard recalc (event-driven, performance optimized)
      const currentPlayerUnits = s.units.filter(u => u.team === 'player' && u.hp > 0 && u.type !== 'friction' && u.type !== 'hero').length;
      if (s.lastPlayerUnitCount !== currentPlayerUnits || s.recalcGuardsFlag) {
        Object.keys(BARRACKS_DEFS).forEach(k => recalculateGuards(s, k));
        s.lastPlayerUnitCount = currentPlayerUnits;
        s.recalcGuardsFlag = false;
      }

      // Global cooldown ticks
      s.screenShake -= dt;
      if (s.feverActive > 0)        s.feverActive -= dt;
      if (s.conscriptCooldown > 0)  s.conscriptCooldown -= dt;
      if (s.heroCooldown > 0)       s.heroCooldown -= dt;
      if (s.warDrumsActive > 0)     s.warDrumsActive -= dt;
      if (s.harvestActive > 0)      s.harvestActive -= dt;
      if (s.thunderCooldown > 0)    s.thunderCooldown -= dt;
      if (s.foxFireCooldown > 0)    s.foxFireCooldown -= dt;
      if (s.dragonCooldown > 0)     s.dragonCooldown -= dt;

      // --- Systems ---
      tickBarracks(s, dt, metaRef);
      tickInkLine(s, dt);
      tickWaveState(s, dt, metaRef, setUiTick);
      tickFoxFires(s, dt);
      tickDragonWaves(s, dt);
      tickProjectiles(s, dt);
      tickUnits(s, dt, now, metaRef, setUiTick);

      const bgCtx = bgCanvasRef.current?.getContext('2d');
      processDeaths(s, bgCtx, metaRef, setUiTick);

      tickParticles(s, dt);
      tickEffects(s, dt);
    };

    const gameLoop = (time) => {

      try {
        const s = state.current;
        const now = performance.now();
        const dt = Math.max(0.001, Math.min((now - s.lastTime) / 1000, 0.1)); 
        s.lastTime = now;
        
        if (s.gameState === 'COMBAT' || s.gameState === 'GAMEOVER' || s.gameState === 'REGION_VICTORY') {
            if (s.gameState === 'COMBAT') updateGame(dt, s, now);
            drawGame(fgCtx, s, dt, now, metaRef);
        }
      } catch(e) {
        console.error("Game loop error caught:", e);
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    const uiInterval = setInterval(() => setUiTick(t => t + 1), 100);
    return () => { cancelAnimationFrame(animationFrameId); clearInterval(uiInterval); };
  }, [spawnUnit, handleRegionVictory, changeQuota]);

  const s = state.current;


  const activeTroops = s.units.filter(u => u.team === 'player' && u.type !== 'friction' && u.type !== 'hero').length;
  const maxTroops = Object.keys(BARRACKS_DEFS).reduce((sum, key) => sum + getSquadCap(key, s.barracks[key] || 0, meta.equippedHeirloom, meta.conqueredRegions), 0);

  const isImperial = meta.equippedHeirloom === 'IMPERIAL_BANNER';
  const bannerMult = isImperial ? 1.5 : 1.0;



  return (
    <div className="flex h-screen w-full bg-[#1b1918] text-[#1b1918] font-serif overflow-hidden select-none relative">
      
      {/* MAP SCREEN HUB (MACRO UI) */}
      <MapScreen 
        s={s} 
        meta={meta} 
        setMeta={setMeta} 
        initRun={initRun} 
        startCombat={startCombat} 
        unlockHeirloom={unlockHeirloom}
        equipHeirloom={equipHeirloom}
        unlockTech={unlockTech}
        resetDynasty={resetDynasty}
      />
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

      {/* RIGHT: COMMAND DASHBOARD */}
      <CommandPanel 
        s={s} 
        activeTroops={activeTroops} 
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
      {/* scrollbar styles moved to src/styles/base.css — imported via main.jsx */}
    </div>
  );
}