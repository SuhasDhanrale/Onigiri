import React, { useRef, useEffect, useState } from 'react';
import { CAMPAIGN_MAP } from '../../config/campaign.js';
import { V_WIDTH, V_HEIGHT } from '../../config/constants.js';
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
    waveStatusText = "DESTROY THE CAVE";
    waveStatusColor = "text-[#ff3b1f]";
  }

  const maxWaves = meta.activeNodeWaves ?? CAMPAIGN_MAP[s.currentRegion]?.waves ?? 3;
  const isBoss = meta.activeNodeType === 'boss';

  return (
    <>
      <div
        ref={containerRef}
        className={`flex-[7] relative bg-[var(--color-void)] flex justify-center items-center overflow-hidden ${s.gameState === 'MAP_SCREEN' ? 'hidden' : ''}`}
        data-mobile={window.innerWidth < 1024}
      >
        <canvas ref={bgCanvasRef} width={size.w} height={size.h} className="absolute top-0 left-0 w-full h-full block touch-none" />
        <canvas ref={fgCanvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} width={size.w} height={size.h} className={`absolute top-0 left-0 w-full h-full block touch-none z-10 ${armedSpell ? 'cursor-crosshair' : 'cursor-default'}`} />

        {s.cave && <DemonCave />}

        <div className="absolute top-[140px] left-8 flex flex-col gap-2 pointer-events-none z-30">
          {/* March Bar */}
          <div className="flex flex-col bg-[var(--color-parchment)]/90 px-4 py-2 border-2 border-[var(--color-ink-dark)] w-[260px]">
            <div className="flex justify-between items-end mb-1">
              <span className={`${waveStatusColor} text-xs uppercase tracking-[0.3em] font-bold`}>{waveStatusText}</span>
              <span className="text-[10px] uppercase font-bold text-[#8b8574]">{Math.min(s.wave, maxWaves)} / {maxWaves}</span>
            </div>
            
              <div className="relative h-6 flex items-center mt-2 mb-1">
                {/* Progress Line */}
                <div className="absolute left-2 right-4 h-[2px] bg-[#8b8574]/30" />
                <div className="absolute left-2 h-[2px] bg-[#d4af37] transition-all duration-500" 
                  style={{ width: `calc(${Math.min(100, ((s.wave - 1) / Math.max(1, maxWaves - 1)) * 100)}% - 16px)` }} 
                />
              
              {/* Nodes */}
              <div className="w-full flex justify-between relative z-10 px-1 items-center">
                {Array.from({ length: Math.max(0, maxWaves - 1) }).map((_, i) => {
                  const isPast = (i + 1) < s.wave || s.gameState === 'REGION_VICTORY';
                  const isCurrent = (i + 1) === s.wave && s.waveState !== 'BOSS_PHASE' && s.gameState !== 'REGION_VICTORY';
                  return (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full border-2 transition-colors duration-300 relative bg-[#2a2826] ${
                      isPast ? 'border-[#d4af37] bg-[#d4af37]/50' : 
                      isCurrent ? 'border-[#b84235] bg-[#b84235] shadow-[0_0_8px_rgba(184,66,53,0.8)] scale-125' : 
                      'border-[#8b8574]/40'
                    }`} />
                  );
                })}
                
                {/* End Destination */}
                {(() => {
                  const isPast = s.gameState === 'REGION_VICTORY' || s.gameState === 'CAMPAIGN_OVER';
                  const isCurrent = s.wave === maxWaves && !isPast;
                  
                  return (
                    <div className={`w-4 h-4 ml-2 rounded-sm rotate-45 border-2 transition-all duration-300 bg-[#1b1918] flex items-center justify-center shrink-0 ${
                      s.waveState === 'BOSS_PHASE' ? 'border-[#ff3b1f] bg-[#ff3b1f]/20 scale-125 shadow-[0_0_12px_rgba(255,59,31,0.8)]' : 
                      isPast ? 'border-[#d4af37] bg-[#d4af37]/50' :
                      isCurrent && !isBoss ? 'border-[#b84235] bg-[#b84235] shadow-[0_0_8px_rgba(184,66,53,0.8)] scale-125' :
                      isBoss ? 'border-[#dfd4ba]/80' :
                      'border-[#8b8574]/80'
                    }`}>
                      <div className={`w-1.5 h-1.5 ${
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
          </div>

          {/* Cave HP indicator */}
          {s.cave && (
            (() => {
              const hpPct = s.cave.hp / s.cave.maxHp;
              const isRaging = hpPct < 0.5;
              const barColor = hpPct > 0.66 ? '#b84235' : hpPct > 0.33 ? '#d4af37' : '#ff3b1f';
              return (
                <div className={`flex flex-col bg-[var(--color-parchment)]/90 px-3 py-2 border-2 ${isRaging ? 'border-[#ff3b1f]' : 'border-[var(--color-ink-dark)]'}`}>
                  <span className={`text-[10px] uppercase tracking-[0.25em] font-bold ${isRaging ? 'text-[#ff3b1f]' : 'text-[#8b8574]'}`}>
                    {isRaging ? '⚠ CAVE RAGE' : 'DEMON CAVE'}
                  </span>
                  <div className="w-full h-2 bg-[#4c4947] mt-1 relative overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: `${Math.max(0, hpPct * 100)}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <span className="text-[9px] text-[#8b8574] mt-0.5 font-mono">
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
