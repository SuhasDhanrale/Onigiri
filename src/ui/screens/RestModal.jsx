import React, { useState } from 'react';
import { BLESSINGS } from '../../config/blessings.js';

/**
 * RestModal — overlay on HubTestScreen for rest nodes.
 * Props:
 *   options         — [{ id, name, effect, desc, locked }] from getRestOptions
 *   blessingChoices — [blessingId, blessingId] from getRestBlessingChoices
 *   runState        — current run state
 *   onChoice        — (optionId, payload) => void
 *   onLeave         — () => void
 */
export function RestModal({ options, blessingChoices, runState, onChoice, onLeave }) {
  const [selectedCurse,    setSelectedCurse]    = useState(null);
  const [selectedBlessing, setSelectedBlessing] = useState(null);
  const [garrisonSize,     setGarrisonSize]      = useState('small');

  const hasCurses = (runState?.curses?.length ?? 0) > 0;

  const handleChoose = (optionId) => {
    if (optionId === 'REMOVE_CURSE') {
      if (!hasCurses) return;
      const curseId = selectedCurse ?? runState?.curses?.[0]?.id ?? null;
      onChoice('REMOVE_CURSE', { curseId });
    } else if (optionId === 'BLESSING') {
      if (!selectedBlessing) return;
      onChoice('BLESSING', { blessingId: selectedBlessing });
    } else if (optionId === 'RECRUIT_CAP') {
      onChoice('RECRUIT_CAP', { size: garrisonSize });
    }
  };

  return (
    <div
      className="absolute inset-0 z-[300] flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onLeave(); }}
    >
      <div className="w-[560px] bg-[#0a0908] border border-[#2b3d60]/50 shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col animate-[fade-in_0.2s_ease-out]">

        {/* Header */}
        <div className="border-b border-[#2b3d60]/30 px-8 py-5">
          <p className="text-[9px] font-bold text-[#2b3d60] tracking-[0.4em] uppercase mb-1">
            War Camp
          </p>
          <h2 className="text-xl font-black tracking-[0.2em] uppercase text-[#dfd4ba]">
            Rest & Recover
          </h2>
        </div>

        {/* Options */}
        <div className="px-8 py-6 flex flex-col gap-4">
          {options.map(option => {
            const isLocked      = option.locked;
            const needsBlessing = option.id === 'BLESSING' && !selectedBlessing;
            const canChoose     = !isLocked && !needsBlessing;

            return (
              <div
                key={option.id}
                className={`border p-5 transition-all
                  ${isLocked
                    ? 'opacity-40 border-[#8b8574]/10 bg-[#0a0908]'
                    : 'border-[#2b3d60]/40 bg-[#141211]'
                  }`}
              >
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#dfd4ba] mb-1">
                  {option.name}
                </p>
                <p className="text-[10px] text-[#8b8574] font-sans leading-relaxed mb-3">
                  {option.desc}
                </p>

                {/* BLESSING: pick one of two choices */}
                {option.id === 'BLESSING' && !isLocked && blessingChoices?.length === 2 && (
                  <div className="flex gap-3 mb-3">
                    {blessingChoices.map(bId => {
                      const b = BLESSINGS[bId];
                      return (
                        <button
                          key={bId}
                          onClick={() => setSelectedBlessing(bId)}
                          className={`flex-1 p-3 border text-left transition-all
                            ${selectedBlessing === bId
                              ? 'border-[#d4af37] bg-[#d4af37]/10'
                              : 'border-[#8b8574]/20 hover:border-[#8b8574]/60'
                            }`}
                        >
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${selectedBlessing === bId ? 'text-[#d4af37]' : 'text-[#dfd4ba]/70'}`}>
                            {b?.name ?? bId}
                          </p>
                          <p className="text-[8px] text-[#8b8574] font-sans leading-relaxed">
                            {b?.desc ?? ''}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* REMOVE_CURSE: pick which curse to remove */}
                {option.id === 'REMOVE_CURSE' && !isLocked && hasCurses && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {runState.curses.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCurse(c.id)}
                        className={`px-3 py-1 border text-[9px] font-bold uppercase tracking-widest transition-all
                          ${selectedCurse === c.id
                            ? 'border-[#b84235] bg-[#b84235]/10 text-[#b84235]'
                            : 'border-[#8b8574]/20 text-[#8b8574] hover:border-[#8b8574]/60 hover:text-[#dfd4ba]'
                          }`}
                      >
                        {c.id.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                )}

                {/* RECRUIT_CAP: pick garrison size */}
                {option.id === 'RECRUIT_CAP' && !isLocked && (
                  <div className="flex gap-2 mb-3">
                    {['small', 'medium', 'large'].map(size => (
                      <button
                        key={size}
                        onClick={() => setGarrisonSize(size)}
                        className={`px-4 py-1 border text-[9px] font-bold uppercase tracking-widest transition-all
                          ${garrisonSize === size
                            ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]'
                            : 'border-[#8b8574]/20 text-[#8b8574] hover:border-[#8b8574]/60 hover:text-[#dfd4ba]'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  disabled={!canChoose}
                  onClick={() => handleChoose(option.id)}
                  className={`w-full py-2 border text-[9px] font-black uppercase tracking-[0.3em] transition-all
                    ${!canChoose
                      ? 'border-[#8b8574]/10 text-[#8b8574]/30 cursor-not-allowed'
                      : 'border-[#b84235] text-[#dfd4ba] hover:bg-[#b84235]/20 cursor-pointer'
                    }`}
                >
                  Choose
                </button>
              </div>
            );
          })}
        </div>

        {/* Leave */}
        <div className="px-8 pb-6">
          <button
            onClick={onLeave}
            className="w-full py-3 border border-[#8b8574]/30 text-xs font-black uppercase tracking-[0.3em] text-[#8b8574] hover:text-[#dfd4ba] hover:border-[#8b8574] transition-all"
          >
            Move On
          </button>
        </div>

      </div>
    </div>
  );
}
