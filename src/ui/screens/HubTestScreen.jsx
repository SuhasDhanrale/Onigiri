import React, { useState } from 'react';

export function HubTestScreen() {
  const [activeHeirloom, setActiveHeirloom] = useState('DEMON_MASK');
  const [hoveredTech, setHoveredTech] = useState(null);

  // Mock data for display
  const techs = {
    ROOT: { name: 'Path of the Shogun', cost: 0, unlocked: true },
    SPIKED_CALTROPS: { name: 'Spiked Caltrops', desc: 'Barricades reflect 50% melee dmg.', cost: 15, unlocked: true },
    FLAMING_ARROWS: { name: 'Flaming Arrows', desc: 'Archers 25% ignite chance.', cost: 25, unlocked: false },
    TAKEDA_CHARGE: { name: 'Takeda Charge', desc: 'Cavalry 2s massive speed.', cost: 30, unlocked: false }
  };

  const heirlooms = [
    { id: 'DEMON_MASK', name: 'Demon Mask', desc: '+200% DMG, -50% Max HP', icon: '👹' },
    { id: 'IMPERIAL_BANNER', name: 'Imperial Banner', desc: 'Double Squad Caps', icon: '🎌' },
    { id: 'BLOOD_KATANA', name: 'Blood Katana', desc: 'Taps grant extreme Koku', icon: '🗡️' },
    { id: 'EMPTY_1', name: 'Locked', desc: 'Requires 50 Honor', icon: '' },
    { id: 'EMPTY_2', name: 'Locked', desc: 'Requires 100 Honor', icon: '' },
    { id: 'EMPTY_3', name: 'Locked', desc: 'Requires 150 Honor', icon: '' }
  ];

  const mapNodes = [
    { id: 1, name: 'Riverlands', threat: 1, waves: 10, reward: '+ YUMI ARCHERS', status: 'completed' },
    { id: 2, name: 'Outskirts', threat: 2, waves: 15, reward: '25 HONOR', status: 'active' },
    { id: 3, name: 'Iron Mines', threat: 3, waves: 20, reward: '+ TEPPO MATCHLOCKS', status: 'locked' },
    { id: 4, name: 'Tengu Peaks', threat: 4, waves: 25, reward: '50 HONOR', status: 'locked' },
    { id: 5, name: 'Ashura Valley', threat: 5, waves: 35, reward: '+ CAVALRY', status: 'locked' },
    { id: 6, name: 'Crimson Plains', threat: 5, waves: 40, reward: '100 HONOR', status: 'locked' },
    { id: 7, name: 'The Abyss', threat: 6, waves: 50, reward: 'DYNASTY VICTORY', status: 'boss' },
  ];

  return (
    <div className="absolute inset-0 bg-[#0a0908] z-[200] flex flex-col font-serif select-none overflow-hidden text-[#dfd4ba]">
        
        {/* ATMOSPHERIC BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#b84235] rounded-full blur-[150px] opacity-10" />
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_#0a0908_120%)] opacity-80" />
        </div>

        {/* TOP HEADER: Premium Glassmorphism */}
        <div className="relative z-10 w-full flex justify-between items-center px-12 py-6 bg-[#0a0908]/60 backdrop-blur-md border-b border-[#d4af37]/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
           <div className="flex flex-col">
              <span className="text-[9px] font-bold tracking-[0.4em] text-[#b84235] uppercase mb-1 flex items-center gap-2">
                 <span className="w-4 h-[1px] bg-[#b84235]" /> Stronghold Hub
              </span>
              <h1 className="text-4xl text-[#dfd4ba] font-black tracking-[0.2em] uppercase text-shadow-sm" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                 Imperial Capital
              </h1>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex flex-col text-right">
                  <span className="font-bold text-[9px] tracking-[0.3em] uppercase text-[#8b8574]">Ancestral Honor</span>
                  <div className="flex items-baseline gap-1 justify-end">
                      <span className="text-4xl font-black text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">1,250</span>
                      <span className="text-sm text-[#d4af37]/60">H</span>
                  </div>
              </div>
           </div>
        </div>

        {/* MAIN SPATIAL IA */}
        <div className="relative z-10 flex-1 flex px-10 py-8 gap-8 items-stretch h-0"> {/* h-0 forces children to scroll */}
            
            {/* PILLAR 1: THE DOJO (Techs) */}
            <div className="flex-[1] bg-[#141211]/80 backdrop-blur-sm border border-[#d4af37]/10 p-6 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm relative group hover:border-[#d4af37]/30 transition-colors duration-500">
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#d4af37]/40 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#d4af37]/40 pointer-events-none" />
                
                <div className="mb-6 text-center shrink-0">
                    <h2 className="text-2xl font-black text-[#dfd4ba] tracking-[0.2em] uppercase">The Dojo</h2>
                    <p className="text-[9px] font-bold text-[#b84235] tracking-[0.3em] mt-2 uppercase">Permanent Techniques</p>
                    <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent mx-auto mt-4" />
                </div>
                
                <div className="flex-1 relative flex flex-col items-center justify-start pt-4 mt-2">
                    <div className="absolute inset-0 bg-[#0a0908]/50 border border-[#d4af37]/5 rounded-sm" style={{ backgroundImage: 'linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                        <line x1="50%" y1="15%" x2="50%" y2="55%" stroke="#d4af37" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="25%" y1="55%" x2="75%" y2="55%" stroke="#d4af37" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="25%" y1="55%" x2="25%" y2="60%" stroke="#d4af37" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="75%" y1="55%" x2="75%" y2="60%" stroke="#d4af37" strokeWidth="1" strokeDasharray="4 4" />
                    </svg>

                    <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-b from-[#b84235] to-[#4a1005] border-2 border-[#d4af37] flex items-center justify-center mb-[20%] shadow-[0_0_20px_rgba(184,66,53,0.5)]">
                        <span className="text-2xl drop-shadow-lg">🏯</span>
                    </div>

                    <div className="flex w-full justify-between px-8 relative z-10">
                        <div 
                          className="w-14 h-14 rounded-full bg-[#141211] border border-[#d4af37]/40 flex items-center justify-center cursor-pointer hover:border-[#d4af37] hover:bg-[#d4af37]/10 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all"
                          onMouseEnter={() => setHoveredTech('FLAMING_ARROWS')}
                          onMouseLeave={() => setHoveredTech(null)}
                        >
                            <span className="text-xl grayscale">🏹</span>
                        </div>
                        <div 
                          className="w-14 h-14 rounded-full bg-gradient-to-b from-[#2b3d60] to-[#0f1b33] border border-[#d4af37] flex items-center justify-center cursor-pointer hover:shadow-[0_0_20px_rgba(43,61,96,0.8)] hover:scale-105 transition-all"
                          onMouseEnter={() => setHoveredTech('SPIKED_CALTROPS')}
                          onMouseLeave={() => setHoveredTech(null)}
                        >
                            <span className="text-xl">🛡️</span>
                        </div>
                        <div 
                           className="w-14 h-14 rounded-full bg-[#141211] border border-[#d4af37]/40 flex items-center justify-center cursor-pointer hover:border-[#d4af37] hover:bg-[#d4af37]/10 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all"
                           onMouseEnter={() => setHoveredTech('TAKEDA_CHARGE')}
                           onMouseLeave={() => setHoveredTech(null)}
                        >
                            <span className="text-xl grayscale">🐎</span>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-[#0a0908] to-transparent border-t border-[#d4af37]/10 flex flex-col justify-end min-h-[140px]">
                        {hoveredTech ? (
                            <div className="animate-[fade-in_0.2s_ease-out]">
                               <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-black tracking-[0.1em] uppercase text-sm text-[#d4af37]">{techs[hoveredTech].name}</h4>
                                  <span className="text-[#8b8574] text-[10px] uppercase font-bold px-2 py-0.5 border border-[#8b8574]/30">{techs[hoveredTech].unlocked ? 'UNLOCKED' : `${techs[hoveredTech].cost} Honor`}</span>
                               </div>
                               <p className="text-xs font-sans leading-relaxed text-[#dfd4ba]/70">{techs[hoveredTech].desc}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center opacity-30 my-4">
                                <div className="w-1 h-1 rounded-full bg-[#d4af37] mb-2 animate-ping" />
                                <p className="text-[9px] font-bold uppercase tracking-[0.3em]">Hover node to inspect</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PILLAR 2: THE CONQUEST GATE (Timeline Layout) */}
            <div className="flex-[1.8] bg-[#0f0d0c]/80 backdrop-blur-md border border-[#b84235]/30 flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,1)] rounded-sm overflow-hidden">
                
                {/* Visual Header */}
                <div className="relative z-20 text-center py-6 bg-gradient-to-b from-[#141211] to-transparent shrink-0">
                    <h2 className="text-4xl font-black text-[#dfd4ba] tracking-[0.4em] uppercase text-shadow-glow drop-shadow-[0_5px_15px_rgba(0,0,0,1)]">
                        Conquest
                    </h2>
                    <p className="text-[#b84235] text-[10px] uppercase font-bold tracking-[0.3em] mt-2">The Blood-Stained Lands</p>
                    <div className="absolute bottom-0 left-[10%] w-[80%] h-[1px] bg-gradient-to-r from-transparent via-[#b84235]/40 to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 w-full h-[60%] bg-[radial-gradient(ellipse_at_bottom,_#b84235_0%,_transparent_60%)] opacity-10 pointer-events-none" />
                
                {/* Scrollable Timeline */}
                <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-8">
                    {/* The continuous vertical line */}
                    <div className="absolute top-8 bottom-8 left-[39px] w-[2px] bg-gradient-to-b from-[#d4af37]/50 via-[#b84235]/50 to-[#2b3d60]/50" />
                    
                    <div className="flex flex-col gap-8 relative z-10 w-full pl-2">
                        {mapNodes.map((node, index) => {
                            const isBoss = node.status === 'boss';
                            const isActive = node.status === 'active';
                            const isCompleted = node.status === 'completed';
                            
                            return (
                                <div key={node.id} className="flex flex-row items-stretch gap-6 group cursor-pointer w-[90%] mx-auto">
                                    
                                    {/* Timeline Node Icon */}
                                    <div className="relative flex flex-col items-center justify-start shrink-0">
                                        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 relative
                                            ${isActive ? 'bg-[#1a0f0e] border-[#b84235] shadow-[0_0_25px_rgba(184,66,53,0.6)] scale-110' : 
                                              isBoss ? 'bg-[#0a0908] border-[#dfd4ba] shadow-[0_0_30px_rgba(255,255,255,0.2)] rotate-45 rounded-sm' :
                                              isCompleted ? 'bg-[#2b3d60]/40 border-[#d4af37]' :
                                              'bg-[#0a0908] border-[#8b8574]/50'
                                            }`}
                                        >
                                            {isActive && <div className="absolute inset-[-6px] rounded-full border border-[#b84235]/50 animate-ping opacity-50" />}
                                            <span className={`text-2xl drop-shadow-md ${isBoss ? '-rotate-45' : ''}`}>
                                                {isBoss ? '👹' : isCompleted ? '✅' : '⚔️'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Timeline Details Card */}
                                    <div className={`flex-1 flex flex-col justify-center border p-4 transition-all duration-300
                                            ${isActive ? 'bg-[#1a0f0e]/80 border-[#b84235]/40 shadow-lg translate-x-2' : 
                                              isBoss ? 'bg-[#110d11]/80 border-[#dfd4ba]/20 hover:border-[#dfd4ba]/50' :
                                              isCompleted ? 'bg-[#141211]/40 border-[#d4af37]/20 opacity-60' :
                                              'bg-[#141211]/80 border-[#8b8574]/20 hover:border-[#8b8574]/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h3 className={`text-lg font-black tracking-widest uppercase ${isBoss ? 'text-[#dfd4ba]' : isActive ? 'text-white' : 'text-[#dfd4ba]/80'}`}>
                                                {node.name}
                                            </h3>
                                            <span className="text-[10px] text-[#8b8574] font-bold uppercase tracking-widest border border-[#8b8574]/30 px-2 py-0.5 bg-[#0a0908]">
                                                {node.status}
                                            </span>
                                        </div>
                                        
                                        <div className="flex gap-6 text-[10px] font-bold text-[#8b8574] uppercase tracking-[0.2em] mb-3">
                                            <span className="flex items-center gap-1">Threat: <span className="text-[#b84235] text-xs">{'💀'.repeat(node.threat)}</span></span>
                                            <span className="flex items-center gap-1">Waves: <span className={`text-xs ${isActive ? 'text-white' : 'text-[#dfd4ba]'}`}>{node.waves}</span></span>
                                        </div>
                                        
                                        <div className={`text-[9px] px-3 py-1.5 uppercase tracking-widest w-max font-bold border mt-1
                                            ${isActive ? 'bg-[#b84235]/20 border-[#b84235]/40 text-[#dfd4ba]' : 
                                              isBoss ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]' :
                                              'bg-[#0a0908] border-[#8b8574]/20 text-[#8b8574]'
                                            }`}
                                        >
                                            Reward: {node.reward}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* PILLAR 3: THE SHRINE (Heirlooms) */}
            <div className="flex-[1] bg-[#141211]/80 backdrop-blur-sm border border-[#d4af37]/10 p-6 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm relative group hover:border-[#d4af37]/30 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#d4af37]/40 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-[#d4af37]/40 pointer-events-none" />
                
                <div className="mb-6 text-center shrink-0">
                    <h2 className="text-2xl font-black text-[#dfd4ba] tracking-[0.2em] uppercase">The Shrine</h2>
                    <p className="text-[9px] font-bold text-[#d4af37] tracking-[0.3em] mt-2 uppercase">Ancestral Vault</p>
                    <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent mx-auto mt-4" />
                </div>
                
                <div className="flex-1 flex flex-col gap-6 mt-2 relative z-10 overflow-hidden">
                    
                    {/* Active Slot */}
                    <div className="w-full relative p-[1px] bg-gradient-to-b from-[#d4af37]/50 to-transparent rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.8)] shrink-0">
                        <div className="bg-[#0a0908] p-5 flex items-center gap-5 w-full h-full rounded-sm">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#1a1816] to-[#0a0908] border border-[#d4af37]/30 flex items-center justify-center text-3xl shrink-0 shadow-inner [box-shadow:inset_0_0_20px_rgba(0,0,0,1)]">
                                {heirlooms.find(h => h.id === activeHeirloom)?.icon || '❓'}
                            </div>
                            
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <span className="text-[8px] text-[#8b8574] font-bold tracking-[0.3em] uppercase mb-1">Equipped Heirloom</span>
                                <span className="text-[#d4af37] font-black tracking-widest uppercase text-sm mb-1 truncate">{heirlooms.find(h => h.id === activeHeirloom)?.name || 'None'}</span>
                                <span className="text-[10px] text-[#dfd4ba]/60 font-sans leading-tight line-clamp-2">{heirlooms.find(h => h.id === activeHeirloom)?.desc}</span>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto custom-scrollbar content-start pb-4 pr-1">
                        {heirlooms.map(item => {
                            const isEmpty = item.id.startsWith('EMPTY');
                            const isActive = activeHeirloom === item.id;
                            
                            return (
                              <button 
                                  key={item.id}
                                  onClick={() => !isEmpty && setActiveHeirloom(item.id)}
                                  className={`aspect-square flex flex-col items-center justify-center relative p-2 transition-all duration-300
                                      ${isActive 
                                          ? 'border border-[#d4af37] bg-gradient-to-b from-[#d4af37]/10 to-transparent shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                                          : isEmpty 
                                            ? 'border border-[#8b8574]/10 bg-[#0a0908]/30 cursor-not-allowed opacity-50' 
                                            : 'border border-[#8b8574]/30 bg-[#1a1816]/50 hover:border-[#d4af37]/50 hover:bg-[#1a1816] cursor-pointer'
                                      }
                                  `}
                              >
                                  {isActive && <div className="absolute inset-0 bg-[#d4af37]/5 blur-md pointer-events-none" />}
                                  
                                  <span className={`text-2xl mb-2 drop-shadow-md ${isEmpty ? 'opacity-20 text-[#8b8574]' : ''}`}>{item.icon || '⬛'}</span>
                                  <span className="text-[8px] font-bold uppercase text-center tracking-[0.1em] text-[#dfd4ba]/80 leading-tight w-full truncate px-1">
                                      {item.name}
                                  </span>
                                  
                                  {isEmpty && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0908]/80 opacity-0 hover:opacity-100 transition-opacity p-2 text-center pointer-events-none">
                                      <span className="text-[8px] text-[#b84235] font-bold tracking-widest uppercase">{item.desc}</span>
                                    </div>
                                  )}
                              </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            
        </div>

        {/* BOTTOM FOOTER */}
        <div className="relative z-10 py-5 px-12 flex justify-between items-center bg-[#0a0908]/80 backdrop-blur-md border-t border-[#b84235]/30">
            <p className="text-[#8b8574]/60 text-[10px] font-bold uppercase tracking-[0.3em]">Dev Mode Active</p>
            
            <button className="relative group overflow-hidden shadow-[0_0_20px_rgba(184,66,53,0.3)]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#b84235] to-[#802a20] translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500" />
                <div className="relative z-10 px-16 py-4 border border-[#b84235] bg-[#1a0f0e] text-[#dfd4ba] text-xl uppercase tracking-[0.3em] font-black group-hover:text-white transition-colors group-hover:border-[#d4af37]">
                    Play
                </div>
            </button>
        </div>
        
    </div>
  );
}
