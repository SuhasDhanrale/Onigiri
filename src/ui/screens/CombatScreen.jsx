import React, { useRef, useEffect, useState } from 'react';
import { CAMPAIGN_MAP, isVisibleBossId } from '../../config/campaign.js';
import { V_WIDTH, V_HEIGHT } from '../../config/constants.js';
import { getEncounterPhaseCount, getPlayableWaveCount } from '../../config/waves.js';
import { PERMANENT_TECHS } from '../../config/provisions.js';
import { ResultScreens } from './ResultScreens.jsx';
import { DemonCave } from '../components/DemonCave.jsx';

export function CombatScreen({
  s,
  meta,
  setMeta,
  armedSpell,
  bgCanvasRef,
  fgCanvasRef,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  initRun,
  handleRegionVictory
}) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: V_WIDTH, h: V_HEIGHT });
  const activeBossId = s.bossId ?? meta?.activeBossId ?? null;
  const activeBossChapter = Object.values(CAMPAIGN_MAP).find(chapter => chapter.bossId === activeBossId);
  const activeBossName = activeBossChapter?.bossName ?? 'Boss';
  const isVisibleBossFight = isVisibleBossId(activeBossId);
  const showCaveObjective = s.cave && !isVisibleBossFight;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const boundedW = Math.floor(width);
        const boundedH = Math.floor(height);
        setSize({ w: boundedW, h: boundedH });

        s.canvasWidth = boundedW;
        s.canvasHeight = boundedH;

        const scale = Math.min(boundedW / V_WIDTH, boundedH / V_HEIGHT);
        s.canvasScale = scale;
        s.canvasOffsetX = (boundedW - (V_WIDTH * scale)) / 2;
        s.canvasOffsetY = (boundedH - (V_HEIGHT * scale)) / 2;
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [s]);

  let waveStatusText = "";
  let waveStatusColor = "text-[#1b1918]";

  if (s.waveState === 'PRE_WAVE') {
    if ((s.wave - 1) > 0 && (s.wave - 1) % 3 === 0) {
      waveStatusText = `REFORMATION (${Math.ceil(s.waveTimer)}s)`;
      waveStatusColor = "text-[#4a5d23]";
    } else {
      waveStatusText = `PREPARING (${Math.ceil(s.waveTimer)}s)`;
      waveStatusColor = "text-[#2b3d60]";
    }
  }
  else if (s.waveState === 'SPAWNING') {
    if (s.wave === 1) waveStatusText = "SCOUTS SPOTTED";
    else if (s.wave === 2) waveStatusText = "PEASANT SKIRMISH";
    else if (s.wave === 3) waveStatusText = "THE VANGUARD";
    else if (s.wave % 5 === 0) waveStatusText = "BOSS APPROACHES";
    else waveStatusText = "HORDE ARRIVING";
    waveStatusColor = "text-[#b84235]";
  }
  else if (s.waveState === 'CLEANUP') {
    waveStatusText = "MOPPING UP...";
    waveStatusColor = "text-[#8b8574]";
  }
  else if (s.waveState === 'BOSS_PHASE') {
    waveStatusText = isVisibleBossFight ? `DEFEAT ${activeBossName.toUpperCase()}` : "DESTROY THE CAVE";
    waveStatusColor = "text-[#ff3b1f]";
  }

  const isBoss = meta.activeNodeType === 'boss';
  const configuredWaves = meta.activeNodeWaves ?? CAMPAIGN_MAP[s.currentRegion]?.waves ?? 3;
  const playableWaves = getPlayableWaveCount(meta.activeNodeType, configuredWaves);
  const totalPhases = getEncounterPhaseCount(meta.activeNodeType, configuredWaves);
  const currentPhase = isBoss && s.waveState === 'BOSS_PHASE'
    ? totalPhases
    : Math.min(s.wave, totalPhases);
  const activeDojoTechs = Object.entries(PERMANENT_TECHS)
    .filter(([key]) => meta?.unlockedProvisions?.includes(key))
    .map(([key, tech]) => ({ id: key, name: tech.name, icon: tech.icon }));
  const showDojoReady = s.waveState === 'PRE_WAVE' && activeDojoTechs.length > 0;

  return (
    <>
      <div
        ref={containerRef}
        data-tutorial-target="combat-field"
        className={`flex-[7] relative bg-[var(--color-void)] flex justify-center items-center overflow-hidden ${s.gameState === 'MAP_SCREEN' ? 'hidden' : ''}`}
        data-mobile={window.innerWidth < 1024}
      >
        <canvas ref={bgCanvasRef} width={size.w} height={size.h} className="absolute top-0 left-0 w-full h-full block touch-none" />
        <canvas
          ref={fgCanvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          width={size.w}
          height={size.h}
          className={`absolute top-0 left-0 w-full h-full block touch-none z-10 ${armedSpell ? 'cursor-crosshair' : 'cursor-default'}`}
        />

        {showCaveObjective && <DemonCave />}

        <div className="absolute left-2 top-2 z-30 flex max-w-[calc(100%-1rem)] flex-col gap-1.5 pointer-events-none sm:left-3 sm:top-3 lg:left-5 lg:top-5 xl:left-6 xl:top-6">
          {/* March Bar */}
          <div className="flex w-[clamp(150px,22vw,210px)] max-w-full flex-col bg-[var(--color-parchment)]/85 px-2 py-1.5 border-2 border-[var(--color-ink-dark)]">
            <div className="flex justify-between items-end gap-2">
              <span className={`${waveStatusColor} min-w-0 truncate text-[8px] uppercase tracking-[0.16em] font-black sm:text-[9px]`}>{waveStatusText}</span>
              <span className="shrink-0 text-[8px] uppercase font-black text-[#8b8574]">{currentPhase}/{totalPhases}</span>
            </div>
            
              <div className="relative h-4 flex items-center mt-1">
                {/* Progress Line */}
                <div className="absolute left-1.5 right-3 h-[2px] bg-[#8b8574]/30" />
                <div className="absolute left-1.5 h-[2px] bg-[#d4af37] transition-all duration-500" 
                  style={{ width: `calc(${Math.min(100, ((currentPhase - 1) / Math.max(1, totalPhases - 1)) * 100)}% - 12px)` }} 
                />
              
              {/* Nodes */}
              <div className="w-full flex justify-between relative z-10 px-0.5 items-center">
                {Array.from({ length: Math.max(0, totalPhases - 1) }).map((_, i) => {
                  const phase = i + 1;
                  const isPlayableWave = phase <= playableWaves;
                  const isPast = phase < currentPhase || s.gameState === 'REGION_VICTORY';
                  const isCurrent = isPlayableWave && phase === currentPhase && s.waveState !== 'BOSS_PHASE' && s.gameState !== 'REGION_VICTORY';
                  return (
                    <div key={i} className={`h-1.5 w-1.5 rounded-full border transition-colors duration-300 relative bg-[#2a2826] sm:h-2 sm:w-2 ${
                      isPast ? 'border-[#d4af37] bg-[#d4af37]/50' : 
                      isCurrent ? 'border-[#b84235] bg-[#b84235] shadow-[0_0_8px_rgba(184,66,53,0.8)] scale-125' : 
                      'border-[#8b8574]/40'
                    }`} />
                  );
                })}
                
                {/* End Destination */}
                {(() => {
                  const isPast = s.gameState === 'REGION_VICTORY' || s.gameState === 'CAMPAIGN_OVER';
                  const isCurrent = currentPhase === totalPhases && !isPast;
                  
                  return (
                    <div className={`h-2.5 w-2.5 ml-1.5 rounded-sm rotate-45 border transition-all duration-300 bg-[#1b1918] flex items-center justify-center shrink-0 sm:h-3 sm:w-3 ${
                      s.waveState === 'BOSS_PHASE' ? 'border-[#ff3b1f] bg-[#ff3b1f]/20 scale-125 shadow-[0_0_12px_rgba(255,59,31,0.8)]' : 
                      isPast ? 'border-[#d4af37] bg-[#d4af37]/50' :
                      isCurrent && !isBoss ? 'border-[#b84235] bg-[#b84235] shadow-[0_0_8px_rgba(184,66,53,0.8)] scale-125' :
                      isBoss ? 'border-[#dfd4ba]/80' :
                      'border-[#8b8574]/80'
                    }`}>
                      <div className={`w-1 h-1 ${
                        s.waveState === 'BOSS_PHASE' ? 'bg-[#ff3b1f]' : 
                        isPast ? 'bg-[#d4af37]' :
                        isCurrent && !isBoss ? 'bg-[#b84235]' :
                        isBoss ? 'bg-[#dfd4ba]/80' : 
                        'bg-[#8b8574]/80'
                      } rounded-sm`} />
                    </div>
                  );
                })()}
              </div>
            </div>
            {showDojoReady && (
              <div className="mt-1 flex items-center justify-between gap-2 border-t border-[#8b8574]/20 pt-1">
                <span className="shrink-0 text-[7px] font-black uppercase tracking-[0.14em] text-[#8b1420] sm:text-[8px]">
                  Dojo Ready
                </span>
                <div className="flex min-w-0 items-center justify-end gap-1">
                  {activeDojoTechs.map((tech) => (
                    <span
                      key={tech.id}
                      title={tech.name}
                      className="flex h-4 min-w-4 items-center justify-center border border-[#8b1420]/25 bg-[#1a1816]/15 px-1 text-[9px] leading-none"
                    >
                      {tech.icon}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cave HP indicator */}
          {showCaveObjective && (
            (() => {
              const hpPct = s.cave.hp / s.cave.maxHp;
              const isRaging = hpPct < 0.5;
              const barColor = hpPct > 0.66 ? '#b84235' : hpPct > 0.33 ? '#d4af37' : '#ff3b1f';
              return (
                <div className={`flex w-[clamp(150px,22vw,210px)] max-w-full flex-col bg-[var(--color-parchment)]/85 px-2 py-1.5 border-2 ${isRaging ? 'border-[#ff3b1f]' : 'border-[var(--color-ink-dark)]'}`}>
                  <span className={`text-[8px] uppercase tracking-[0.16em] font-black ${isRaging ? 'text-[#ff3b1f]' : 'text-[#8b8574]'}`}>
                    {isRaging ? '⚠ CAVE RAGE' : 'DEMON CAVE'}
                  </span>
                  <div className="w-full h-1.5 bg-[#4c4947] mt-1 relative overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: `${Math.max(0, hpPct * 100)}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <span className="text-[8px] text-[#8b8574] mt-0.5 font-mono">
                    {Math.ceil(s.cave.hp)} / {s.cave.maxHp}
                  </span>
                </div>
              );
            })()
          )}
        </div>


        <ResultScreens s={s} meta={meta} setMeta={setMeta} initRun={initRun} handleRegionVictory={handleRegionVictory} />
      </div>
    </>
  );
}
