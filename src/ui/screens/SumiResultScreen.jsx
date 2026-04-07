import React from 'react';

export function SumiResultScreen({ data, onClose }) {
  if (!data) return null;

  const isWin = data.type === 'battle_win';
  const isLoss = data.type === 'battle_loss';
  const isEvent = data.type === 'event';
  const isShop = data.type === 'shop';

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

  return (
    <div className="fixed inset-0 z-[100] parchment-bg animate-stamp flex justify-center items-center pointer-events-auto transition-opacity duration-500 border-[16px] border-[#1a1818]/90 overflow-hidden"
         style={{ borderImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2,2 L98,4 L96,96 L4,98 Z' fill='none' stroke='%231a1818' stroke-width='4' stroke-linejoin='round'/%3E%3C/svg%3E") 10 stretch` }}>
        
        {/* Massive Background Kanji Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[35rem] md:text-[50rem] font-serif font-black text-[#1a1818] opacity-[0.03] pointer-events-none select-none flex items-center justify-center w-full h-full ink-multiply">
          {theme.kanji}
        </div>

        {/* Ambient Glow Based on Result */}
        <div className={`absolute top-0 left-0 w-full h-80 bg-gradient-to-b ${theme.bgElement} to-transparent opacity-60 pointer-events-none mix-blend-color-burn`} />

        {/* Inner Content Layout - Constrained to max-w-5xl, but height is full and flexible */}
        <div className="relative z-10 w-full max-w-6xl h-full flex flex-col items-center justify-center px-6 py-8 md:px-12 md:py-12">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8 md:mb-12 w-full relative animate-ink-bleed shrink-0">
            {data.time && (
              <div className="absolute top-0 right-0 md:right-8 flex flex-col items-end opacity-80">
                <span className="text-[10px] text-[#5c554b] uppercase tracking-[0.3em] font-bold mb-1">Time Elapsed</span>
                <div className="bg-[#1a1818] text-[#eaddcf] px-4 py-2 font-mono text-xl font-bold tracking-widest shadow-lg transform rotate-1">
                  {data.time}
                </div>
              </div>
            )}
            
            <h2 className={`text-6xl md:text-8xl font-black uppercase tracking-[0.2em] font-serif mb-4 text-center ${theme.color} ink-multiply`}
                style={{ textShadow: `0 10px 30px ${theme.glow}, 0 2px 4px rgba(0,0,0,0.5)` }}>
              {data.title}
            </h2>
            
            {/* Brush Stroke Separator */}
            <div className="w-full max-w-3xl h-6 relative mt-2 md:mt-4 opacity-80 ink-multiply">
               <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full text-[#1a1818] fill-current">
                 <path d="M0,12 C15,8 35,16 50,11 C70,5 85,15 100,10 C100,10 90,16 50,15 C20,14 0,12 0,12 Z" />
                 <path d="M5,10 C25,12 45,5 60,10 C75,15 95,8 100,12 C100,12 70,16 50,14 C25,12 5,10 5,10 Z" opacity="0.6"/>
               </svg>
            </div>
          </div>

          <div className={`flex flex-col lg:flex-row w-full gap-8 md:gap-16 ${data.stats ? 'justify-center' : 'justify-center max-w-3xl items-center text-center'} flex-1 min-h-0`}>
            
            {/* Stats Panel (Battles) */}
            {data.stats && (
              <div className="flex-1 flex flex-col animate-ink-bleed delay-1 relative w-full lg:w-auto">
                {/* Decorative border */}
                <div className="absolute -left-6 top-0 bottom-0 w-[2px] bg-[#1a1818]/20" />
                <div className="absolute -left-[27px] top-4 text-[#1a1818]/40 text-sm rotate-90 origin-left tracking-[0.6em] font-serif uppercase">Records</div>
                
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[0.3em] text-[#1a1818] mb-8 ink-multiply text-left">Battle Report</h3>
                
                <div className="grid grid-cols-2 gap-y-8 gap-x-6 text-left">
                  <StatStamp label="Waves" value={`${data.stats.wavesConquered}/${data.stats.totalWaves}`} />
                  <StatStamp label="Damage" value={data.stats.damageDealt.toLocaleString()} />
                  
                  <div className="col-span-2 mt-2 md:mt-4 bg-[#1a1818]/[0.03] p-5 border border-[#1a1818]/10 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#1a1818]/20" />
                    <span className="block text-sm text-[#5c554b] uppercase tracking-[0.3em] font-bold mb-4">
                      Enemies Slain <span className="text-[#1a1818] ml-2 font-black">({data.stats.enemiesSlain.total})</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      {data.stats.enemiesSlain.types.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center group border-b border-[#1a1818]/5 pb-1">
                          <span className="text-base font-bold text-[#1a1818]/80 font-serif tracking-wider relative">
                            {t.name}
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1a1818]/30 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                          </span>
                          <span className="text-xl font-mono font-black text-[#1a1818]">{t.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resources / Impacts Panel */}
            <div className={`flex-1 flex flex-col gap-8 md:gap-10 animate-ink-bleed ${data.stats ? 'delay-2' : 'delay-1'} relative min-h-0 w-full lg:w-auto`}>
              {data.stats && <div className="hidden lg:block absolute -left-8 top-0 bottom-0 w-[2px] bg-[#1a1818]/10" />}

              {data.resources && data.resources.length > 0 && (
                <div className="flex flex-col relative">
                  <h3 className={`text-2xl md:text-3xl font-black uppercase tracking-[0.3em] text-[#1a1818] mb-8 ink-multiply ${data.stats ? 'text-left' : 'text-center'}`}>Spoils & Tolls</h3>
                  <div className={`flex flex-col gap-6 ${data.stats ? '' : 'max-w-md mx-auto w-full'}`}>
                    {data.resources.map((res, i) => (
                      <div key={i} className={`flex justify-between items-end border-b-2 border-[#1a1818]/10 pb-2 ${data.stats ? '' : 'px-4'}`}>
                        <span className="text-lg font-bold text-[#1a1818]/80 uppercase tracking-widest font-serif">{res.name}</span>
                        <span className={`text-4xl font-black font-mono tracking-tighter ${res.color} drop-shadow-md`}>{res.change}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.impacts && data.impacts.length > 0 && (
                <div className={`flex flex-col relative bg-[#1a1818]/5 p-6 md:p-8 border-l-4 shadow-inner ${data.stats ? 'text-left' : 'text-center items-center max-w-xl mx-auto'}`} style={{ borderColor: theme.accent }}>
                  <h3 className="text-xl font-bold uppercase tracking-[0.3em] mb-4 ink-multiply" style={{ color: theme.accent }}>Fate's Decree</h3>
                  <div className="flex flex-col gap-5">
                    {data.impacts.map((imp, i) => (
                      <p key={i} className={`text-lg md:text-xl italic font-serif leading-relaxed ${imp.color} drop-shadow-sm`}>
                        "{imp.description}"
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-16 md:mt-24 w-full flex justify-center animate-ink-bleed delay-3 shrink-0">
            <button 
              onClick={onClose}
              className="group relative px-12 py-4 bg-transparent overflow-hidden transition-all duration-500 focus:outline-none cursor-pointer"
            >
              {/* Painted Button Border */}
              <svg className="absolute inset-0 w-full h-full text-[#1a1818]" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M2,2 L98,5 L95,95 L5,98 Z" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:stroke-[6px] transition-all duration-300"/>
              </svg>
              
              {/* Ink fill on hover */}
              <div className="absolute inset-0 bg-[#1a1818] scale-y-0 origin-bottom transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-y-100" />
              
              <span className="relative z-10 text-3xl font-black uppercase tracking-[0.4em] text-[#1a1818] group-hover:text-[#eaddcf] transition-colors duration-300">
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
       <span className="text-xs md:text-sm text-[#5c554b] uppercase tracking-[0.2em] font-bold mb-2">{label}</span>
       <div className="inline-block self-start relative">
          <span className="relative z-10 text-5xl md:text-6xl font-black font-mono text-[#1a1818] tracking-tighter mix-blend-multiply drop-shadow-sm flex">
            {value}
          </span>
       </div>
    </div>
  );
}
