export function TacticalCommand({ s, triggerWarDrums, triggerHarvest, triggerResolve }) {
  return (
    <div>
      <h3 className="text-[var(--color-ink-dark)] font-black text-[10px] uppercase tracking-[0.2em] border-b-2 border-[var(--color-ink-dark)] pb-1 mb-2">Tactical Command</h3>
      <div className="flex flex-col gap-1.5">
        <button 
          onClick={triggerWarDrums} 
          disabled={s.koku < 200 || s.gameState !== 'COMBAT'} 
          className="relative group w-full flex justify-between items-baseline px-3 py-1.5 transition-all border-2 bg-[#e8e0cc] border-[var(--color-ink-dark)] text-[var(--color-ink-dark)] hover:bg-[var(--color-ink-light)] hover:text-[var(--color-parchment)] disabled:opacity-50 disabled:bg-[#cfc4af] disabled:text-[var(--color-khaki)] disabled:border-[#8b8574]"
        >
          <span className="text-[9px] font-bold tracking-widest uppercase">
            War Drums {s.warDrumsActive > 0 && `(${s.warDrumsActive.toFixed(1)}s)`}
          </span>
          <span className="text-[9px] font-black">200 K</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-[var(--color-ink-dark)] text-[var(--color-parchment)] text-[8px] font-bold text-center border-2 border-[#b84235] opacity-0 group-hover:opacity-100 pointer-events-none z-50">
            +50% Atk & Move Speed for 5s.
          </div>
        </button>

        <button 
          onClick={triggerHarvest} 
          disabled={s.koku < 300 || s.gameState !== 'COMBAT'} 
          className="relative group w-full flex justify-between items-baseline px-3 py-1.5 transition-all border-2 bg-[#e8e0cc] border-[var(--color-ink-dark)] text-[var(--color-ink-dark)] hover:bg-[var(--color-ink-light)] hover:text-[var(--color-parchment)] disabled:opacity-50 disabled:bg-[#cfc4af] disabled:text-[var(--color-khaki)] disabled:border-[#8b8574]"
        >
          <span className="text-[9px] font-bold tracking-widest uppercase">
            Bountiful Harvest {s.harvestActive > 0 && `(${s.harvestActive.toFixed(1)}s)`}
          </span>
          <span className="text-[9px] font-black">300 K</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-[var(--color-ink-dark)] text-[var(--color-parchment)] text-[8px] font-bold text-center border-2 border-[#d4af37] opacity-0 group-hover:opacity-100 pointer-events-none z-50">
            Double Koku drops for 10s.
          </div>
        </button>

        <button 
          onClick={triggerResolve} 
          disabled={s.koku < 150 || s.gameState !== 'COMBAT'} 
          className="relative group w-full flex justify-between items-baseline px-3 py-1.5 transition-all border-2 bg-[#e8e0cc] border-[var(--color-ink-dark)] text-[var(--color-ink-dark)] hover:bg-[var(--color-ink-light)] hover:text-[var(--color-parchment)] disabled:opacity-50 disabled:bg-[#cfc4af] disabled:text-[var(--color-khaki)] disabled:border-[#8b8574]"
        >
          <span className="text-[9px] font-bold tracking-widest uppercase">
            Shogun's Resolve
          </span>
          <span className="text-[9px] font-black">150 K</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-[var(--color-ink-dark)] text-[var(--color-parchment)] text-[8px] font-bold text-center border-2 border-[#4a5d23] opacity-0 group-hover:opacity-100 pointer-events-none z-50">
            Instantly heals Hatamotos & Barricades +50% HP.
          </div>
        </button>
      </div>
    </div>
  );
}
