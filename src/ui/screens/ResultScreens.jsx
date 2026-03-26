import { CAMPAIGN_MAP } from '../../config/campaign.js';

export function ResultScreens({ s, setMeta, initRun, handleRegionVictory }) {
  if (s.gameState === 'CAMPAIGN_OVER') {
    return (
      <div className="fixed inset-0 bg-[var(--color-parchment)]/95 flex flex-col items-center justify-center z-50 pointer-events-auto p-8">
        <h2 className="text-6xl font-black text-[#d4af37] tracking-[0.4em] uppercase mb-2 text-center">Demon God Slain</h2>
        <p className="text-xl font-bold mb-8 text-[var(--color-ink)]">The realm is unified.</p>
        <button 
          onClick={() => { setMeta(prev => ({ ...prev, honor: prev.honor + s.earnedHonor, conqueredRegions: [] })); initRun(); }} 
          className="px-12 py-5 bg-[var(--color-ink)] text-[var(--color-parchment)] text-xl font-black uppercase border-4 border-[#d4af37]"
        >
          Begin Anew
        </button>
      </div>
    );
  }

  if (s.gameState === 'REGION_VICTORY') {
    return (
      <div className="absolute inset-0 bg-[var(--color-parchment)]/95 flex flex-col items-center justify-center z-50 pointer-events-auto p-8 overflow-y-auto custom-scrollbar">
        <h2 className="text-6xl font-black text-[#d4af37] tracking-[0.4em] uppercase mb-2 text-center">Region Secured</h2>
        <div className="bg-[var(--color-ink)] text-[var(--color-parchment)] px-12 py-6 mb-8 text-center border-4 border-[#d4af37]">
          <span className="block text-sm uppercase tracking-[0.4em] mb-2 text-[#8b8574]">Reward Claimed</span>
          <span className="text-2xl font-black">{CAMPAIGN_MAP[s.currentRegion]?.reward}</span>
        </div>
        <button 
          onClick={handleRegionVictory} 
          className="px-12 py-5 bg-[#d4af37] text-[var(--color-ink)] text-xl tracking-[0.3em] uppercase active:scale-95 font-black border-4 border-[#1b1918]"
        >
          Return to Map
        </button>
      </div>
    );
  }

  if (s.gameState === 'GAMEOVER') {
    return (
      <div className="absolute inset-0 bg-[var(--color-parchment)]/95 flex flex-col items-center justify-center z-50 pointer-events-auto p-8 overflow-y-auto custom-scrollbar">
        <h2 className="text-6xl font-black text-[#b84235] tracking-[0.4em] uppercase mb-2 text-center">Defenses Broken</h2>
        <div className="bg-[var(--color-ink)] text-[var(--color-parchment)] px-12 py-6 mb-8 text-center border-4 border-[#b84235]">
          <span className="block text-sm uppercase tracking-[0.4em] mb-2 text-[#8b8574]">Honor Extracted</span>
          <span className="text-5xl font-black">+{s.earnedHonor}</span>
        </div>
        <button 
          onClick={() => { setMeta(prev => ({ ...prev, honor: prev.honor + s.earnedHonor, conqueredRegions: [] })); initRun(); }} 
          className="px-12 py-5 bg-[#b84235] text-[var(--color-parchment)] text-xl tracking-[0.3em] uppercase active:scale-95 font-black border-4 border-[#1b1918]"
        >
          Enter the Cycle
        </button>
      </div>
    );
  }

  return null;
}
