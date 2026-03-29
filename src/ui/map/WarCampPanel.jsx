import { HEIRLOOMS, PERMANENT_TECHS } from '../../config/progression.js';

export function WarCampPanel({ s, meta, setMeta, initRun, unlockHeirloom, equipHeirloom, unlockTech, resetDynasty }) {
  return (
    <div className="w-[340px] h-full bg-[var(--color-parchment)] border-r-4 border-[var(--color-ink-dark)] flex flex-col p-4 relative z-20 shadow-[10px_0_20px_rgba(0,0,0,0.3)]">
      <h2 className="text-3xl font-black text-[var(--color-ink-dark)] uppercase tracking-widest mb-1">War Camp</h2>
      <p className="text-[10px] font-bold tracking-widest text-[var(--color-khaki)] uppercase mb-4">Strategic Preparation</p>

      <div className="bg-[var(--color-ink-dark)] text-[#d4af37] px-4 py-3 mb-6 flex flex-col border-2 border-[#d4af37] shadow-md">
        <span className="font-bold text-[10px] tracking-[0.2em] uppercase text-[var(--color-khaki)]">Ancestral Honor</span>
        <span className="text-3xl font-black leading-none mt-1">{meta.honor} <span className="text-sm text-[var(--color-parchment)]">H</span></span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">
        <div>
          <div className="flex justify-between items-baseline border-b-2 border-[var(--color-ink-dark)] pb-1 mb-2">
            <h3 className="text-[var(--color-ink-dark)] font-black text-[10px] uppercase tracking-[0.2em]">Ancestral Vault</h3>
            <span className="text-[8px] font-bold text-[#b84235] uppercase">Equip Max: 1</span>
          </div>
          <div className="flex flex-col gap-2">
            {Object.entries(HEIRLOOMS).map(([key, h]) => {
              const isUnlocked = meta.unlockedHeirlooms.includes(key);
              const isEquipped = meta.equippedHeirloom === key;
              
              return (
                <div key={key} className={`p-2 border-2 transition-colors ${isEquipped ? 'bg-[#b84235] border-[var(--color-ink-dark)] text-[var(--color-parchment)]' : 'bg-[#e8e0cc] border-[#8b8574] text-[var(--color-ink-dark)]'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest">{h.name}</span>
                    {isUnlocked ? (
                      <button onClick={() => equipHeirloom(key)} className={`px-2 py-0.5 text-[8px] font-bold uppercase border-2 transition-colors ${isEquipped ? 'bg-[var(--color-ink)] border-[var(--color-ink-dark)] text-[var(--color-parchment)]' : 'bg-[var(--color-ink)] border-[var(--color-ink-dark)] text-[var(--color-parchment)] hover:bg-[var(--color-ink-light)]'}`}>
                        {isEquipped ? 'Equipped' : 'Equip'}
                      </button>
                    ) : (
                      <button onClick={() => unlockHeirloom(key, h.cost)} disabled={meta.honor < h.cost} className="px-2 py-0.5 text-[8px] font-bold uppercase border-2 border-[var(--color-ink-dark)] bg-[#d4af37] text-[var(--color-ink-dark)] disabled:opacity-50 disabled:grayscale hover:bg-[#b5952f] transition-colors">
                        Unlock ({h.cost} H)
                      </button>
                    )}
                  </div>
                  <p className="text-[8px] leading-tight font-bold opacity-90">{h.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="mt-2">
          <div className="flex justify-between items-baseline border-b-2 border-[var(--color-ink-dark)] pb-1 mb-2">
            <h3 className="text-[var(--color-ink-dark)] font-black text-[10px] uppercase tracking-[0.2em]">War Pavilion</h3>
            <span className="text-[8px] font-bold text-[#b84235] uppercase">Permanent Tech</span>
          </div>
          <div className="flex flex-col gap-2">
            {Object.entries(PERMANENT_TECHS).map(([key, t]) => {
              const isUnlocked = meta.unlockedTechs.includes(key);

              return (
                <div key={key} className={`p-2 border-2 transition-colors ${isUnlocked ? 'bg-[#2b3d60] border-[var(--color-ink-dark)] text-[var(--color-parchment)]' : 'bg-[#e8e0cc] border-[#8b8574] text-[var(--color-ink-dark)]'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest">{t.name}</span>
                    {isUnlocked ? (
                      <span className="px-2 py-0.5 text-[8px] font-bold uppercase text-[#d4af37]">Unlocked</span>
                    ) : (
                      <button onClick={() => unlockTech(key, t.cost)} disabled={meta.honor < t.cost} className="px-2 py-0.5 text-[8px] font-bold uppercase border-2 border-[var(--color-ink-dark)] bg-[#d4af37] text-[var(--color-ink-dark)] disabled:opacity-50 disabled:grayscale hover:bg-[#b5952f] transition-colors">
                        Unlock ({t.cost} H)
                      </button>
                    )}
                  </div>
                  <p className="text-[8px] leading-tight font-bold opacity-90">{t.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <button 
        onClick={resetDynasty} 
        className="mt-4 w-full py-3 bg-[var(--color-ink)] text-[var(--color-parchment)] text-[10px] font-black tracking-[0.2em] uppercase border-4 border-[#b84235] hover:bg-[#b84235] hover:text-[var(--color-ink-dark)] transition-colors flex justify-center items-center gap-2 group"
      >
        <span>End Dynasty (Reset)</span>
        {s.earnedHonor > 0 && <span className="bg-[#b84235] text-[var(--color-ink-dark)] px-1.5 py-0.5 rounded-sm group-hover:bg-[var(--color-ink-dark)] group-hover:text-[var(--color-parchment)]">+{s.earnedHonor} Honor</span>}
      </button>
    </div>
  );
}
