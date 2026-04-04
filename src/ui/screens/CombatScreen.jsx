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

  return (
    <>
      <div
        ref={containerRef}
        className={`flex-[7] relative bg-[var(--color-void)] flex justify-center items-center overflow-hidden ${s.gameState === 'MAP_SCREEN' ? 'hidden' : ''}`}
        data-mobile={window.innerWidth < 1024}
      >
        <canvas ref={bgCanvasRef} width={size.w} height={size.h} className="absolute top-0 left-0 w-full h-full block touch-none" />
        <canvas ref={fgCanvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} width={size.w} height={size.h} className={`absolute top-0 left-0 w-full h-full block touch-none z-10 ${armedSpell ? 'cursor-crosshair' : 'cursor-default'}`} />

        {/* --- DECORATIONS --- */}
        <DemonCave />

        <div className="absolute top-[140px] left-8 flex flex-col gap-2 pointer-events-none z-30">
          {/* Wave status */}
          <div className="flex flex-col bg-[var(--color-parchment)]/90 px-4 py-2 border-2 border-[var(--color-ink-dark)]">
            <span className={`${waveStatusColor} text-xs uppercase tracking-[0.3em] font-bold`}>{waveStatusText}</span>
            <span className="text-3xl font-black text-[var(--color-ink-dark)] tracking-widest">WAVE {s.wave} <span className="text-xl">/ {CAMPAIGN_MAP[s.currentRegion]?.waves || '?'}</span></span>
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
