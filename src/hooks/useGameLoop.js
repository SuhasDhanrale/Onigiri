import { useEffect } from 'react';
import { recalculateGuards } from '../systems/GuardSystem.js';
import { tickBarracks } from '../systems/BarracksSystem.js';
import { tickInkLine, tickParticles, tickEffects } from '../systems/ParticleSystem.js';
import { tickWaveState } from '../systems/WaveSystem.js';
import { tickFoxFires, tickDragonWaves } from '../systems/SpellSystem.js';
import { tickProjectiles } from '../systems/ProjectileSystem.js';
import { tickUnits } from '../systems/CombatSystem.js';
import { tickCave } from '../systems/CaveSystem.js';
import { processDeaths } from '../systems/RewardSystem.js';
import { drawGame } from '../renderer/GameRenderer.js';
import { BARRACKS_DEFS } from '../config/barracks.js';

export function useGameLoop(state, fgCanvasRef, bgCanvasRef, metaRef, setUiTick) {
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
      tickWaveState(s, dt, metaRef);
      tickCave(s, dt);
      tickFoxFires(s, dt);
      tickDragonWaves(s, dt);
      tickProjectiles(s, dt);
      tickUnits(s, dt, now, metaRef);

      processDeaths(s, metaRef);


      tickParticles(s, dt);
      tickEffects(s, dt);

      // Tick visual squash animations for buildings
      Object.keys(s.visuals).forEach(k => { 
        if (s.visuals[k] > 0) s.visuals[k] = Math.max(0, s.visuals[k] - dt * 7); 
      });
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
    
    return () => { 
        cancelAnimationFrame(animationFrameId); 
    };
  }, [metaRef, fgCanvasRef, bgCanvasRef, state]);
}
