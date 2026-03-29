import { WALL_Y } from '../../config/constants.js';

export function SpellShrine({ s, setUiTick, meta, setMeta, triggerThunder, triggerFoxFire, triggerDragonWave, unlockHero }) {
  return (
    <div>
      <div className="flex justify-between items-end border-b-2 border-[var(--color-ink-dark)] pb-1 mb-2">
        <h3 className="text-[var(--color-ink-dark)] font-black text-[10px] uppercase tracking-[0.2em]">The Onmyoji Shrine</h3>
        {!s.heroUnlocked && (
          <button 
            onClick={() => unlockHero(500)} 
            disabled={s.koku < 500 || s.gameState !== 'COMBAT'} 
            className="text-[8px] font-black uppercase border border-[#d4af37] bg-[#d4af37] text-[var(--color-ink-dark)] hover:bg-[var(--color-ink-dark)] hover:text-[#d4af37] px-2 disabled:opacity-50"
          >
            Unlock Hero (500K)
          </button> 
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <button 
          onClick={triggerThunder} 
          disabled={s.koku < 150 || s.gameState !== 'COMBAT' || s.thunderCooldown > 0} 
          className="relative group w-full flex justify-between items-baseline px-3 py-1.5 transition-all border-2 bg-[var(--color-ink)] text-[#38bdf8] border-[#38bdf8] hover:bg-[#38bdf8] hover:text-[var(--color-ink-dark)] disabled:opacity-50 disabled:border-[var(--color-ink-dark)] disabled:text-[#8b8574]"
        >
          <span className="text-[9px] font-bold tracking-widest uppercase">
            Thunder Strike {s.thunderCooldown > 0 && `(${Math.ceil(s.thunderCooldown)}s)`}
          </span>
          <span className="text-[9px] font-black">150 K</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-[var(--color-ink-dark)] text-[var(--color-parchment)] text-[8px] font-bold text-center border-2 border-[#38bdf8] opacity-0 group-hover:opacity-100 pointer-events-none z-50">
            Vaporize the 3 highest-HP enemies.
          </div>
        </button>

        <button 
          onClick={triggerFoxFire} 
          disabled={s.koku < 250 || s.gameState !== 'COMBAT' || s.foxFireCooldown > 0} 
          className="relative group w-full flex justify-between items-baseline px-3 py-1.5 transition-all border-2 bg-[var(--color-ink)] text-[#ea580c] border-[#ea580c] hover:bg-[#ea580c] hover:text-[var(--color-ink-dark)] disabled:opacity-50 disabled:border-[var(--color-ink-dark)] disabled:text-[#8b8574]"
        >
          <span className="text-[9px] font-bold tracking-widest uppercase">
            Fox Fire {s.foxFireCooldown > 0 && `(${Math.ceil(s.foxFireCooldown)}s)`}
          </span>
          <span className="text-[9px] font-black">250 K</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-[var(--color-ink-dark)] text-[var(--color-parchment)] text-[8px] font-bold text-center border-2 border-[#ea580c] opacity-0 group-hover:opacity-100 pointer-events-none z-50">
            Ignite the gate approach (Y:1000-1200) for 8s.
          </div>
        </button>

        <button 
          onClick={triggerDragonWave} 
          disabled={s.koku < 600 || s.gameState !== 'COMBAT' || s.dragonCooldown > 0} 
          className="relative group w-full flex justify-between items-baseline px-3 py-1.5 transition-all border-2 bg-[var(--color-ink)] text-[#d4af37] border-[#d4af37] hover:bg-[#d4af37] hover:text-[var(--color-ink-dark)] disabled:opacity-50 disabled:border-[var(--color-ink-dark)] disabled:text-[#8b8574]"
        >
          <span className="text-[9px] font-bold tracking-widest uppercase">
            Dragon Wave {s.dragonCooldown > 0 && `(${Math.ceil(s.dragonCooldown)}s)`}
          </span>
          <span className="text-[9px] font-black">600 K</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 bg-[var(--color-ink-dark)] text-[var(--color-parchment)] text-[8px] font-bold text-center border-2 border-[#d4af37] opacity-0 group-hover:opacity-100 pointer-events-none z-50">
            Massive wave that heavily damages and shoves enemies back.
          </div>
        </button>
      </div>
    </div>
  );
}
