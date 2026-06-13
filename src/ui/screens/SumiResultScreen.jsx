import React from 'react';

export function SumiResultScreen({ data, onClose }) {
  if (!data) return null;

  const isWin = data.type === 'battle_win';
  const isLoss = data.type === 'battle_loss';
  const isEvent = data.type === 'event';
  const isShop = data.type === 'shop';
  const isRest = data.type === 'rest';

  let theme = {
    color: 'text-[#1a1818]',
    accent: '#1a1818',
    glow: 'rgba(26, 24, 24, 0.3)',
    kanji: '結', // Default: Conclusion
    bgElement: 'from-[#1a1818]/10'
  };

  if (isWin) theme = { color: 'text-[#d4af37]', accent: '#d4af37', glow: 'rgba(212, 175, 55, 0.4)', kanji: '勝', bgElement: 'from-[#d4af37]/20' };
  if (isLoss) theme = { color: 'text-[#b84235]', accent: '#b84235', glow: 'rgba(184, 66, 53, 0.4)', kanji: '敗', bgElement: 'from-[#b84235]/20' };
  if (isShop) theme = { color: 'text-[#4a5d23]', accent: '#4a5d23', glow: 'rgba(74, 93, 35, 0.4)', kanji: '商', bgElement: 'from-[#4a5d23]/20' };
  if (isEvent) theme = { color: 'text-[#483d8b]', accent: '#483d8b', glow: 'rgba(72, 61, 139, 0.4)', kanji: '運', bgElement: 'from-[#483d8b]/20' };
  if (isRest) theme = { color: 'text-[#2b3d60]', accent: '#2b3d60', glow: 'rgba(43, 61, 96, 0.4)', kanji: '休', bgElement: 'from-[#2b3d60]/20' };

  return (
    <div className="fixed inset-0 z-[100] parchment-bg animate-stamp flex justify-center items-center pointer-events-auto transition-opacity duration-500 border-[10px] md:border-[12px] border-[#1a1818]/90 overflow-hidden"
         style={{ borderImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2,2 L98,4 L96,96 L4,98 Z' fill='none' stroke='%231a1818' stroke-width='4' stroke-linejoin='round'/%3E%3C/svg%3E") 10 stretch` }}>
        
        {/* Massive Background Kanji Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[24rem] md:text-[34rem] font-serif font-black text-[#1a1818] opacity-[0.03] pointer-events-none select-none flex items-center justify-center w-full h-full ink-multiply">
          {theme.kanji}
        </div>

        {/* Ambient Glow Based on Result */}
        <div className={`absolute top-0 left-0 w-full h-80 bg-gradient-to-b ${theme.bgElement} to-transparent opacity-60 pointer-events-none mix-blend-color-burn`} />

        <div className="relative z-10 grid h-full w-full max-w-6xl grid-rows-[auto_minmax(0,1fr)_auto] px-4 py-4 md:px-8 md:py-6">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-3 md:mb-4 w-full relative animate-ink-bleed shrink-0">
            {data.time && (
              <div className="absolute top-0 right-0 flex flex-col items-end opacity-80">
                <span className="text-[8px] md:text-[9px] text-[#5c554b] uppercase tracking-[0.22em] font-bold mb-1">Time</span>
                <div className="bg-[#1a1818] text-[#eaddcf] px-3 py-1.5 font-mono text-base md:text-lg font-bold tracking-widest shadow-lg transform rotate-1">
                  {data.time}
                </div>
              </div>
            )}
            
            <h2 className={`text-5xl md:text-7xl font-black uppercase tracking-[0.12em] md:tracking-[0.18em] font-serif mb-1 text-center ${theme.color} ink-multiply`}
                style={{ textShadow: `0 10px 30px ${theme.glow}, 0 2px 4px rgba(0,0,0,0.5)` }}>
              {data.title}
            </h2>
            
            {/* Brush Stroke Separator */}
            <div className="w-full max-w-3xl h-4 relative mt-1 opacity-80 ink-multiply">
               <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full text-[#1a1818] fill-current">
                 <path d="M0,12 C15,8 35,16 50,11 C70,5 85,15 100,10 C100,10 90,16 50,15 C20,14 0,12 0,12 Z" />
                 <path d="M5,10 C25,12 45,5 60,10 C75,15 95,8 100,12 C100,12 70,16 50,14 C25,12 5,10 5,10 Z" opacity="0.6"/>
               </svg>
            </div>
          </div>

          <div className={`flex min-h-0 w-full flex-col overflow-hidden md:flex-row gap-4 md:gap-8 ${data.stats ? 'justify-center' : 'justify-center max-w-3xl items-center text-center mx-auto'}`}>
            
            {/* Stats Panel (Battles) */}
            {data.stats && (
              <div className="flex-1 flex flex-col animate-ink-bleed delay-1 relative w-full md:w-auto min-h-0">
                {/* Decorative border */}
                <div className="hidden md:block absolute -left-4 top-0 bottom-0 w-[2px] bg-[#1a1818]/20" />
                <div className="hidden md:block absolute -left-[19px] top-4 text-[#1a1818]/40 text-[10px] rotate-90 origin-left tracking-[0.45em] font-serif uppercase">Records</div>
                
                <h3 className="text-lg md:text-xl font-black uppercase tracking-[0.22em] text-[#1a1818] mb-3 ink-multiply text-left">Battle Report</h3>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-5 text-left min-h-0">
                  <StatStamp label="Waves" value={`${data.stats.wavesConquered}/${data.stats.totalWaves}`} />
                  <StatStamp label="Damage" value={data.stats.damageDealt.toLocaleString()} />
                  
                  <div className="col-span-2 bg-[#1a1818]/[0.03] p-3 border border-[#1a1818]/10 relative min-h-0">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#1a1818]/20" />
                    <span className="block text-[11px] text-[#5c554b] uppercase tracking-[0.22em] font-bold mb-2">
                      Enemies Slain <span className="text-[#1a1818] ml-2 font-black">({data.stats.enemiesSlain.total})</span>
                    </span>
                    <div className="grid max-h-[96px] grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 overflow-y-auto pr-1">
                      {data.stats.enemiesSlain.types.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center group border-b border-[#1a1818]/5 pb-1">
                          <span className="text-sm font-bold text-[#1a1818]/80 font-serif tracking-wide relative">
                            {t.name}
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1a1818]/30 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                          </span>
                          <span className="text-base font-mono font-black text-[#1a1818]">{t.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resources / Impacts Panel */}
            <div className={`flex-1 flex flex-col gap-4 animate-ink-bleed ${data.stats ? 'delay-2' : 'delay-1'} relative min-h-0 w-full md:w-auto overflow-hidden`}>
              {data.stats && <div className="hidden md:block absolute -left-4 top-0 bottom-0 w-[2px] bg-[#1a1818]/10" />}

              {data.resources && data.resources.length > 0 && (
                <div className="flex flex-col relative">
                  <h3 className={`text-lg md:text-xl font-black uppercase tracking-[0.22em] text-[#1a1818] mb-3 ink-multiply ${data.stats ? 'text-left' : 'text-center'}`}>Spoils & Tolls</h3>
                  <div className={`flex flex-col gap-3 ${data.stats ? '' : 'max-w-md mx-auto w-full'}`}>
                    {data.resources.map((res, i) => (
                      <div key={i} className={`flex justify-between items-end border-b-2 border-[#1a1818]/10 pb-1 ${data.stats ? '' : 'px-4'}`}>
                        <span className="text-sm font-bold text-[#1a1818]/80 uppercase tracking-widest font-serif">{res.name}</span>
                        <span className={`text-2xl md:text-3xl font-black font-mono tracking-tighter ${res.color} drop-shadow-md`}>{res.change}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.impacts && data.impacts.length > 0 && (
                <div className={`flex flex-col relative bg-[#1a1818]/5 p-4 border-l-4 shadow-inner overflow-y-auto ${data.stats ? 'text-left' : 'text-center items-center max-w-xl mx-auto'}`} style={{ borderColor: theme.accent }}>
                  <h3 className="text-base font-bold uppercase tracking-[0.24em] mb-2 ink-multiply" style={{ color: theme.accent }}>Fate's Decree</h3>
                  <div className="flex flex-col gap-3">
                    {data.impacts.map((imp, i) => (
                      <p key={i} className={`text-base italic font-serif leading-relaxed ${imp.color} drop-shadow-sm`}>
                        "{imp.description}"
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-3 md:mt-4 w-full flex justify-center animate-ink-bleed delay-3 shrink-0">
            <button 
              onClick={onClose}
              className="group relative px-8 md:px-10 py-2.5 bg-transparent overflow-hidden transition-all duration-500 focus:outline-none cursor-pointer"
            >
              {/* Painted Button Border */}
              <svg className="absolute inset-0 w-full h-full text-[#1a1818]" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M2,2 L98,5 L95,95 L5,98 Z" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:stroke-[6px] transition-all duration-300"/>
              </svg>
              
              {/* Ink fill on hover */}
              <div className="absolute inset-0 bg-[#1a1818] scale-y-0 origin-bottom transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-y-100" />
              
              <span className="relative z-10 text-xl md:text-2xl font-black uppercase tracking-[0.28em] text-[#1a1818] group-hover:text-[#eaddcf] transition-colors duration-300">
                Continue
              </span>
            </button>
          </div>
          
        </div>
      </div>
  );
}

// Sub-component for heavily stylized stat numbers
function StatStamp({ label, value }) {
  return (
    <div className="flex flex-col">
       <span className="text-[10px] md:text-xs text-[#5c554b] uppercase tracking-[0.18em] font-bold mb-1">{label}</span>
       <div className="inline-block self-start relative">
          <span className="relative z-10 text-4xl md:text-5xl font-black font-mono text-[#1a1818] tracking-tighter mix-blend-multiply drop-shadow-sm flex">
            {value}
          </span>
       </div>
    </div>
  );
}
