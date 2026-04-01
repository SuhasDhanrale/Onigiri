import React from 'react';

/**
 * EventModal — overlay on HubTestScreen for event nodes.
 * Props:
 *   event       — { id, name, text, choices: [{ id, label, cost, risk }] }
 *   runState    — current run state (for context display)
 *   onChoice    — (choiceId) => void
 *   onClose     — () => void  (ESC / X button)
 */
export function EventModal({ event, runState, onChoice, onClose }) {
  if (!event) return null;

  return (
    <div
      className="absolute inset-0 z-[300] flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-[540px] max-h-[85vh] bg-[#0a0908] border border-[#d4af37]/40 shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-[fade-in_0.2s_ease-out]">

        {/* Header */}
        <div className="border-b border-[#d4af37]/20 px-8 py-5 flex justify-between items-center shrink-0">
          <div>
            <p className="text-[9px] font-bold text-[#b84235] tracking-[0.4em] uppercase mb-1">
              Mystery Event
            </p>
            <h2 className="text-xl font-black tracking-[0.2em] uppercase text-[#dfd4ba]">
              {event.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-[#8b8574]/30 text-[#8b8574] hover:text-[#dfd4ba] hover:border-[#8b8574] transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Event flavour text */}
        <div className="px-8 py-6 border-b border-[#d4af37]/10 shrink-0">
          <p className="text-sm font-sans leading-relaxed text-[#dfd4ba]/75 italic">
            {event.text}
          </p>
        </div>

        {/* Choices */}
        <div className="px-8 py-6 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
          {event.choices.map(choice => {
            const isCombatRisk = choice.risk === 'combat';
            const isGamble     = choice.risk === 'gamble_small' || choice.risk === 'gamble_large';

            return (
              <button
                key={choice.id}
                onClick={() => onChoice(choice.id)}
                className={`w-full text-left px-5 py-3 border transition-all group
                  ${isCombatRisk
                    ? 'border-[#b84235]/50 bg-[#1a0f0e] hover:border-[#b84235] hover:bg-[#b84235]/10'
                    : isGamble
                      ? 'border-[#d4af37]/30 bg-[#141211] hover:border-[#d4af37]/70 hover:bg-[#d4af37]/5'
                      : 'border-[#8b8574]/25 bg-[#141211] hover:border-[#8b8574]/70 hover:bg-[#1a1816]'
                  }`}
              >
                <span className={`text-xs font-bold uppercase tracking-[0.15em] transition-colors
                  ${isCombatRisk
                    ? 'text-[#b84235] group-hover:text-[#dfd4ba]'
                    : 'text-[#dfd4ba]/75 group-hover:text-[#dfd4ba]'
                  }`}
                >
                  {choice.label}
                </span>
                {isCombatRisk && (
                  <span className="ml-3 text-[8px] font-bold text-[#b84235]/70 uppercase tracking-widest">
                    — Triggers Combat
                  </span>
                )}
                {isGamble && (
                  <span className="ml-3 text-[8px] font-bold text-[#d4af37]/60 uppercase tracking-widest">
                    — Gamble
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
