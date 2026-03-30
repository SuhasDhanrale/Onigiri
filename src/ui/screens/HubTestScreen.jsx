import React, { useState, useRef } from 'react';

export function HubTestScreen() {
  const [activeSidebarTab, setActiveSidebarTab] = useState('DOJO'); // 'DOJO' | 'SHRINE'
  const [activeHeirloom, setActiveHeirloom] = useState('DEMON_MASK');
  const [hoveredTech, setHoveredTech] = useState(null);
  const [hoveredMapNode, setHoveredMapNode] = useState(null);

  // Drag to scroll logic
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

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

  // Slay the spire mock data (Horizontal layout, Left to Right)
  // Adjusted Y coordinates to be lower (35-85) to avoid overlapping the header at the top
  const spireNodes = [
      // Tier 0 (Single Start Node)
      { id: 'START', name: 'Stronghold Gates', type: 'event', threat: 0, reward: 'DEPART', x: 8, y: 50, next: ['1A', '1B', '1C'], status: 'completed' },
      
      // Tier 1
      { id: '1A', name: 'Bandit Camp', type: 'combat', threat: 1, reward: '10 KOKU', x: 25, y: 15, next: ['2A'], status: 'completed' },
      { id: '1B', name: 'Riverlands', type: 'combat', threat: 1, reward: '25 HONOR', x: 25, y: 50, next: ['2A', '2B'], status: 'active' },
      { id: '1C', name: 'Outskirts', type: 'combat', threat: 2, reward: 'YUMI UNLOCK', x: 25, y: 85, next: ['2C'], status: 'locked' },
      // Tier 2
      { id: '2A', name: 'Merchant', type: 'shop', threat: 0, reward: 'SHOP', x: 42, y: 15, next: ['3A', '3B'], status: 'locked' },
      { id: '2B', name: 'Iron Mines', type: 'elite', threat: 4, reward: 'HEIRLOOM', x: 42, y: 50, next: ['3B'], status: 'locked' },
      { id: '2C', name: 'Abandoned Shrine', type: 'event', threat: 0, reward: 'MYSTERY', x: 42, y: 85, next: ['3C'], status: 'locked' },
      // Tier 3
      { id: '3A', name: 'Tengu Peaks', type: 'combat', threat: 3, reward: '50 HONOR', x: 59, y: 15, next: ['4A'], status: 'locked' },
      { id: '3B', name: 'Crimson Plains', type: 'combat', threat: 4, reward: 'CAVALRY', x: 59, y: 50, next: ['4A', '4B'], status: 'locked' },
      { id: '3C', name: 'Ashura Valley', type: 'elite', threat: 5, reward: 'RARE TECH', x: 59, y: 85, next: ['4B'], status: 'locked' },
      // Tier 4 (Pre-boss rest/event structure)
      { id: '4A', name: 'War Camp', type: 'rest', threat: 0, reward: 'HEAL', x: 76, y: 30, next: ['BOSS'], status: 'locked' },
      { id: '4B', name: 'Blood Forge', type: 'event', threat: 0, reward: 'UPGRADE', x: 76, y: 70, next: ['BOSS'], status: 'locked' },
      // Tier 5 (Boss) - Right
      { id: 'BOSS', name: 'The Shogun', type: 'boss', threat: 6, reward: 'DYNASTY VICTORY', x: 92, y: 50, next: [], status: 'boss' },
  ];

  // Helper to draw lines
  const getSvgLines = () => {
      let lines = [];
      spireNodes.forEach(node => {
          if (node.next && node.next.length > 0) {
              node.next.forEach(targetId => {
                  const target = spireNodes.find(n => n.id === targetId);
                  if (target) {
                      lines.push(
                          <line 
                              key={`${node.id}-${target.id}`}
                              x1={`${node.x}%`} 
                              y1={`${node.y}%`} 
                              x2={`${target.x}%`} 
                              y2={`${target.y}%`}
                              stroke="#b84235" 
                              strokeWidth={node.status === 'completed' || node.status === 'active' ? '4' : '2'} 
                              strokeDasharray={node.status === 'completed' || node.status === 'active' ? 'none' : '5 5'}
                              className={node.status === 'completed' || node.status === 'active' ? 'opacity-90' : 'opacity-40'}
                          />
                      );
                  }
              });
          }
      });
      return lines;
  };

  const getNodeIcon = (type) => {
      switch(type) {
          case 'combat': return '⚔️';
          case 'elite': return '💀';
          case 'event': return '❓';
          case 'shop': return '💰';
          case 'rest': return '⛺';
          case 'boss': return '👹';
          default: return '📍';
      }
  };

  return (
    <div className="absolute inset-0 bg-[#0a0908] z-[200] flex flex-col font-serif select-none overflow-hidden text-[#dfd4ba]">
        
        {/* ATMOSPHERIC BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#b84235] rounded-full blur-[150px] opacity-10" />
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_#0a0908_120%)] opacity-80" />
        </div>

        {/* TOP HEADER - Compressed */}
        <div className="relative z-10 w-full flex justify-between items-center px-12 py-3 bg-[#0a0908]/60 backdrop-blur-md border-b border-[#d4af37]/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] pointer-events-none">
           <div className="flex flex-col">
              <span className="text-[8px] font-bold tracking-[0.4em] text-[#b84235] uppercase mb-0.5 flex items-center gap-2">
                 <span className="w-3 h-[1px] bg-[#b84235]" /> Stronghold Hub
              </span>
              <h1 className="text-3xl text-[#dfd4ba] font-black tracking-[0.2em] uppercase text-shadow-sm" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                 Imperial Capital
              </h1>
           </div>
           
           <div className="flex items-center gap-6 pointer-events-auto">
              <div className="flex flex-col text-right">
                  <span className="font-bold text-[8px] tracking-[0.3em] uppercase text-[#8b8574]">Ancestral Honor</span>
                  <div className="flex items-baseline gap-1 justify-end">
                      <span className="text-3xl font-black text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">1,250</span>
                      <span className="text-xs text-[#d4af37]/60">H</span>
                  </div>
              </div>
           </div>
        </div>

        {/* MAIN SPATIAL IA - Optimized Padding */}
        <div className="relative z-10 flex-1 flex px-10 py-4 gap-8 items-stretch h-0">
            
            {/* LEFT PILLAR: TABBED META SIDEBAR */}
            <div className="w-[380px] shrink-0 bg-[#0a0908]/90 backdrop-blur-md border border-[#d4af37]/20 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-sm relative overflow-hidden z-20">
                
                {/* Tabs Header */}
                <div className="flex w-full border-b border-[#d4af37]/20 bg-[#141211]">
                    <button 
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.3em] transition-all duration-300 ${activeSidebarTab === 'DOJO' ? 'text-[#d4af37] bg-gradient-to-t from-[#d4af37]/10 to-transparent border-b-2 border-[#d4af37]' : 'text-[#8b8574] hover:text-[#dfd4ba] border-b-2 border-transparent'}`}
                        onClick={() => setActiveSidebarTab('DOJO')}
                    >
                        The Dojo
                    </button>
                    <button 
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.3em] transition-all duration-300 ${activeSidebarTab === 'SHRINE' ? 'text-[#d4af37] bg-gradient-to-t from-[#d4af37]/10 to-transparent border-b-2 border-[#d4af37]' : 'text-[#8b8574] hover:text-[#dfd4ba] border-b-2 border-transparent'}`}
                        onClick={() => setActiveSidebarTab('SHRINE')}
                    >
                        The Shrine
                    </button>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative flex flex-col">
                    
                    {activeSidebarTab === 'DOJO' && (
                        <div className="flex-1 flex flex-col animate-[fade-in_0.3s_ease-out]">
                            <div className="mb-6 text-center shrink-0">
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

                                <div className="flex w-full justify-between px-8 relative z-10 border border-transparent">
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
                                              <h4 className="font-black tracking-[0.1em] uppercase text-xs text-[#d4af37]">{techs[hoveredTech].name}</h4>
                                              <span className="text-[#8b8574] text-[8px] uppercase font-bold px-2 py-0.5 border border-[#8b8574]/30">{techs[hoveredTech].unlocked ? 'UNLOCKED' : `${techs[hoveredTech].cost} H`}</span>
                                           </div>
                                           <p className="text-xs font-sans leading-relaxed text-[#dfd4ba]/70">{techs[hoveredTech].desc}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center opacity-30 my-4">
                                            <div className="w-1 h-1 rounded-full bg-[#d4af37] mb-2 animate-ping" />
                                            <p className="text-[9px] font-bold uppercase tracking-[0.3em]">Hover node</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSidebarTab === 'SHRINE' && (
                        <div className="flex-1 flex flex-col animate-[fade-in_0.3s_ease-out]">
                            <div className="mb-6 text-center shrink-0">
                                <p className="text-[9px] font-bold text-[#d4af37] tracking-[0.3em] mt-2 uppercase">Ancestral Vault</p>
                                <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent mx-auto mt-4" />
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-6 mt-2 relative z-10 overflow-hidden">
                                {/* Active Slot */}
                                <div className="w-full relative p-[1px] bg-gradient-to-b from-[#d4af37]/50 to-transparent rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.8)] shrink-0">
                                    <div className="bg-[#0a0908] p-4 flex items-center gap-4 w-full h-full rounded-sm">
                                        <div className="w-14 h-14 bg-gradient-to-br from-[#1a1816] to-[#0a0908] border border-[#d4af37]/30 flex items-center justify-center text-2xl shrink-0 shadow-inner [box-shadow:inset_0_0_20px_rgba(0,0,0,1)]">
                                            {heirlooms.find(h => h.id === activeHeirloom)?.icon || '❓'}
                                        </div>
                                        <div className="flex flex-col flex-1 overflow-hidden">
                                            <span className="text-[8px] text-[#8b8574] font-bold tracking-[0.3em] uppercase mb-1">Equipped</span>
                                            <span className="text-[#d4af37] font-black tracking-widest uppercase text-[10px] mb-1 truncate">{heirlooms.find(h => h.id === activeHeirloom)?.name || 'None'}</span>
                                            <span className="text-[10px] text-[#dfd4ba]/60 font-sans leading-tight line-clamp-2">{heirlooms.find(h => h.id === activeHeirloom)?.desc}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Inventory Grid */}
                                <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar content-start pb-4 pr-1">
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
                                          </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PILLAR: CONQUEST (Slay the Spire Drag & SCROLL Branching Map) */}
            <div className="flex-[2.5] bg-[radial-gradient(ellipse_at_center,_#110b0a_0%,_#0a0808_100%)] border border-[#b84235]/30 flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,1)] rounded-sm overflow-hidden z-10">
                
                {/* Slay the Spire DRAGGABLE Scrolling Map Area */}
                <div 
                    ref={scrollRef}
                    className="relative z-10 flex-1 w-full overflow-x-auto overflow-y-hidden scroll-smooth active:cursor-grabbing cursor-grab"
                    style={{ scrollbarWidth: 'none', paddingTop: '20px', paddingBottom: '20px' }}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                >
                     <div className="relative h-full min-w-[1400px]">
                         {/* SVG Lines */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                             {getSvgLines()}
                         </svg>

                         {/* Render Interactive Nodes */}
                         {spireNodes.map(node => {
                             const isActive = node.status === 'active';
                             const isBoss = node.status === 'boss';
                             const isLocked = node.status === 'locked';
                             const isCompleted = node.status === 'completed';

                             return (
                                 <div 
                                     key={node.id}
                                     className="absolute translate-x-[-50%] translate-y-[-50%] flex flex-col items-center justify-center cursor-pointer z-10 group/node"
                                     style={{ left: `${node.x}%`, top: `${node.y}%` }}
                                     onMouseEnter={() => setHoveredMapNode(node)}
                                     onMouseLeave={() => setHoveredMapNode(null)}
                                 >
                                     <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative
                                            ${isActive ? 'bg-[#1a0f0e] border-[#b84235] shadow-[0_0_35px_rgba(184,66,53,0.9)] scale-110' : 
                                              isBoss ? 'bg-[#0a0908] border-[#dfd4ba] shadow-[0_0_60px_rgba(184,66,53,0.6)] scale-125' :
                                              isCompleted ? 'bg-[#1a0f0e]/80 border-[#d4af37]/80' :
                                              node.type === 'elite' ? 'bg-[#1a0f0e] border-[#8b8574] shadow-[0_0_20px_rgba(139,133,116,0.4)]' :
                                              'bg-[#0a0908] border-[#8b8574]/40 hover:border-[#8b8574]'
                                            }`}
                                     >
                                         {isActive && <div className="absolute inset-[-8px] rounded-full border border-[#b84235]/50 animate-ping opacity-50 pointer-events-none" />}
                                         <span className="text-4xl drop-shadow-md pointer-events-none">
                                             {isCompleted ? '✅' : getNodeIcon(node.type)}
                                         </span>
                                     </div>
                                     
                                     {/* Map Node Label */}
                                     {isBoss || isActive ? (
                                        <div className="absolute top-[110%] mt-2 bg-[#0a0908]/90 border border-[#b84235]/50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#dfd4ba] whitespace-nowrap shadow-xl pointer-events-none">
                                            {node.name}
                                        </div>
                                     ) : (
                                        <div className="absolute top-[110%] mt-2 text-[8px] font-bold uppercase tracking-wider text-[#8b8574] group-hover/node:text-[#dfd4ba] group-hover/node:scale-110 transition-all bg-[#0a0908]/60 px-2 rounded backdrop-blur-sm whitespace-nowrap pointer-events-none">
                                            {node.name}
                                        </div>
                                     )}
                                 </div>
                             );
                         })}
                     </div>
                </div>

                {/* Dedicated Tooltip Panel (No Overlap) */}
                <div className="h-[150px] shrink-0 border-t border-[#b84235]/30 bg-gradient-to-t from-[#0a0908] to-[#141211] z-30 flex items-center shadow-[0_-10px_30px_rgba(0,0,0,0.8)] px-10 relative">
                    {hoveredMapNode ? (
                        <div className="flex w-full items-center justify-between animate-[fade-in_0.2s_ease-out]">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d4af37] block mb-2">
                                    {hoveredMapNode.type === 'boss' ? 'Domain Boss' : hoveredMapNode.type === 'elite' ? 'Elite Threat' : hoveredMapNode.type === 'event' ? 'Mystery Event' : hoveredMapNode.type === 'shop' ? 'Traveling Merchant' : hoveredMapNode.type === 'rest' ? 'War Camp' : 'Combat Encounter'}
                                </span>
                                <h3 className="text-3xl font-black text-white tracking-widest uppercase mb-1">{hoveredMapNode.name}</h3>
                                <span className={`self-start border px-2 py-0.5 uppercase tracking-widest font-bold text-[9px]
                                    ${hoveredMapNode.status === 'completed' ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]' :
                                      hoveredMapNode.status === 'active' ? 'bg-[#b84235]/10 border-[#b84235]/30 text-[#b84235]' :
                                      'bg-[#8b8574]/10 border-[#8b8574]/30 text-[#8b8574]'
                                    }`}
                                >
                                     {hoveredMapNode.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="flex gap-12 items-center border-l border-[#8b8574]/20 pl-12">
                                <div className="flex flex-col gap-3">
                                    {hoveredMapNode.threat > 0 && (
                                        <div className="flex items-center gap-3 text-xs font-bold text-[#8b8574] uppercase tracking-[0.2em]">
                                            <span>Threat Level</span>
                                            <span className="text-[#b84235] text-sm">{'💀'.repeat(hoveredMapNode.threat)}</span>
                                        </div>
                                    )}
                                    {(hoveredMapNode.type === 'combat' || hoveredMapNode.type === 'elite' || hoveredMapNode.type === 'boss') && (
                                        <div className="flex items-center gap-3 text-xs font-bold text-[#8b8574] uppercase tracking-[0.2em]">
                                            <span>Enemy Waves</span>
                                            <span className="text-white text-[10px]">UNKNOWN</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-col items-center justify-center p-4 bg-[#0a0908] border border-[#d4af37]/20 min-w-[150px]">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#8b8574] mb-1">Potential Reward</span>
                                    <span className="text-[#dfd4ba] text-xs font-black tracking-widest uppercase text-center">{hoveredMapNode.reward}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-40">
                            <span className="text-xs font-bold uppercase tracking-[0.4em] text-[#dfd4ba]">Hover over a region to survey the vanguard</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* BOTTOM FOOTER - Compressed */}
        <div className="relative z-10 py-2 px-12 flex justify-between items-center bg-[#0a0908]/80 backdrop-blur-md border-t border-[#b84235]/30">
            <p className="text-[#8b8574]/60 text-[8px] font-bold uppercase tracking-[0.3em]">Dev Mode Active</p>
            
            <button className="relative group overflow-hidden shadow-[0_0_20px_rgba(184,66,53,0.3)] pointer-events-auto cursor-pointer scale-90 origin-right">
                <div className="absolute inset-0 bg-gradient-to-r from-[#b84235] to-[#802a20] translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500" />
                <div className="relative z-10 px-12 py-3 border border-[#b84235] bg-[#1a0f0e] text-[#dfd4ba] text-lg uppercase tracking-[0.3em] font-black group-hover:text-white transition-colors group-hover:border-[#d4af37]">
                    Play Selected Area
                </div>
            </button>
        </div>
        
    </div>
  );
}
