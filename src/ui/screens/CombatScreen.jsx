import { CAMPAIGN_MAP } from '../../config/campaign.js';
import { V_WIDTH, V_HEIGHT } from '../../config/constants.js';
import { ResultScreens } from './ResultScreens.jsx';

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
        
        <ResultScreens s={s} meta={meta} setMeta={setMeta} initRun={initRun} handleRegionVictory={handleRegionVictory} />
      </div>
    </>
  );
}
