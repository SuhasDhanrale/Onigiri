import { SPELL_COSTS } from '../../config/spells.js';
import { SoundManager } from '../../systems/SoundManager.js';

export function SpellShrine({ s, setUiTick, meta, setMeta, triggerThunder, triggerFoxFire, triggerDragonWave, unlockHero, tutorial, tutorialFreeSpellAvailable = false }) {
  const freeTutorialSpell = tutorialFreeSpellAvailable && s.gameState === 'COMBAT';
  const playHover = () => SoundManager.playSfx('ui_hover');

  return (
    <div className="w-full">
      <div className="flex justify-between items-center border-b-2 border-[var(--color-ink-dark)] pb-1 mb-2">
        <h3 className="text-[var(--color-ink-dark)] font-black text-[9px] uppercase tracking-[0.2em]">The Onmyoji Shrine</h3>
        {!s.heroUnlocked && (
          <button
            onClick={() => {
              tutorial?.completeStep?.('combat_spell_crisis');
              unlockHero(500);
            }}
            onMouseEnter={playHover}
            disabled={s.command < 500 || s.gameState !== 'COMBAT'}
            className="text-[8px] font-black uppercase border border-[#d4af37] bg-[#d4af37] text-[var(--color-ink-dark)] hover:bg-[var(--color-ink-dark)] hover:text-[#d4af37] px-1.5 py-0.5 disabled:opacity-50 transition-colors"
          >
            Unlock Hero (500K)
          </button> 
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {/* Lightning Shower */}
        <button
          onClick={() => {
            tutorial?.completeStep?.('combat_spell_crisis');
            triggerThunder();
          }}
          onMouseEnter={playHover}
          disabled={(!freeTutorialSpell && s.command < SPELL_COSTS.THUNDER_SHOWER) || s.gameState !== 'COMBAT' || s.thunderCooldown > 0}
          className="relative group aspect-square flex flex-col items-center justify-center transition-all border-2 bg-[var(--color-ink)] text-[#38bdf8] border-[#38bdf8] hover:bg-[#38bdf8] hover:text-[var(--color-ink-dark)] disabled:opacity-50 disabled:border-[var(--color-ink-dark)] disabled:text-[#8b8574]"
        >
          <span className="text-xl">⚡</span>
          <span className="text-[7px] font-black mt-1">{freeTutorialSpell ? 'FREE' : `${SPELL_COSTS.THUNDER_SHOWER} K`}</span>
          {s.thunderCooldown > 0 && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[7px] font-bold text-white text-center py-0.5">
              {Math.ceil(s.thunderCooldown)}s
            </div>
          )}
          <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-[var(--color-ink-dark)] text-[var(--color-parchment)] text-[8px] font-bold text-center border-2 border-[#38bdf8] z-50 pointer-events-none shadow-xl">
             <div className="uppercase text-[#38bdf8] mb-1">Lightning Shower</div>
             {freeTutorialSpell ? 'Free tutorial cast. ' : ''}Bolts rain in three powerful waves.
          </div>
        </button>

        {/* Fox Fire */}
        <button
          onClick={() => {
            tutorial?.completeStep?.('combat_spell_crisis');
            triggerFoxFire();
          }}
          onMouseEnter={playHover}
          disabled={(!freeTutorialSpell && s.command < SPELL_COSTS.FOX_FIRE) || s.gameState !== 'COMBAT' || s.foxFireCooldown > 0}
          className="relative group aspect-square flex flex-col items-center justify-center transition-all border-2 bg-[var(--color-ink)] text-[#ea580c] border-[#ea580c] hover:bg-[#ea580c] hover:text-[var(--color-ink-dark)] disabled:opacity-50 disabled:border-[var(--color-ink-dark)] disabled:text-[#8b8574]"
        >
          <span className="text-xl">🔥</span>
          <span className="text-[7px] font-black mt-1">{freeTutorialSpell ? 'FREE' : `${SPELL_COSTS.FOX_FIRE} K`}</span>
          {s.foxFireCooldown > 0 && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[7px] font-bold text-white text-center py-0.5">
              {Math.ceil(s.foxFireCooldown)}s
            </div>
          )}
          <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-[var(--color-ink-dark)] text-[var(--color-parchment)] text-[8px] font-bold text-center border-2 border-[#ea580c] z-50 pointer-events-none shadow-xl">
             <div className="uppercase text-[#ea580c] mb-1">Fox Fire</div>
             {freeTutorialSpell ? 'Free tutorial cast. ' : ''}Ignite the gate approach (Y:1000-1200) for 8s.
          </div>
        </button>

        {/* Dragon Wave */}
        <button
          onClick={() => {
            tutorial?.completeStep?.('combat_spell_crisis');
            triggerDragonWave();
          }}
          onMouseEnter={playHover}
          disabled={s.command < SPELL_COSTS.DRAGON_WAVE || s.gameState !== 'COMBAT' || s.dragonCooldown > 0 || !s.dragonUnlocked}
          className="relative group aspect-square flex flex-col items-center justify-center transition-all border-2 bg-[var(--color-ink)] text-[#d4af37] border-[#d4af37] hover:bg-[#d4af37] hover:text-[var(--color-ink-dark)] disabled:opacity-50 disabled:border-[var(--color-ink-dark)] disabled:text-[#8b8574]"
        >
          <span className="text-xl">🌊</span>
          <span className="text-[7px] font-black mt-1">{SPELL_COSTS.DRAGON_WAVE} K</span>
          {s.dragonCooldown > 0 && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[7px] font-bold text-white text-center py-0.5">
              {Math.ceil(s.dragonCooldown)}s
            </div>
          )}
          {!s.dragonUnlocked && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-base pointer-events-none">🔒</div>
          )}
          <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-[var(--color-ink-dark)] text-[var(--color-parchment)] text-[8px] font-bold text-center border-2 border-[#d4af37] z-50 pointer-events-none shadow-xl">
             <div className="uppercase text-[#d4af37] mb-1">Dragon Wave</div>
             Massive wave that heavily damages and shoves enemies back.
          </div>
        </button>

        {/* Dummy Button */}
        <div 
          className="relative group aspect-square flex flex-col items-center justify-center border-2 bg-[var(--color-ink-dark)]/10 text-[#8b8574]/40 border-[#8b8574]/20 cursor-not-allowed"
        >
          <span className="text-xl grayscale opacity-30">💮</span>
          <span className="text-[7px] font-black mt-1">???</span>
          <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-[var(--color-ink-dark)] text-[var(--color-parchment)] text-[8px] font-bold text-center border border-[#8b8574]/20 z-50 pointer-events-none">
             Ancestor skill yet to be mastered...
          </div>
        </div>
      </div>
    </div>
  );
}
