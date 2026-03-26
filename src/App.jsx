import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Phase 1: Config & Core imports ---
import { V_WIDTH, V_HEIGHT, WALL_Y, BATTLE_LINE_Y, SLOT_OFFSETS } from './config/constants.js';
import { COLORS } from './config/colors.js';
import { UNIT_TYPES } from './config/units.js';
import { BARRACKS_DEFS, BARRACKS_LAYOUT } from './config/barracks.js';
import { CAMPAIGN_MAP, ENEMY_COSTS } from './config/campaign.js';
import { PERMANENT_TECHS, HEIRLOOMS } from './config/progression.js';
import { generateId, getCost, getSquadCap, lineCircleCollide } from './core/utils.js';
import { recalculateGuards } from './core/GameState.js';

// --- Phase 2: System imports ---
import { spawnUnit as _spawnUnit, addParticle as _addParticle } from './systems/SpawnSystem.js';
import { generateWave, tickWaveState } from './systems/WaveSystem.js';
import { tickBarracks } from './systems/BarracksSystem.js';
import { tickFoxFires, tickDragonWaves, triggerThunder as _triggerThunder, triggerFoxFire as _triggerFoxFire, triggerDragonWave as _triggerDragonWave, triggerWarDrums as _triggerWarDrums, triggerHarvest as _triggerHarvest, triggerResolve as _triggerResolve } from './systems/SpellSystem.js';
import { tickProjectiles } from './systems/ProjectileSystem.js';
import { tickParticles, tickEffects, tickInkLine } from './systems/ParticleSystem.js';
import { processDeaths } from './systems/RewardSystem.js';
import { tickUnits } from './systems/CombatSystem.js';

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

    const drawUnitTopDown = (ctx, u) => {
      ctx.save(); ctx.translate(u.x, u.y); 

      if (u.stance === 'DEFEND' || u.stance === 'PATROL') {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)'; 
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, u.radius + 6 + Math.sin(performance.now() / 150) * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.fill();
      }

      if (u.isElite) {
          const pulse = Math.sin(performance.now() / 150) * 8;
          ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
          ctx.beginPath(); ctx.arc(0, 0, u.radius + 15 + pulse, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
          ctx.beginPath(); ctx.arc(0, 0, u.radius + 5 + pulse/2, 0, Math.PI*2); ctx.fill();
      }

      if (u.type === 'flying') { 
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; 
          ctx.beginPath(); 
          ctx.ellipse(-10, 45, Math.max(0.1, u.radius*0.8), Math.max(0.1, u.radius*0.4), 0, 0, Math.PI*2); 
          ctx.fill(); 
      }
      if (u.telegraphTimer > 0) { 
          const maxTelegraph = 0.8; 
          const fillRatio = 1 - (u.telegraphTimer / maxTelegraph); 
          ctx.strokeStyle = `rgba(184, 66, 53, 0.8)`; 
          ctx.lineWidth = 2; 
          ctx.beginPath(); 
          ctx.arc(0, 0, Math.max(0.1, u.range), 0, Math.PI*2); 
          ctx.stroke(); 
          ctx.fillStyle = `rgba(184, 66, 53, 0.4)`; 
          ctx.beginPath(); 
          ctx.arc(0, 0, Math.max(0.1, u.range * fillRatio), 0, Math.PI*2); 
          ctx.fill(); 
      }
      if (u.burn > 0) { 
          ctx.fillStyle = 'rgba(234, 88, 12, 0.3)'; 
          ctx.beginPath(); 
          ctx.arc(0, 0, Math.max(0.1, u.radius*1.5), 0, Math.PI*2); 
          ctx.fill(); 
      }
      
      ctx.rotate(u.team === 'player' ? -Math.PI/2 : Math.PI/2);
      ctx.lineWidth = 3; 
      ctx.strokeStyle = COLORS.ink; 
      ctx.lineJoin = 'round';
      const sw = Math.max(0, u.swingPhase) * 20;

      if (u.name === 'Bamboo Barricade') { 
          ctx.strokeStyle = '#4a3b32'; 
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-u.radius, -u.radius); ctx.lineTo(u.radius, u.radius);
          ctx.moveTo(u.radius, -u.radius); ctx.lineTo(-u.radius, u.radius);
          ctx.moveTo(0, -u.radius*1.2); ctx.lineTo(0, u.radius*1.2);
          ctx.stroke();
          ctx.fillStyle = '#8b8574';
          ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
      } 
      else if (u.name === 'Ikki Rebel') { 
          ctx.strokeStyle = `rgba(27, 25, 24, 0.5)`; 
          ctx.lineWidth = 2; 
          ctx.beginPath(); 
          ctx.arc(0, 0, Math.max(0.1, u.radius), 0, Math.PI*2); 
          ctx.stroke(); 
      } 
      else if (u.type === 'cavalry') { 
          ctx.fillStyle = COLORS.ink; 
          ctx.beginPath(); 
          ctx.ellipse(0, 0, Math.max(0.1, u.radius), Math.max(0.1, u.radius*0.6), 0, 0, Math.PI*2); 
          ctx.fill(); ctx.stroke(); 
          ctx.beginPath(); 
          ctx.ellipse(u.radius*0.8, 0, Math.max(0.1, u.radius*0.5), Math.max(0.1, u.radius*0.4), 0, 0, Math.PI*2); 
          ctx.fill(); 
          ctx.fillStyle = u.color; 
          ctx.beginPath(); 
          ctx.arc(-u.radius*0.2, 0, Math.max(0.1, u.radius*0.6), 0, Math.PI*2); 
          ctx.fill(); ctx.stroke(); 
          ctx.strokeStyle = COLORS.parchment; 
          ctx.lineWidth = 5; 
          ctx.beginPath(); 
          ctx.moveTo(0, u.radius*0.6); 
          ctx.lineTo(u.radius*2.8 + sw, u.radius*0.6); 
          ctx.stroke(); 
      } 
      else if (u.type === 'assassin') {
          ctx.fillStyle = COLORS.ink; 
          ctx.beginPath(); ctx.ellipse(-2, 0, Math.max(0.1, u.radius*0.8), Math.max(0.1, u.radius*1.2), 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = COLORS.vermilion; ctx.fillRect(-u.radius*0.8, -3, u.radius*1.6, 6);
          ctx.strokeStyle = '#8b8574'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(u.radius*0.8, 0); ctx.lineTo(u.radius*1.8 + sw, 0); ctx.stroke();
      }
      else if (u.type === 'boss') { 
          ctx.fillStyle = u.color; 
          ctx.beginPath(); 
          ctx.ellipse(-2, 0, Math.max(0.1, u.radius*0.7), Math.max(0.1, u.radius*1.3), 0, 0, Math.PI*2); 
          ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.ink; 
          ctx.beginPath(); ctx.moveTo(0, -u.radius*0.5); ctx.lineTo(u.radius*1.2, -u.radius*0.9); ctx.lineTo(u.radius*0.5, 0); ctx.fill(); 
          ctx.beginPath(); ctx.moveTo(0, u.radius*0.5); ctx.lineTo(u.radius*1.2, u.radius*0.9); ctx.lineTo(u.radius*0.5, 0); ctx.fill(); 
          ctx.fillStyle = u.color; 
          ctx.beginPath(); ctx.arc(0, 0, Math.max(0.1, u.radius*0.6), 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.navy; 
          ctx.beginPath(); ctx.roundRect(0 + sw, u.radius*0.8, Math.max(0.1, u.radius*2.8), 16, 4); ctx.fill(); ctx.stroke(); 
      } 
      else if (u.type === 'hero') { 
          ctx.fillStyle = u.color; 
          ctx.beginPath(); ctx.ellipse(-2, 0, Math.max(0.1, u.radius*0.9), Math.max(0.1, u.radius*1.4), 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.gold; 
          ctx.beginPath(); ctx.moveTo(-u.radius*0.5, -u.radius); ctx.lineTo(u.radius*0.8, -u.radius*1.5); ctx.lineTo(0, -u.radius*0.5); ctx.fill(); ctx.stroke(); 
          ctx.beginPath(); ctx.moveTo(-u.radius*0.5, u.radius); ctx.lineTo(u.radius*0.8, u.radius*1.5); ctx.lineTo(0, u.radius*0.5); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = u.color; 
          ctx.beginPath(); ctx.arc(0, 0, Math.max(0.1, u.radius*0.7), 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.ink; 
          ctx.beginPath(); ctx.roundRect(-10, u.radius*0.8, Math.max(0.1, u.radius*3.5 + sw), 12, 3); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.parchment; 
          ctx.beginPath(); ctx.moveTo(0, u.radius*0.8+2); ctx.lineTo(u.radius*3.2 + sw, u.radius*0.8+2); ctx.lineTo(u.radius*3.5 + sw, u.radius*0.8+6); ctx.lineTo(u.radius*3.2 + sw, u.radius*0.8+10); ctx.lineTo(0, u.radius*0.8+10); ctx.fill(); ctx.stroke(); 
      } 
      else if (u.type === 'shield') { 
          ctx.fillStyle = u.color; 
          ctx.beginPath(); ctx.ellipse(-2, 0, Math.max(0.1, u.radius*0.8), Math.max(0.1, u.radius*1.2), 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.parchment; 
          ctx.beginPath(); ctx.arc(0, 0, Math.max(0.1, u.radius*0.65), 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.khaki; 
          ctx.beginPath(); ctx.roundRect(u.radius - 2, -u.radius*1.8, 8, Math.max(0.1, u.radius*3.6), 4); ctx.fill(); ctx.stroke(); 
          ctx.strokeStyle = '#1b1918'; ctx.lineWidth = 2; 
          ctx.beginPath(); ctx.moveTo(u.radius - 2, -u.radius*1.8); ctx.lineTo(u.radius+6, u.radius*1.8); ctx.stroke(); 
          ctx.beginPath(); ctx.moveTo(u.radius+6, -u.radius*1.8); ctx.lineTo(u.radius - 2, u.radius*1.8); ctx.stroke(); 
      } 
      else {
        ctx.fillStyle = u.color; 
        ctx.beginPath(); ctx.ellipse(-2, 0, Math.max(0.1, u.radius*0.8), Math.max(0.1, u.radius*1.2), 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        
        if (u.weapon === 'bow') { 
            ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 5; 
            ctx.beginPath(); ctx.arc(u.radius, 2, Math.max(0.1, u.radius*1.8), -Math.PI/2.5, Math.PI/2); ctx.stroke(); 
        } 
        else if (u.weapon === 'staff') { 
            ctx.strokeStyle = COLORS.jade; ctx.lineWidth = 4; 
            ctx.beginPath(); ctx.moveTo(u.radius, 0); ctx.lineTo(u.radius*3, 0); ctx.stroke(); 
            ctx.fillStyle = COLORS.parchment; ctx.beginPath(); ctx.arc(u.radius*3, 0, 5, 0, Math.PI*2); ctx.fill(); 
        }
        if (u.type === 'flying') { 
            const flap = Math.sin(performance.now() / 150) * 8; 
            ctx.fillStyle = COLORS.ink; 
            ctx.beginPath(); ctx.ellipse(-5, -u.radius - 5, Math.max(0.1, u.radius), Math.max(0.1, Math.abs(5 + flap)), 0, 0, Math.PI*2); ctx.fill(); 
            ctx.beginPath(); ctx.ellipse(-5, u.radius + 5, Math.max(0.1, u.radius), Math.max(0.1, Math.abs(5 - flap)), 0, 0, Math.PI*2); ctx.fill(); 
        }
        ctx.fillStyle = u.type === 'flying' ? COLORS.vermilion : COLORS.parchment; 
        ctx.beginPath(); ctx.arc(0, 0, Math.max(0.1, u.radius*0.6), 0, Math.PI*2); ctx.fill(); ctx.stroke();
      }
      
      if (u.maxHp > 100) { 
          ctx.rotate(u.team === 'player' ? Math.PI/2 : -Math.PI/2); 
          ctx.fillStyle = '#1b1918'; ctx.fillRect(-15, u.radius + 5, 30, 4); 
          ctx.fillStyle = '#b84235'; ctx.fillRect(-15, u.radius + 5, Math.max(0, 30 * (u.hp / u.maxHp)), 4); 
      }
      ctx.restore();
    };

    const drawGame = (ctx, s, dt, now) => {
      ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT); ctx.save();
      
      s.foxFires.forEach(ff => {
         ctx.save();
         ctx.globalCompositeOperation = 'screen';
         ctx.fillStyle = `rgba(234, 88, 12, ${Math.min(0.25, ff.life / 2)})`;
         ctx.fillRect(0, ff.yTop, V_WIDTH, ff.yBottom - ff.yTop);
         ctx.restore();
      });
      
      if (s.screenShake > 0) { const amt = Math.min(1, s.screenShake) * 25; ctx.translate((Math.random() - 0.5) * amt, (Math.random() - 0.5) * amt); }
      const bossActive = s.units.some(u => u.type === 'boss');
      if (bossActive) { const grad = ctx.createRadialGradient(V_WIDTH/2, V_HEIGHT/2, V_HEIGHT/3, V_WIDTH/2, V_HEIGHT/2, V_HEIGHT); grad.addColorStop(0, 'rgba(184, 66, 53, 0)'); grad.addColorStop(1, `rgba(184, 66, 53, ${0.15 + Math.sin(now/200)*0.05})`); ctx.fillStyle = grad; ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT); }
      if (s.feverActive > 0) { ctx.fillStyle = `rgba(184, 66, 53, 0.25)`; ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT); }
      ctx.setLineDash([15, 15]); ctx.strokeStyle = `rgba(27, 25, 24, 0.15)`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, BATTLE_LINE_Y); ctx.lineTo(V_WIDTH, BATTLE_LINE_Y); ctx.stroke(); ctx.setLineDash([]);
      
      if (s.inkLineY > -50) {
          ctx.save();
          ctx.globalCompositeOperation = 'multiply';
          
          const washGrad = ctx.createLinearGradient(0, 0, 0, s.inkLineY + 50);
          washGrad.addColorStop(0, 'rgba(184, 66, 53, 0.15)'); 
          washGrad.addColorStop(0.8, 'rgba(184, 66, 53, 0.05)');
          washGrad.addColorStop(1, 'rgba(184, 66, 53, 0)');
          ctx.fillStyle = washGrad;
          ctx.fillRect(0, 0, V_WIDTH, s.inkLineY + 150);
          
          for (let i = 0; i < 3; i++) {
              if (i === 0) ctx.fillStyle = 'rgba(184, 66, 53, 0.15)'; 
              else if (i === 1) ctx.fillStyle = 'rgba(27, 25, 24, 0.10)'; 
              else ctx.fillStyle = 'rgba(27, 25, 24, 0.12)'; 
              
              ctx.beginPath(); 
              ctx.moveTo(0, 0); 
              ctx.lineTo(0, s.inkLineY);
              
              for (let x = 0; x <= V_WIDTH; x += 20) {
                  let noise = Math.sin(x * 0.02 + now / (1000 + i * 200)) * (25 + i * 10); 
                  noise += Math.sin(x * 0.08 - now / (600 + i * 150)) * (8 + i * 3); 
                  
                  const tendrilFrequency = 0.015 + (i * 0.005);
                  const tendrilStrength = Math.max(0, Math.sin(x * tendrilFrequency + now/1000 + i*2));
                  const tendrilDrop = Math.pow(tendrilStrength, 3) * (35 + i * 15); 
                  
                  const dangerPulse = (s.inkLineY > 800) ? Math.sin(now / 150) * ((s.inkLineY - 800) * 0.03) : 0;
                  
                  ctx.lineTo(x, s.inkLineY + noise + tendrilDrop - (i * 25) + dangerPulse);
              }
              ctx.lineTo(V_WIDTH, 0); 
              ctx.fill();
          }
          ctx.restore();
      }

      ctx.fillStyle = `rgba(0, 0, 0, 0.06)`; ctx.fillRect(0, WALL_Y, V_WIDTH, V_HEIGHT - WALL_Y); 
      const gateL = V_WIDTH/2 - 120; const gateR = V_WIDTH/2 + 120; ctx.strokeStyle = COLORS.vermilion; ctx.lineWidth = s.feverActive > 0 ? 16 : 8 + (Math.sin(now / 150) * 4);
      ctx.beginPath(); ctx.moveTo(0, WALL_Y); ctx.lineTo(gateL, WALL_Y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(gateR, WALL_Y); ctx.lineTo(V_WIDTH, WALL_Y); ctx.stroke();
      ctx.fillStyle = COLORS.ink; ctx.fillRect(gateL - 15, WALL_Y - 50, 30, 80); ctx.fillRect(gateR - 15, WALL_Y - 50, 30, 80);
      
      const isImperial = metaRef.current.equippedHeirloom === 'IMPERIAL_BANNER';
      const bannerMult = isImperial ? 1.5 : 1.0;

      Object.entries(BARRACKS_DEFS).forEach(([key, def]) => {
         const layout = BARRACKS_LAYOUT[key]; const level = s.barracks[key] || 0; 
         const squash = s.visuals[key] || 0; 
         const isFocused = s.focusedBuilding === key;
         
         ctx.save(); ctx.translate(layout.x, layout.y); ctx.scale(1 + squash * 0.15, 1 - squash * 0.25); 

         if (isFocused) {
             ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
             ctx.beginPath();
             ctx.arc(0, -40, 90 + Math.sin(now / 150) * 5, 0, Math.PI * 2);
             ctx.fill();
             ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
             ctx.lineWidth = 2;
             ctx.stroke();
         }

         if (level === 0) {
             ctx.globalAlpha = 0.3;
             ctx.fillStyle = COLORS.ink; ctx.fillRect(-50, -50, 100, 100);
             ctx.globalAlpha = 1.0;
         } else {
             if (key === 'HATAMOTO') { ctx.fillStyle = '#f2f0ea'; ctx.fillRect(-65, -75, 130, 95); ctx.fillStyle = COLORS.ink; ctx.fillRect(-75, 0, 150, 30); ctx.beginPath(); ctx.moveTo(-80, -75); ctx.lineTo(80, -75); ctx.lineTo(0, -130); ctx.fill(); } 
             else if (key === 'YUMI') { ctx.fillStyle = COLORS.ink; ctx.beginPath(); ctx.moveTo(-80, -30); ctx.quadraticCurveTo(0, -80, 80, -30); ctx.lineTo(95, -20); ctx.lineTo(-95, -20); ctx.fill(); ctx.fillRect(-70, -20, 14, 55); ctx.fillRect(56, -20, 14, 55); ctx.fillStyle = COLORS.navy; ctx.fillRect(-60, -20, 120, 55); } 
             else if (key === 'CAVALRY') { ctx.fillStyle = '#222'; ctx.fillRect(-85, -55, 170, 75); ctx.fillStyle = COLORS.khaki; ctx.beginPath(); ctx.moveTo(-95, -55); ctx.lineTo(95, -55); ctx.lineTo(85, -85); ctx.lineTo(-85, -85); ctx.fill(); ctx.fillStyle = COLORS.vermilion; ctx.beginPath(); ctx.ellipse(0, -20, 20, 12, Math.PI/4, 0, Math.PI*2); ctx.fill(); } 
             else if (key === 'HOROKU') { ctx.fillStyle = COLORS.khaki; ctx.fillRect(-85, -65, 170, 85); ctx.fillStyle = COLORS.ink; ctx.beginPath(); ctx.moveTo(-95, -65); ctx.lineTo(95, -65); ctx.lineTo(75, -110); ctx.lineTo(-75, -110); ctx.fill(); ctx.fillStyle = COLORS.parchment; ctx.fillRect(-40, -30, 80, 50); }
         }
         ctx.restore();
         
         ctx.save(); ctx.translate(layout.x, layout.y + 30); 
         if (level > 0) {
             const maxTime = def.spawnRate * bannerMult;
             const cap = getSquadCap(key, level, metaRef.current.equippedHeirloom, metaRef.current.conqueredRegions);
             const currentCount = s.units.filter(u => u.name === UNIT_TYPES[def.unit].name && u.team === 'player' && u.hp > 0).length;
             const isAtCap = currentCount >= cap;
             const pct = Math.max(0, Math.min(1, 1 - (s.timers[key] / maxTime)));

             ctx.fillStyle = COLORS.ink; ctx.fillRect(-70, 0, 140, 20); 
             ctx.fillStyle = COLORS.parchment; ctx.fillRect(-68, 2, 136, 16); 
             
             if (isAtCap) {
                 ctx.fillStyle = COLORS.vermilion; ctx.fillRect(-68, 2, 136, 16);
                 ctx.fillStyle = COLORS.parchment; ctx.font = 'bold 12px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                 ctx.fillText('MAX SQUAD', 0, 12);
             } else {
                 ctx.fillStyle = s.autoUnlocked[key] ? COLORS.jade : COLORS.navy;
                 ctx.fillRect(-68, 2, 136 * pct, 16);
                 ctx.fillStyle = pct > 0.5 ? COLORS.parchment : COLORS.ink;
                 ctx.font = 'bold 10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                 ctx.fillText(s.autoUnlocked[key] ? 'TRAINING...' : 'TAP TO TRAIN', 0, 12);
             }
         } else {
             ctx.fillStyle = 'rgba(27, 25, 24, 0.4)'; ctx.fillRect(-50, 0, 100, 20);
             ctx.fillStyle = COLORS.parchment; ctx.font = 'bold 10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
             ctx.fillText('LOCKED', 0, 12);
         }
         ctx.restore();
      });
      
      s.lightnings.forEach(l => { ctx.strokeStyle = '#facc15'; ctx.lineWidth = l.life * 20; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(l.x + (Math.random()*40-20), -100); ctx.lineTo(l.x, l.y); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = l.life * 10; ctx.stroke(); });
      s.dragonWaves.forEach(w => { ctx.fillStyle = `rgba(56, 189, 248, ${Math.min(1, w.life)})`; ctx.beginPath(); ctx.ellipse(V_WIDTH/2, w.y, V_WIDTH/2, 40, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, w.life*1.5)})`; ctx.beginPath(); ctx.ellipse(V_WIDTH/2, w.y, V_WIDTH/2.2, 10, 0, 0, Math.PI*2); ctx.fill(); });
      s.explosions.forEach(e => { ctx.strokeStyle = e.color; ctx.lineWidth = e.life * 15; ctx.beginPath(); ctx.arc(e.x, e.y, Math.max(0.1, e.r * (1 - e.life)), 0, Math.PI*2); ctx.stroke(); });
      
      s.units.sort((a,b) => (a.type === 'flying' ? 1 : 0) - (b.type === 'flying' ? 1 : 0)).forEach(u => drawUnitTopDown(ctx, u));
      
      s.projectiles.forEach(p => { 
          if (p.type === 'lob') { 
              const sz = Math.max(0.1, 8 + (p.z * 0.1)); 
              ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(p.x, p.y + p.z*0.5, sz, 0, Math.PI*2); ctx.fill(); 
              ctx.fillStyle = COLORS.ink; ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI*2); ctx.fill(); 
              ctx.fillStyle = COLORS.vermilion; ctx.beginPath(); ctx.arc(p.x, p.y, sz*0.4, 0, Math.PI*2); ctx.fill(); 
          } else { 
              if (p.isFlaming) {
                  ctx.shadowColor = '#ea580c'; ctx.shadowBlur = 8;
                  ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 5;
              } else {
                  ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3; 
              }
              ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx*0.03, p.y - p.vy*0.03); ctx.stroke(); 
              ctx.shadowBlur = 0;
          } 
      });
      
      s.slashTrails.forEach(t => { ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(184, 66, 53, ${t.life * 0.8})`; ctx.lineWidth = 30 * t.life; ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255, ${t.life})`; ctx.lineWidth = 10 * t.life; ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke(); });
      
      s.particles.forEach(p => { 
          ctx.fillStyle = p.color; 
          ctx.globalAlpha = p.life > 1 ? 1.0 : Math.max(0, p.life); 
          ctx.beginPath(); 
          if (p.isDrip) {
              ctx.ellipse(p.x, p.y, Math.max(0.1, p.r), Math.max(0.1, p.r * 5), 0, 0, Math.PI*2);
          } else {
              ctx.arc(p.x, p.y, Math.max(0.1, p.r), 0, Math.PI*2); 
          }
          ctx.fill(); 
          ctx.globalAlpha = 1.0; 
      });
      
      ctx.font = 'bold 28px serif'; ctx.textAlign = 'center'; 
      s.floatingTexts.forEach(ft => { ctx.fillStyle = ft.color; ctx.globalAlpha = Math.min(1, ft.life * 2); ctx.fillText(ft.text, ft.x, ft.y); ctx.globalAlpha = 1.0; });
      ctx.restore(); 
    };

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
            drawGame(fgCtx, s, dt, now);
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
  let waveStatusText = "THE CAMPAIGN"; let waveStatusColor = "text-[#b84235]";
  
  if (s.waveState === 'PRE_WAVE') { 
      if ((s.wave - 1) > 0 && (s.wave - 1) % 3 === 0) {
          waveStatusText = `REFORMATION (${Math.ceil(s.waveTimer)}s)`; waveStatusColor = "text-[#4a5d23]"; 
      } else {
          waveStatusText = `PREPARING (${Math.ceil(s.waveTimer)}s)`; waveStatusColor = "text-[#2b3d60]"; 
      }
  }
  else if (s.waveState === 'SPAWNING') { if (s.wave === 1) waveStatusText = "SCOUTS SPOTTED"; else if (s.wave === 2) waveStatusText = "PEASANT SKIRMISH"; else if (s.wave === 3) waveStatusText = "THE VANGUARD"; else if (s.wave % 5 === 0) waveStatusText = "BOSS APPROACHES"; else waveStatusText = "HORDE ARRIVING"; waveStatusColor = "text-[#b84235]"; }
  else if (s.waveState === 'CLEANUP') { waveStatusText = "MOPPING UP..."; waveStatusColor = "text-[#8b8574]"; }

  const activeTroops = s.units.filter(u => u.team === 'player' && u.type !== 'friction' && u.type !== 'hero').length;
  const maxTroops = Object.keys(BARRACKS_DEFS).reduce((sum, key) => sum + getSquadCap(key, s.barracks[key] || 0, meta.equippedHeirloom, meta.conqueredRegions), 0);

  const isImperial = meta.equippedHeirloom === 'IMPERIAL_BANNER';
  const bannerMult = isImperial ? 1.5 : 1.0;

  const nodePositions = {
    RIVERLANDS: { cx: '30%', cy: '72%' },
    OUTSKIRTS: { cx: '70%', cy: '68%' },
    IRON_MINES: { cx: '20%', cy: '42%' },
    TENGU_PEAKS: { cx: '80%', cy: '38%' },
    THE_ABYSS: { cx: '50%', cy: '15%' }
  };

  const mapConnections = [
    { start: { cx: '50%', cy: '88%' }, end: nodePositions.RIVERLANDS, target: 'RIVERLANDS' },
    { start: { cx: '50%', cy: '88%' }, end: nodePositions.OUTSKIRTS, target: 'OUTSKIRTS' },
    { start: nodePositions.RIVERLANDS, end: nodePositions.IRON_MINES, target: 'IRON_MINES' },
    { start: nodePositions.OUTSKIRTS, end: nodePositions.TENGU_PEAKS, target: 'TENGU_PEAKS' },
    { start: nodePositions.RIVERLANDS, end: nodePositions.TENGU_PEAKS, target: 'TENGU_PEAKS' },
    { start: nodePositions.IRON_MINES, end: nodePositions.THE_ABYSS, target: 'THE_ABYSS' },
    { start: nodePositions.TENGU_PEAKS, end: nodePositions.THE_ABYSS, target: 'THE_ABYSS' },
  ];

  return (
    <div className="flex h-screen w-full bg-[#1b1918] text-[#1b1918] font-serif overflow-hidden select-none relative">
      
      {/* MAP SCREEN HUB (MACRO UI) */}
      {s.gameState === 'MAP_SCREEN' && (
         <div className="absolute inset-0 bg-[#dfd4ba] z-[100] flex pointer-events-auto overflow-hidden">
            
            {/* WAR CAMP (LEFT PANEL) */}
            <div className="w-[340px] h-full bg-[#dfd4ba] border-r-4 border-[#1b1918] flex flex-col p-4 relative z-20 shadow-[10px_0_20px_rgba(0,0,0,0.3)]">
                <h2 className="text-3xl font-black text-[#1b1918] uppercase tracking-widest mb-1">War Camp</h2>
                <p className="text-[10px] font-bold tracking-widest text-[#8b8574] uppercase mb-4">Strategic Preparation</p>

                <div className="bg-[#1b1918] text-[#d4af37] px-4 py-3 mb-6 flex flex-col border-2 border-[#d4af37] shadow-md">
                   <span className="font-bold text-[10px] tracking-[0.2em] uppercase text-[#8b8574]">Ancestral Honor</span>
                   <span className="text-3xl font-black leading-none mt-1">{meta.honor} <span className="text-sm text-[#dfd4ba]">H</span></span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">
                    <div>
                       <div className="flex justify-between items-baseline border-b-2 border-[#1b1918] pb-1 mb-2">
                          <h3 className="text-[#1b1918] font-black text-[10px] uppercase tracking-[0.2em]">Ancestral Vault</h3>
                          <span className="text-[8px] font-bold text-[#b84235] uppercase">Equip Max: 1</span>
                       </div>
                       <div className="flex flex-col gap-2">
                          {Object.entries(HEIRLOOMS).map(([key, h]) => {
                             const isUnlocked = meta.unlockedHeirlooms.includes(key);
                             const isEquipped = meta.equippedHeirloom === key;
                             
                             return (
                                <div key={key} className={`p-2 border-2 transition-colors ${isEquipped ? 'bg-[#b84235] border-[#1b1918] text-[#dfd4ba]' : 'bg-[#e8e0cc] border-[#8b8574] text-[#1b1918]'}`}>
                                   <div className="flex justify-between items-center mb-1">
                                      <span className="text-[9px] font-black uppercase tracking-widest">{h.name}</span>
                                      {isUnlocked ? (
                                         <button onClick={() => setMeta(prev => ({ ...prev, equippedHeirloom: isEquipped ? null : key }))} className={`px-2 py-0.5 text-[8px] font-bold uppercase border-2 transition-colors ${isEquipped ? 'bg-[#1b1918] border-[#1b1918] text-[#dfd4ba]' : 'bg-[#1b1918] border-[#1b1918] text-[#dfd4ba] hover:bg-[#dfd4ba] hover:text-[#1b1918]'}`}>
                                            {isEquipped ? 'Equipped' : 'Equip'}
                                         </button>
                                      ) : (
                                         <button onClick={() => { if (meta.honor >= h.cost) setMeta(prev => ({ ...prev, honor: prev.honor - h.cost, unlockedHeirlooms: [...prev.unlockedHeirlooms, key] })) }} disabled={meta.honor < h.cost} className="px-2 py-0.5 text-[8px] font-bold uppercase border-2 border-[#1b1918] bg-[#d4af37] text-[#1b1918] disabled:opacity-50 disabled:grayscale hover:bg-[#b5952f] transition-colors">
                                            Unlock ({h.cost} H)
                                         </button>
                                      )}
                                   </div>
                                   <p className="text-[8px] leading-tight font-bold opacity-90">{h.desc}</p>
                                </div>
                             )
                          })}
                       </div>
                    </div>
                    
                    <div className="mt-2">
                       <div className="flex justify-between items-baseline border-b-2 border-[#1b1918] pb-1 mb-2">
                          <h3 className="text-[#1b1918] font-black text-[10px] uppercase tracking-[0.2em]">War Pavilion</h3>
                          <span className="text-[8px] font-bold text-[#b84235] uppercase">Permanent Tech</span>
                       </div>
                       <div className="flex flex-col gap-2">
                          {Object.entries(PERMANENT_TECHS).map(([key, t]) => {
                             const isUnlocked = meta.unlockedTechs.includes(key);

                             return (
                                <div key={key} className={`p-2 border-2 transition-colors ${isUnlocked ? 'bg-[#2b3d60] border-[#1b1918] text-[#dfd4ba]' : 'bg-[#e8e0cc] border-[#8b8574] text-[#1b1918]'}`}>
                                   <div className="flex justify-between items-center mb-1">
                                      <span className="text-[9px] font-black uppercase tracking-widest">{t.name}</span>
                                      {isUnlocked ? (
                                         <span className="px-2 py-0.5 text-[8px] font-bold uppercase text-[#d4af37]">Unlocked</span>
                                      ) : (
                                         <button onClick={() => { if (meta.honor >= t.cost) setMeta(prev => ({ ...prev, honor: prev.honor - t.cost, unlockedTechs: [...prev.unlockedTechs, key] })) }} disabled={meta.honor < t.cost} className="px-2 py-0.5 text-[8px] font-bold uppercase border-2 border-[#1b1918] bg-[#d4af37] text-[#1b1918] disabled:opacity-50 disabled:grayscale hover:bg-[#b5952f] transition-colors">
                                            Unlock ({t.cost} H)
                                         </button>
                                      )}
                                   </div>
                                   <p className="text-[8px] leading-tight font-bold opacity-90">{t.desc}</p>
                                </div>
                             )
                          })}
                       </div>
                    </div>
                </div>

                <button onClick={() => { setMeta(prev => ({ ...prev, honor: prev.honor + s.earnedHonor, conqueredRegions: [] })); initRun(); }} className="mt-4 w-full py-3 bg-[#1b1918] text-[#dfd4ba] text-[10px] font-black tracking-[0.2em] uppercase border-4 border-[#b84235] hover:bg-[#b84235] hover:text-[#1b1918] transition-colors flex justify-center items-center gap-2 group">
                   <span>End Dynasty (Reset)</span>
                   {s.earnedHonor > 0 && <span className="bg-[#b84235] text-[#1b1918] px-1.5 py-0.5 rounded-sm group-hover:bg-[#1b1918] group-hover:text-[#dfd4ba]">+{s.earnedHonor} Honor</span>}
                </button>
            </div>

            {/* MAP AREA (RIGHT SIDE) */}
            <div className="flex-1 relative bg-[#dfd4ba] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#1b1918_100%)] opacity-30" />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%231b1918\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '20px 20px' }} />

                <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none">
                    <h1 className="text-6xl font-black text-[#1b1918] tracking-[0.5em] uppercase drop-shadow-md">War Map</h1>
                    <p className="text-xl font-bold text-[#b84235] tracking-widest uppercase mt-4 bg-[#dfd4ba] inline-block px-4 py-1 border-2 border-[#b84235]">Select Your Conquest</p>
                </div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                   {mapConnections.map((conn, idx) => {
                       const isConquered = meta.conqueredRegions.includes(conn.target);
                       return (
                          <line 
                             key={idx}
                             x1={conn.start.cx} y1={conn.start.cy} 
                             x2={conn.end.cx} y2={conn.end.cy} 
                             className={`transition-colors duration-700 ${isConquered ? 'stroke-[#d4af37]' : 'stroke-[#1b1918] opacity-30'}`}
                             strokeWidth={isConquered ? "6" : "4"} 
                             strokeDasharray={isConquered ? "none" : "10 10"} 
                          />
                       );
                   })}
                </svg>

                {/* IMPERIAL CAPITAL */}
                <div className="absolute z-20 flex flex-col items-center" style={{ left: '50%', top: '88%', transform: 'translate(-50%, -50%)' }}>
                    <div className="relative w-24 h-24 rounded-full border-4 border-[#d4af37] bg-[#2b3d60] flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)]">
                        <div className="absolute inset-2 border-2 border-dashed border-[#dfd4ba]/30 rounded-full animate-[spin_20s_linear_infinite]" />
                        <span className="text-4xl relative z-10">⛩️</span>
                        <div className="absolute top-full mt-3 px-4 py-1.5 font-black text-xs uppercase tracking-widest whitespace-nowrap border-2 shadow-lg bg-[#1b1918] text-[#d4af37] border-[#d4af37]">
                            Imperial Capital
                        </div>
                        <div className="absolute -bottom-10 text-[10px] font-bold text-[#1b1918] tracking-widest uppercase">Your Stronghold</div>
                    </div>
                </div>

                {/* Interactive Map Nodes */}
                {Object.values(CAMPAIGN_MAP).map(region => {
                    const isConquered = meta.conqueredRegions.includes(region.id);
                    const { cx, cy } = nodePositions[region.id];

                    return (
                        <div key={region.id} className="absolute group z-20" style={{ left: cx, top: cy, transform: 'translate(-50%, -50%)' }}>
                            
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 p-3 bg-[#1b1918] text-[#dfd4ba] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2 border-[#8b8574] shadow-2xl flex flex-col items-center">
                                <span className="font-black text-sm uppercase tracking-widest text-[#d4af37] mb-1 border-b-2 border-[#8b8574] w-full text-center pb-1">{region.name}</span>
                                <div className="flex justify-between w-full mt-2 mb-2 text-xs font-bold">
                                   <span>Threat:</span>
                                   <span className="text-[#b84235]">{'💀'.repeat(region.threatLevel)}</span>
                                </div>
                                <div className="flex justify-between w-full mb-3 text-xs font-bold">
                                   <span>Waves:</span>
                                   <span>{region.waves}</span>
                                </div>
                                <div className="bg-[#b84235] text-[#1b1918] text-[10px] font-black w-full text-center py-1.5 uppercase tracking-widest">
                                    {region.reward}
                                </div>
                            </div>

                            <button 
                               onClick={() => !isConquered && startCombat(region.id)}
                               className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center transform transition-all duration-300 ${isConquered ? 'bg-[#2b3d60] border-[#d4af37] cursor-default shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'bg-[#1b1918] border-[#b84235] cursor-pointer hover:scale-110 hover:bg-[#b84235] hover:shadow-[0_0_30px_rgba(184,66,53,0.8)]'}`}
                            >
                               {!isConquered && (
                                  <div className="absolute inset-[-12px] border-2 border-[#b84235] rounded-full animate-ping opacity-50 pointer-events-none" />
                               )}
                               
                               <div className={`absolute inset-2 border-2 border-dashed rounded-full ${isConquered ? 'border-[#d4af37]/50' : 'border-[#dfd4ba]/30 animate-[spin_10s_linear_infinite]'}`} />
                               
                               <span className="text-3xl relative z-10">{isConquered ? '🏯' : (region.id === 'THE_ABYSS' ? '👹' : '⚔️')}</span>

                               <div className={`absolute top-full mt-3 px-3 py-1 font-black text-[10px] uppercase tracking-widest whitespace-nowrap border-2 shadow-lg ${isConquered ? 'bg-[#d4af37] text-[#1b1918] border-[#1b1918]' : 'bg-[#dfd4ba] text-[#1b1918] border-[#b84235]'}`}>
                                   {region.name}
                               </div>
                            </button>
                        </div>
                    );
                })}
            </div>
         </div>
      )}

      {s.gameState === 'CAMPAIGN_OVER' && (
         <div className="absolute inset-0 bg-[#dfd4ba]/95 flex flex-col items-center justify-center z-50 pointer-events-auto p-8">
            <h2 className="text-6xl font-black text-[#d4af37] tracking-[0.4em] uppercase mb-2 text-center">Demon God Slain</h2>
            <p className="text-xl font-bold mb-8 text-[#1b1918]">The realm is unified.</p>
            <button onClick={() => { setMeta(prev => ({ ...prev, honor: prev.honor + s.earnedHonor, conqueredRegions: [] })); initRun(); }} className="px-12 py-5 bg-[#1b1918] text-[#dfd4ba] text-xl font-black uppercase border-4 border-[#d4af37]">Begin Anew</button>
         </div>
      )}

      {/* LEFT: COMBAT CANVAS */}
      <div className={`flex-[7] relative bg-[#1b1918] flex justify-center items-center overflow-hidden p-2 ${s.gameState === 'MAP_SCREEN' ? 'hidden' : ''}`}>
        <div 
           className={`relative touch-none z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#dfd4ba] ${armedSpell ? 'cursor-crosshair' : 'cursor-default'}`}
           style={{ height: '100%', maxWidth: '100%', aspectRatio: '1200/1600' }}
        >
          <canvas ref={bgCanvasRef} width={V_WIDTH} height={V_HEIGHT} className="absolute top-0 left-0 w-full h-full block" />
          <canvas ref={fgCanvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} width={V_WIDTH} height={V_HEIGHT} className="absolute top-0 left-0 w-full h-full block" />
        </div>

        <div className="absolute top-6 left-8 flex justify-between items-start pointer-events-none z-30">
          <div className="flex flex-col bg-[#dfd4ba]/90 px-4 py-2 border-2 border-[#1b1918]">
             <span className={`${waveStatusColor} text-xs uppercase tracking-[0.3em] font-bold`}>{waveStatusText}</span>
             <span className="text-3xl font-black text-[#1b1918] tracking-widest">WAVE {s.wave} <span className="text-xl">/ {CAMPAIGN_MAP[s.currentRegion]?.waves || '?'}</span></span>
          </div>
        </div>
        
        {s.gameState === 'REGION_VICTORY' && (
          <div className="absolute inset-0 bg-[#dfd4ba]/95 flex flex-col items-center justify-center z-50 pointer-events-auto p-8 overflow-y-auto custom-scrollbar">
            <h2 className="text-6xl font-black text-[#d4af37] tracking-[0.4em] uppercase mb-2 text-center">Region Secured</h2>
            <div className="bg-[#1b1918] text-[#dfd4ba] px-12 py-6 mb-8 text-center border-4 border-[#d4af37]">
               <span className="block text-sm uppercase tracking-[0.4em] mb-2 text-[#8b8574]">Reward Claimed</span>
               <span className="text-2xl font-black">{CAMPAIGN_MAP[s.currentRegion]?.reward}</span>
            </div>
            <button onClick={handleRegionVictory} className="px-12 py-5 bg-[#d4af37] text-[#1b1918] text-xl tracking-[0.3em] uppercase active:scale-95 font-black border-4 border-[#1b1918]">Return to Map</button>
          </div>
        )}

        {s.gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-[#dfd4ba]/95 flex flex-col items-center justify-center z-50 pointer-events-auto p-8 overflow-y-auto custom-scrollbar">
            <h2 className="text-6xl font-black text-[#b84235] tracking-[0.4em] uppercase mb-2 text-center">Defenses Broken</h2>
            <div className="bg-[#1b1918] text-[#dfd4ba] px-12 py-6 mb-8 text-center border-4 border-[#b84235]">
               <span className="block text-sm uppercase tracking-[0.4em] mb-2 text-[#8b8574]">Honor Extracted</span>
               <span className="text-5xl font-black">+{s.earnedHonor}</span>
            </div>
            <button onClick={() => { setMeta(prev => ({ ...prev, honor: prev.honor + s.earnedHonor, conqueredRegions: [] })); initRun(); }} className="px-12 py-5 bg-[#b84235] text-[#dfd4ba] text-xl tracking-[0.3em] uppercase active:scale-95 font-black border-4 border-[#1b1918]">Enter the Cycle</button>
          </div>
        )}
      </div>

      {/* RIGHT: COMMAND DASHBOARD */}
      <div className={`flex-[3] min-w-[340px] max-w-[400px] h-full bg-[#dfd4ba] flex flex-col shrink-0 overflow-y-auto custom-scrollbar relative z-40 border-l-4 border-[#1b1918] ${s.gameState === 'MAP_SCREEN' ? 'hidden' : ''}`}>
        
        {/* ZONE 1: STICKY ECONOMY HEADER */}
        <div className="px-4 py-3 bg-[#1b1918] text-[#dfd4ba] sticky top-0 z-50 shadow-md border-b-4 border-[#b84235]">
           <div className="flex justify-between items-end mb-2">
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold tracking-widest text-[#8b8574] uppercase">Treasury</span>
                 <span className="text-3xl font-black leading-none text-[#d4af37]">{Math.floor(s.koku).toLocaleString()} <span className="text-sm">K</span></span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-bold tracking-widest text-[#8b8574] uppercase">Army Size</span>
                 <span className="text-xl font-black leading-none">{activeTroops} <span className="text-xs text-[#8b8574]">/ {maxTroops}</span></span>
              </div>
           </div>
           <div className="w-full h-1.5 bg-[#dfd4ba]/20 overflow-hidden">
              <div className="h-full bg-[#d4af37] transition-all duration-300" style={{ width: `${maxTroops > 0 ? (activeTroops / maxTroops) * 100 : 0}%` }} />
           </div>
        </div>

        {/* ZONE 2: LAYERED BARRACKS UI */}
        <div className="p-4 flex flex-col gap-3 bg-[#dfd4ba] border-b-4 border-[#1b1918]">
           <h3 className="text-[#1b1918] font-black text-[10px] uppercase tracking-[0.2em] border-b-2 border-[#1b1918] pb-1">Military Forces</h3>
           
           {Object.entries(BARRACKS_DEFS).map(([key, def]) => {
              const level = s.barracks[key] || 0;
              const isAuto = s.autoUnlocked[key];
              const cap = getSquadCap(key, level, meta.equippedHeirloom, meta.conqueredRegions);
              const currentCount = s.units.filter(u => u.name === UNIT_TYPES[def.unit].name && u.team === 'player' && u.hp > 0).length;
              
              const maxTime = def.spawnRate * bannerMult;
              const pct = level > 0 ? Math.max(0, Math.min(1, 1 - (s.timers[key] / maxTime))) : 0;
              
              const baseCost = Math.floor(def.baseCost * bannerMult);
              const autoCost = Math.floor(def.autoCost * bannerMult);
              const costCap = Math.floor(getCost(def.baseCost, def.costMult, level) * bannerMult);
              const costLvl = Math.floor(getCost(def.baseCost * 1.5, 1.7, s.troopLevel[key] - 1) * bannerMult);
              const isFocused = s.focusedBuilding === key;

              return (
                 <div key={key} 
                     onClick={() => { s.focusedBuilding = isFocused ? null : key; setUiTick(t=>t+1); }}
                     className={`bg-[#1b1918] border-2 flex flex-col text-[#dfd4ba] transition-all cursor-pointer overflow-hidden ${isFocused ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.25)]' : 'border-[#1b1918] hover:border-[#8b8574]'}`}
                 >
                    {/* Minimal Default View */}
                    <div className="flex items-center h-14 px-2 relative">
                       {isFocused && <div className="absolute inset-0 bg-[#d4af37]/10 animate-pulse pointer-events-none" />}
                       
                       <div className="w-16 flex flex-col items-center justify-center shrink-0 relative z-10 border-r-2 border-[#1b1918] h-full bg-[#2b3d60] mr-2">
                          <span className="text-[10px] font-black tracking-widest leading-none text-center px-1">{def.name}</span>
                          {level > 0 && <div className="absolute -top-1 -left-1 bg-[#b84235] text-white text-[8px] font-bold px-1 py-0.5 border border-[#1b1918]">Lv.{s.troopLevel[key]}</div>}
                       </div>

                       <div className="flex-1 flex flex-col justify-center relative z-10 pr-1">
                          {level === 0 ? (
                              <div className="text-[10px] font-bold text-[#8b8574] text-center tracking-widest">TAP TO BUILD</div>
                          ) : (
                              <>
                                 <div className="flex justify-between text-[8px] font-bold tracking-widest text-[#8b8574] mb-1">
                                    <span>{isAuto ? 'AUTO' : 'MANUAL'}</span>
                                    <span className={currentCount >= cap ? 'text-[#b84235]' : (isFocused ? 'text-[#d4af37]' : '')}>{currentCount}/{cap}</span>
                                 </div>
                                 <div className="w-full h-2 bg-[#dfd4ba]/20 relative border border-[#1b1918]">
                                    <div className={`h-full transition-all ${currentCount >= cap ? 'bg-[#b84235]' : (isFocused ? 'bg-[#d4af37]' : 'bg-[#4a5d23]')}`} style={{ width: `${currentCount >= cap ? 100 : pct * 100}%` }} />
                                 </div>
                              </>
                          )}
                       </div>
                    </div>

                    {/* Contextual Expansion */}
                    {isFocused && (
                       <div className="flex flex-col border-t-2 border-[#1b1918] bg-[#dfd4ba] text-[#1b1918] p-1.5 gap-1.5">
                          {level === 0 ? (
                              <button onClick={(e) => { e.stopPropagation(); if (s.koku >= baseCost) { s.koku -= baseCost; s.barracks[key] = 1; s.timers[key] = maxTime; setUiTick(t=>t+1); } }} className={`w-full py-2 text-[10px] font-black transition-colors border-2 border-[#1b1918] ${s.koku >= baseCost && s.gameState === 'COMBAT' ? 'bg-[#1b1918] text-[#d4af37] hover:bg-[#2b3d60]' : 'bg-[#cfc4af] text-[#8b8574] cursor-not-allowed'}`}>BUILD ({baseCost} K)</button>
                          ) : (
                              <>
                                 {!isAuto && (
                                     <button onClick={(e) => { e.stopPropagation(); if (s.koku >= autoCost) { s.koku -= autoCost; s.autoUnlocked[key] = true; setUiTick(t=>t+1); } }} className={`w-full py-1.5 text-[10px] font-black transition-colors border-2 border-[#1b1918] ${s.koku >= autoCost && s.gameState === 'COMBAT' ? 'bg-[#1b1918] text-[#d4af37] hover:bg-[#2b3d60]' : 'bg-[#cfc4af] text-[#8b8574] cursor-not-allowed'}`}>HIRE DRILL ({autoCost} K)</button>
                                 )}
                                 <div className="flex gap-1.5">
                                     <button onClick={(e) => { e.stopPropagation(); if (s.koku >= costLvl) { s.koku -= costLvl; s.troopLevel[key]++; setUiTick(t=>t+1); } }} className={`flex-1 py-1.5 flex items-center justify-center transition-colors border-2 border-[#1b1918] ${s.koku >= costLvl && s.gameState === 'COMBAT' ? 'bg-[#1b1918] text-[#dfd4ba] hover:bg-[#d4af37] hover:text-[#1b1918]' : 'bg-[#cfc4af] text-[#8b8574] cursor-not-allowed'}`}>
                                         <span className="text-[8px] font-black tracking-tighter leading-tight text-center">UPG DMG<br/>{costLvl} K</span>
                                     </button>
                                     <button onClick={(e) => { e.stopPropagation(); if (s.koku >= costCap) { s.koku -= costCap; s.barracks[key]++; setUiTick(t=>t+1); } }} className={`flex-1 py-1.5 flex items-center justify-center transition-colors border-2 border-[#1b1918] ${s.koku >= costCap && s.gameState === 'COMBAT' ? 'bg-[#1b1918] text-[#dfd4ba] hover:bg-[#d4af37] hover:text-[#1b1918]' : 'bg-[#cfc4af] text-[#8b8574] cursor-not-allowed'}`}>
                                         <span className="text-[8px] font-black tracking-tighter leading-tight text-center">+1 CAP<br/>{costCap} K</span>
                                     </button>
                                 </div>
                                 
                                 {/* STEP 3: Guard Quota UI Controls */}
                                 <div className="flex justify-between items-center mt-1 border-t-2 border-[#1b1918] pt-1.5 px-1">
                                    <span className="text-[9px] font-black tracking-widest text-[#8b8574]">GUARD QUOTA</span>
                                    <div className="flex items-center gap-2 bg-[#1b1918] px-2 py-0.5 border border-[#4a5d23]">
                                        <button onClick={(e) => { e.stopPropagation(); changeQuota(key, -1); }} className="hover:text-[#d4af37] text-lg leading-none cursor-pointer text-[#dfd4ba] px-1 font-bold">-</button>
                                        <span className="text-[#dfd4ba] min-w-[2ch] text-center font-mono text-[10px] font-bold">{s.guardQuotas[key] || 0}</span>
                                        <button onClick={(e) => { e.stopPropagation(); changeQuota(key, 1); }} className="hover:text-[#d4af37] text-lg leading-none cursor-pointer text-[#dfd4ba] px-1 font-bold">+</button>
                                    </div>
                                 </div>
                              </>
                          )}
                       </div>
                    )}
                 </div>
              );
           })}
        </div>

        {/* ZONE 3: TACTICAL COMMAND (ACTIVE BUFFS) */}
        <div className="p-4 flex flex-col gap-4 bg-[#dfd4ba]">
           <div>
              <h3 className="text-[#1b1918] font-black text-[10px] uppercase tracking-[0.2em] border-b-2 border-[#1b1918] pb-1 mb-2">Tactical Command</h3>
              <div className="flex flex-col gap-1.5">
                 <button onClick={triggerWarDrums} disabled={s.koku < 200 || s.gameState !== 'COMBAT'} className="relative group w-full flex justify-between items-baseline px-3 py-1.5 transition-all border-2 bg-[#e8e0cc] border-[#1b1918] hover:bg-[#1b1918] hover:text-[#dfd4ba] disabled:opacity-60 disabled:bg-[#cfc4af]">
                    <span className="text-[9px] font-bold tracking-widest uppercase">War Drums {s.warDrumsActive > 0 && `(${s.warDrumsActive.toFixed(1)}s)`}</span>
                    <span className="text-[9px] font-black">200 K</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-[#1b1918] text-[#dfd4ba] text-[8px] font-bold text-center border-2 border-[#b84235] opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                        +50% Atk & Move Speed for 5s.
                    </div>
                 </button>

                 <button onClick={triggerHarvest} disabled={s.koku < 300 || s.gameState !== 'COMBAT'} className="relative group w-full flex justify-between items-baseline px-3 py-1.5 transition-all border-2 bg-[#e8e0cc] border-[#1b1918] hover:bg-[#1b1918] hover:text-[#dfd4ba] disabled:opacity-60 disabled:bg-[#cfc4af]">
                    <span className="text-[9px] font-bold tracking-widest uppercase">Bountiful Harvest {s.harvestActive > 0 && `(${s.harvestActive.toFixed(1)}s)`}</span>
                    <span className="text-[9px] font-black">300 K</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-[#1b1918] text-[#dfd4ba] text-[8px] font-bold text-center border-2 border-[#d4af37] opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                        Double Koku drops for 10s.
                    </div>
                 </button>

                 <button onClick={triggerResolve} disabled={s.koku < 150 || s.gameState !== 'COMBAT'} className="relative group w-full flex justify-between items-baseline px-3 py-1.5 transition-all border-2 bg-[#e8e0cc] border-[#1b1918] hover:bg-[#1b1918] hover:text-[#dfd4ba] disabled:opacity-60 disabled:bg-[#cfc4af]">
                    <span className="text-[9px] font-bold tracking-widest uppercase">Shogun's Resolve</span>
                    <span className="text-[9px] font-black">150 K</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-[#1b1918] text-[#dfd4ba] text-[8px] font-bold text-center border-2 border-[#4a5d23] opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                        Instantly heals Hatamotos & Barricades +50% HP.
                    </div>
                 </button>
              </div>
           </div>
           
           {/* ZONE 4: THE ONMYOJI SHRINE (SPELLS) */}
           <div>
              <div className="flex justify-between items-end border-b-2 border-[#1b1918] pb-1 mb-2">
                 <h3 className="text-[#1b1918] font-black text-[10px] uppercase tracking-[0.2em]">The Onmyoji Shrine</h3>
                 {!s.heroUnlocked && (
                    <button onClick={() => { if(s.koku >= 500) { s.koku -= 500; s.heroUnlocked = true; setUiTick(t=>t+1); } }} disabled={s.koku < 500 || s.gameState !== 'COMBAT'} className="text-[8px] font-black uppercase border border-[#d4af37] bg-[#d4af37] text-[#1b1918] hover:bg-[#1b1918] hover:text-[#d4af37] px-2 disabled:opacity-50">Unlock Hero (500K)</button> 
                 )}
              </div>
              <div className="flex flex-col gap-1.5">
                 <button onClick={triggerThunder} disabled={s.koku < 150 || s.gameState !== 'COMBAT' || s.thunderCooldown > 0} className="relative group w-full flex justify-between items-baseline px-3 py-1.5 transition-all border-2 bg-[#1b1918] text-[#38bdf8] border-[#38bdf8] hover:bg-[#38bdf8] hover:text-[#1b1918] disabled:opacity-50 disabled:border-[#1b1918] disabled:text-[#8b8574]">
                    <span className="text-[9px] font-bold tracking-widest uppercase">Thunder Strike {s.thunderCooldown > 0 && `(${Math.ceil(s.thunderCooldown)}s)`}</span>
                    <span className="text-[9px] font-black">150 K</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-[#1b1918] text-[#dfd4ba] text-[8px] font-bold text-center border-2 border-[#38bdf8] opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                        Vaporize the 3 highest-HP enemies.
                    </div>
                 </button>

                 <button onClick={triggerFoxFire} disabled={s.koku < 250 || s.gameState !== 'COMBAT' || s.foxFireCooldown > 0} className="relative group w-full flex justify-between items-baseline px-3 py-1.5 transition-all border-2 bg-[#1b1918] text-[#ea580c] border-[#ea580c] hover:bg-[#ea580c] hover:text-[#1b1918] disabled:opacity-50 disabled:border-[#1b1918] disabled:text-[#8b8574]">
                    <span className="text-[9px] font-bold tracking-widest uppercase">Fox Fire {s.foxFireCooldown > 0 && `(${Math.ceil(s.foxFireCooldown)}s)`}</span>
                    <span className="text-[9px] font-black">250 K</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-[#1b1918] text-[#dfd4ba] text-[8px] font-bold text-center border-2 border-[#ea580c] opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                        Ignite the gate approach (Y:1000-1200) for 8s.
                    </div>
                 </button>

                 <button onClick={triggerDragonWave} disabled={s.koku < 600 || s.gameState !== 'COMBAT' || s.dragonCooldown > 0} className="relative group w-full flex justify-between items-baseline px-3 py-1.5 transition-all border-2 bg-[#1b1918] text-[#d4af37] border-[#d4af37] hover:bg-[#d4af37] hover:text-[#1b1918] disabled:opacity-50 disabled:border-[#1b1918] disabled:text-[#8b8574]">
                    <span className="text-[9px] font-bold tracking-widest uppercase">Dragon Wave {s.dragonCooldown > 0 && `(${Math.ceil(s.dragonCooldown)}s)`}</span>
                    <span className="text-[9px] font-black">600 K</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-[#1b1918] text-[#dfd4ba] text-[8px] font-bold text-center border-2 border-[#d4af37] opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                        Massive wave that heavily damages and shoves enemies back.
                    </div>
                 </button>
              </div>
           </div>
        </div>
      </div>
      {/* scrollbar styles moved to src/styles/base.css — imported via main.jsx */}
    </div>
  );
}