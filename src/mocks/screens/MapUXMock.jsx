import { useState } from 'react';
import { Skull, Sword } from 'lucide-react';

const MOCK_MAP = {
  RIVERLANDS:  { id: 'RIVERLANDS',  name: 'Sakura Riverlands', threatLevel: 1, waves: 5,  reward: 'Command Drops +20%' },
  OUTSKIRTS:   { id: 'OUTSKIRTS',   name: 'Kyoto Outskirts',   threatLevel: 2, waves: 6,  reward: '+1 Max Squad Cap' },
  TENGU_PEAKS: { id: 'TENGU_PEAKS', name: 'Tengu Peaks',       threatLevel: 3, waves: 7,  reward: 'Archers +50% DMG' },
  IRON_MINES:  { id: 'IRON_MINES',  name: 'Kurogane Mines',    threatLevel: 3, waves: 7,  reward: 'Hatamoto +50% HP' },
  THE_ABYSS:   { id: 'THE_ABYSS',   name: 'Yomi Abyss',        threatLevel: 5, waves: 10, reward: 'Campaign Victory' }
};

// Reverted to original positions covering the full 900x500 area
const nodePositions = {
  RIVERLANDS: { cx: '30%', cy: '72%' },
  OUTSKIRTS: { cx: '70%', cy: '68%' },
  IRON_MINES: { cx: '20%', cy: '42%' },
  TENGU_PEAKS: { cx: '80%', cy: '38%' },
  THE_ABYSS: { cx: '50%', cy: '15%' },
  IMPERIAL_CAPITAL: { cx: '50%', cy: '88%' }
};

const mapConnections = [
  { start: nodePositions.IMPERIAL_CAPITAL, end: nodePositions.RIVERLANDS, target: 'RIVERLANDS' },
  { start: nodePositions.IMPERIAL_CAPITAL, end: nodePositions.OUTSKIRTS, target: 'OUTSKIRTS' },
  { start: nodePositions.RIVERLANDS, end: nodePositions.IRON_MINES, target: 'IRON_MINES' },
  { start: nodePositions.OUTSKIRTS, end: nodePositions.TENGU_PEAKS, target: 'TENGU_PEAKS' },
  { start: nodePositions.RIVERLANDS, end: nodePositions.TENGU_PEAKS, target: 'TENGU_PEAKS' },
  { start: nodePositions.IRON_MINES, end: nodePositions.THE_ABYSS, target: 'THE_ABYSS' },
  { start: nodePositions.TENGU_PEAKS, end: nodePositions.THE_ABYSS, target: 'THE_ABYSS' },
];

export const MapUXMock = () => {
  const [conquered] = useState(['RIVERLANDS']); // Mock conquered state

  // Helper to determine smart tooltip placement based on coordinates
  const getTooltipClasses = (cx, cy) => {
    let x = parseInt(cx);
    let y = parseInt(cy);
    
    // Vertical placement: if high up (y < 30), push tooltip down. Otherwise float above.
    let yClass = y < 30 ? "top-full mt-3" : "bottom-full mb-3";
    
    // Horizontal placement: near edges -> align to edge to prevent clip
    let xClass = "left-1/2 -translate-x-1/2";
    if (x > 75) xClass = "right-0";
    else if (x < 25) xClass = "left-0";
    
    return `${yClass} ${xClass}`;
  };

  return (
    <div className="flex h-full w-full relative bg-[var(--color-parchment)] overflow-hidden font-sans">
      {/* Background Textures */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#1b1918_120%)] opacity-40" />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%231b1918\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '20px 20px' }} />

      {/* Title Area - Re-centered but slightly smaller */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none">
        <h1 className="text-5xl font-black text-[var(--color-ink)] tracking-[0.5em] uppercase drop-shadow-sm">War Map</h1>
        <p className="text-sm font-bold text-[#b84235] tracking-widest uppercase mt-2 bg-[var(--color-parchment)] inline-block px-4 py-1 border border-[#b84235]">Select Your Conquest</p>
      </div>

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {mapConnections.map((conn, idx) => {
            const isConquered = conquered.includes(conn.target);
            return (
              <line 
                  key={idx}
                  x1={conn.start.cx} y1={conn.start.cy} 
                  x2={conn.end.cx} y2={conn.end.cy} 
                  className={`transition-colors duration-700 ${isConquered ? 'stroke-[#d4af37]' : 'stroke-[var(--color-ink)] opacity-30'}`}
                  strokeWidth={isConquered ? "3" : "2"} 
                  strokeDasharray={isConquered ? "none" : "6 6"} 
              />
            );
        })}
      </svg>

      {/* IMPERIAL CAPITAL */}
      <div className="absolute z-20 flex flex-col items-center" style={{ left: nodePositions.IMPERIAL_CAPITAL.cx, top: nodePositions.IMPERIAL_CAPITAL.cy, transform: 'translate(-50%, -50%)' }}>
        <div className="relative w-20 h-20 rounded-full border-2 border-[#d4af37] bg-[#2b3d60] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            <span className="text-3xl relative z-10">⛩️</span>
            <div className="absolute top-full mt-2 px-3 py-1 font-black text-[10px] uppercase tracking-widest whitespace-nowrap border bg-[var(--color-ink)] text-[#d4af37] border-[#d4af37]">
                Imperial Capital
            </div>
        </div>
      </div>

      {/* Interactive Map Nodes */}
      {Object.values(MOCK_MAP).map(region => {
        const isConquered = conquered.includes(region.id);
        const { cx, cy } = nodePositions[region.id];
        const tooltipPositionClasses = getTooltipClasses(cx, cy);

        return (
          <div key={region.id} className="absolute group z-30" style={{ left: cx, top: cy, transform: 'translate(-50%, -50%)' }}>
            
            {/* Smart Compact Tooltip */}
            <div className={`absolute ${tooltipPositionClasses} w-48 p-2.5 bg-[var(--color-ink)] text-[var(--color-parchment)] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none border border-[#8b8574] shadow-[0_0_20px_rgba(184,66,53,0.2)] flex flex-col items-center backdrop-blur-sm z-50 origin-center scale-95 group-hover:scale-100`}>
                <div className="flex justify-between items-center w-full border-b border-[#8b8574]/50 pb-1.5 mb-1.5">
                  <span className="font-black text-[10px] uppercase tracking-widest text-[#d4af37]">{region.name}</span>
                  <div className="flex text-[#b84235] text-[10px] drop-shadow-sm">
                    {'💀'.repeat(region.threatLevel)}
                  </div>
                </div>
                
                <div className="flex justify-between w-full text-[9px] font-bold opacity-80 mb-2 px-1">
                  <span className="uppercase tracking-wider flex items-center gap-1"><Sword size={10} /> Waves</span>
                  <span>{region.waves}</span>
                </div>
                
                <div className="bg-gradient-to-r from-[#b84235]/30 to-[#b84235]/10 text-[#dfd4ba] text-[9px] font-bold w-full text-center py-1.5 uppercase tracking-widest border border-[#b84235]/30 shadow-inner">
                  {region.reward}
                </div>
            </div>

            {/* Node Button */}
            <button 
               className={`relative w-14 h-14 rounded-full border-[3px] flex items-center justify-center transform transition-all duration-300 ${
                 isConquered 
                   ? 'bg-[#2b3d60] border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)] cursor-default' 
                   : 'bg-[var(--color-ink)] border-[#b84235] hover:scale-110 hover:bg-[#b84235] hover:shadow-[0_0_25px_rgba(184,66,53,0.8)] cursor-pointer'
               }`}
            >
               {!isConquered && (
                  <div className="absolute inset-[-8px] border-2 border-[#b84235] rounded-full animate-ping opacity-30 pointer-events-none" />
               )}
               <span className="text-2xl relative z-10">{isConquered ? '🏯' : (region.id === 'THE_ABYSS' ? '👹' : '⚔️')}</span>

               {/* Persistent Under-Label */}
               <div className={`absolute top-full mt-2 px-2 py-0.5 font-bold text-[9px] uppercase tracking-widest whitespace-nowrap border shadow-sm transition-colors group-hover:opacity-0 ${
                   isConquered 
                     ? 'bg-[#d4af37] text-[var(--color-ink)] border-[var(--color-ink)]' 
                     : 'bg-[var(--color-parchment)] text-[var(--color-ink)] border-[#b84235]'
                 }`}>
                   {region.name}
               </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};
