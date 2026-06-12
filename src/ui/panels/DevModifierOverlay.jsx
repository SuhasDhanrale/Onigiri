import { useState } from 'react';
import { getCurseHonorMult } from '../../systems/EventSystem.js';

/**
 * DEV-only, read-only overlay showing the run modifiers combat is actually using.
 * This is the safety net for "computed but never read" drift (Eagle Eye / Stone Stance class).
 * Renders nothing in production builds. No gameplay effect.
 *
 * Props: runState (blessings/curses/shopPurchases), meta (resolved blessing/curse mults),
 *        s (state.current — resolved shop flags).
 */
export function DevModifierOverlay({ runState, meta, s }) {
  const [open, setOpen] = useState(true);
  if (!import.meta.env.DEV) return null;
  if (!runState) return null;

  const fmt = (n) => (typeof n === 'number' ? n.toFixed(2) : '—');
  const blessings = runState.blessings ?? [];
  const curses = runState.curses ?? [];
  const purchases = Object.keys(runState.shopPurchases ?? {}).filter(k => runState.shopPurchases[k]);

  const curseTag = (c) => {
    if (typeof c.combatsRemaining === 'number') return `${c.id}(${c.combatsRemaining}c)`;
    if (typeof c.nodesRemaining === 'number') return `${c.id}(${c.nodesRemaining}n)`;
    return c.id;
  };

  return (
    <div className="absolute top-2 left-2 z-[500] font-mono text-[10px] leading-tight text-[#dfd4ba] bg-black/80 border border-[#d4af37]/40 max-w-[320px] pointer-events-auto select-none">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-2 py-1 bg-[#d4af37]/15 text-[#d4af37] font-bold tracking-widest uppercase"
      >
        {open ? '▾' : '▸'} DEV · run modifiers
      </button>
      {open && (
        <div className="px-2 py-1.5 flex flex-col gap-1.5">
          <div>
            <div className="text-[#4a5d23] font-bold">BLESSINGS</div>
            <div className="text-[#8b8574]">{blessings.length ? blessings.map(b => `${b.id}(${b.combatsRemaining === Infinity ? '∞' : b.combatsRemaining})`).join(', ') : '—'}</div>
            <div>dmg×{fmt(meta.activeDamageMult)} atk×{fmt(meta.activeAttackSpeedMult)} hp×{fmt(meta.activeMaxHpMult)}</div>
            <div>rng×{fmt(meta.activeArcherRangeMult)} mv×{fmt(meta.activeMoveSpeedMult)} drop×{fmt(meta.activeCommandDropMult)}</div>
          </div>
          <div>
            <div className="text-[#b84235] font-bold">CURSES</div>
            <div className="text-[#8b8574]">{curses.length ? curses.map(curseTag).join(', ') : '—'}</div>
            <div>dmg×{fmt(meta.activeCurseDamageMult)} hp×{fmt(meta.activeCurseMaxHpMult)} honor×{fmt(getCurseHonorMult(curses))}</div>
          </div>
          <div>
            <div className="text-[#d4af37] font-bold">SHOP</div>
            <div className="text-[#8b8574]">{purchases.length ? purchases.join(', ') : '—'}</div>
            <div>unit×{fmt(s.shopUnitStatMult)} fire×{fmt(s.shopArcherFireMult)} barr×{fmt(s.shopBarracksTimeMult)}</div>
            <div>spellCd×{fmt(s.shopSpellCooldownMult)} towerHp×{fmt(s.shopTowerHpMult)} dragon:{s.dragonUnlocked ? '✓' : '✗'}</div>
          </div>
          <div className="text-[#8b8574] border-t border-[#d4af37]/20 pt-1">baseCmd {runState.baseCommand} · cmd {Math.floor(s.command ?? 0)}</div>
        </div>
      )}
    </div>
  );
}
