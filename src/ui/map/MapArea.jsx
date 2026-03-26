import { CAMPAIGN_MAP } from '../../config/campaign.js';

const nodePositions = {
  RIVERLANDS: { cx: '30%', cy: '72%' },
  OUTSKIRTS: { cx: '70%', cy: '68%' },
  IRON_MINES: { cx: '20%', cy: '42%' },
  TENGU_PEAKS: { cx: '80%', cy: '38%' },
  THE_ABYSS: { cx: '50%', cy: '15%' }
};

const mapConnections = [
  { start: { cx: '50%', cy: '88%' }, end: nodePositions.RIVERLANDS, target: 'RIVERLANDS' },
  { start: { cx: '50%', cy: '88%' }, end: nodePositions.OUTSKIRTS, target: 'OUTSKIRTS' },
  { start: nodePositions.RIVERLANDS, end: nodePositions.IRON_MINES, target: 'IRON_MINES' },
  { start: nodePositions.OUTSKIRTS, end: nodePositions.TENGU_PEAKS, target: 'TENGU_PEAKS' },
  { start: nodePositions.RIVERLANDS, end: nodePositions.TENGU_PEAKS, target: 'TENGU_PEAKS' },
  { start: nodePositions.IRON_MINES, end: nodePositions.THE_ABYSS, target: 'THE_ABYSS' },
  { start: nodePositions.TENGU_PEAKS, end: nodePositions.THE_ABYSS, target: 'THE_ABYSS' },
];

export function MapArea({ meta, startCombat }) {
  return (
    <div className="flex-1 relative bg-[#dfd4ba] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#1b1918_100%)] opacity-30" />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%231b1918\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '20px 20px' }} />

      <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none">
        <h1 className="text-6xl font-black text-[#1b1918] tracking-[0.5em] uppercase drop-shadow-md">War Map</h1>
        <p className="text-xl font-bold text-[#b84235] tracking-widest uppercase mt-4 bg-[#dfd4ba] inline-block px-4 py-1 border-2 border-[#b84235]">Select Your Conquest</p>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {mapConnections.map((conn, idx) => {
            const isConquered = meta.conqueredRegions.includes(conn.target);
            return (
              <line 
                  key={idx}
                  x1={conn.start.cx} y1={conn.start.cy} 
                  x2={conn.end.cx} y2={conn.end.cy} 
                  className={`transition-colors duration-700 ${isConquered ? 'stroke-[#d4af37]' : 'stroke-[#1b1918] opacity-30'}`}
                  strokeWidth={isConquered ? "6" : "4"} 
                  strokeDasharray={isConquered ? "none" : "10 10"} 
              />
            );
        })}
      </svg>

      {/* IMPERIAL CAPITAL */}
      <div className="absolute z-20 flex flex-col items-center" style={{ left: '50%', top: '88%', transform: 'translate(-50%, -50%)' }}>
        <div className="relative w-24 h-24 rounded-full border-4 border-[#d4af37] bg-[#2b3d60] flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)]">
            <div className="absolute inset-2 border-2 border-dashed border-[#dfd4ba]/30 rounded-full animate-[spin_20s_linear_infinite]" />
            <span className="text-4xl relative z-10">⛩️</span>
            <div className="absolute top-full mt-3 px-4 py-1.5 font-black text-xs uppercase tracking-widest whitespace-nowrap border-2 shadow-lg bg-[#1b1918] text-[#d4af37] border-[#d4af37]">
                Imperial Capital
            </div>
            <div className="absolute -bottom-10 text-[10px] font-bold text-[#1b1918] tracking-widest uppercase">Your Stronghold</div>
        </div>
      </div>

      {/* Interactive Map Nodes */}
      {Object.values(CAMPAIGN_MAP).map(region => {
        const isConquered = meta.conqueredRegions.includes(region.id);
        const { cx, cy } = nodePositions[region.id];

        return (
          <div key={region.id} className="absolute group z-20" style={{ left: cx, top: cy, transform: 'translate(-50%, -50%)' }}>
            
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 p-3 bg-[#1b1918] text-[#dfd4ba] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2 border-[#8b8574] shadow-2xl flex flex-col items-center">
                <span className="font-black text-sm uppercase tracking-widest text-[#d4af37] mb-1 border-b-2 border-[#8b8574] w-full text-center pb-1">{region.name}</span>
                <div className="flex justify-between w-full mt-2 mb-2 text-xs font-bold">
                   <span>Threat:</span>
                   <span className="text-[#b84235]">{'💀'.repeat(region.threatLevel)}</span>
                </div>
                <div className="flex justify-between w-full mb-3 text-xs font-bold">
                   <span>Waves:</span>
                   <span>{region.waves}</span>
                </div>
                <div className="bg-[#b84235] text-[#1b1918] text-[10px] font-black w-full text-center py-1.5 uppercase tracking-widest">
                    {region.reward}
                </div>
            </div>

            <button 
               onClick={() => !isConquered && startCombat(region.id)}
               className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center transform transition-all duration-300 ${isConquered ? 'bg-[#2b3d60] border-[#d4af37] cursor-default shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'bg-[#1b1918] border-[#b84235] cursor-pointer hover:scale-110 hover:bg-[#b84235] hover:shadow-[0_0_30px_rgba(184,66,53,0.8)]'}`}
            >
               {!isConquered && (
                  <div className="absolute inset-[-12px] border-2 border-[#b84235] rounded-full animate-ping opacity-50 pointer-events-none" />
               )}
               
               <div className={`absolute inset-2 border-2 border-dashed rounded-full ${isConquered ? 'border-[#d4af37]/50' : 'border-[#dfd4ba]/30 animate-[spin_10s_linear_infinite]'}`} />
               
               <span className="text-3xl relative z-10">{isConquered ? '🏯' : (region.id === 'THE_ABYSS' ? '👹' : '⚔️')}</span>

               <div className={`absolute top-full mt-3 px-3 py-1 font-black text-[10px] uppercase tracking-widest whitespace-nowrap border-2 shadow-lg ${isConquered ? 'bg-[#d4af37] text-[#1b1918] border-[#1b1918]' : 'bg-[#dfd4ba] text-[#1b1918] border-[#b84235]'}`}>
                   {region.name}
               </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
