import React from 'react';
import { V_WIDTH, V_HEIGHT, WALL_Y } from '../../config/constants.js';
import { COLORS } from '../../config/colors.js';

// --- SVGs ---

// LEVEL 1: Bamboo Wall
const BambooWall = ({ y }) => {
  const sticks = [];
  for (let x = -50; x < V_WIDTH + 50; x += 15) {
    if ((x > 300 && x < 450) || (x > 750 && x < 900)) continue;
    const heightOffset = Math.random() * 20 - 10;
    sticks.push(
      <path key={`stick-${x}`} d={`M ${x} ${y + 20} L ${x + (Math.random() * 6 - 3)} ${y - 60 + heightOffset}`} stroke="#8b7355" strokeWidth="6" strokeLinecap="round" />
    );
  }

  const renderSegment = (startX, endX) => (
    <g key={`seg-${startX}`}>
      <path d={`M ${startX} ${y + 20} L ${endX} ${y + 20}`} stroke="#2c2a29" strokeWidth="20" opacity="0.2"/>
      {Array.from({length: Math.max(1, Math.floor((endX - startX)/120))}).map((_, i) => {
        const sx = startX + 60 + i * 120;
        if (sx > endX - 20) return null;
        return <path key={`support-${sx}`} d={`M ${sx} ${y - 30} L ${sx + 20} ${y + 80}`} stroke="#5c4a3d" strokeWidth="8" strokeLinecap="round"/>
      })}
      <path d={`M ${startX} ${y - 20} L ${endX} ${y - 20}`} stroke="#5c4a3d" strokeWidth="10"/>
      <path d={`M ${startX} ${y - 45} L ${endX} ${y - 45}`} stroke="#5c4a3d" strokeWidth="10"/>
      {Array.from({length: Math.max(1, Math.floor((endX - startX)/30))}).map((_, i) => {
         const cx = startX + 15 + i * 30;
         return (
           <React.Fragment key={`ties-${cx}`}>
             <circle cx={cx} cy={y - 20} r="4" fill="#2c2a29"/>
             <circle cx={cx} cy={y - 45} r="4" fill="#2c2a29"/>
           </React.Fragment>
         );
      })}
    </g>
  );

  return (
    <g>
      {renderSegment(-50, 300)}
      {renderSegment(450, 750)}
      {renderSegment(900, V_WIDTH + 50)}
      {sticks}
      <path d={`M 300 ${y+20} L 300 ${y-100}`} stroke="#2c2a29" strokeWidth="16" strokeLinecap="round"/>
      <path d={`M 450 ${y+20} L 450 ${y-100}`} stroke="#2c2a29" strokeWidth="16" strokeLinecap="round"/>
      <path d={`M 750 ${y+20} L 750 ${y-100}`} stroke="#2c2a29" strokeWidth="16" strokeLinecap="round"/>
      <path d={`M 900 ${y+20} L 900 ${y-100}`} stroke="#2c2a29" strokeWidth="16" strokeLinecap="round"/>
      <path d={`M 280 ${y-80} L 470 ${y-80}`} stroke="#2c2a29" strokeWidth="12" strokeLinecap="round"/>
      <path d={`M 730 ${y-80} L 920 ${y-80}`} stroke="#2c2a29" strokeWidth="12" strokeLinecap="round"/>
      <path d={`M 280 ${y-60} L 470 ${y-60}`} stroke="#5c4a3d" strokeWidth="6" strokeLinecap="round"/>
      <path d={`M 730 ${y-60} L 920 ${y-60}`} stroke="#5c4a3d" strokeWidth="6" strokeLinecap="round"/>
    </g>
  );
};

// LEVEL 2: Wooden Wall
const WoodenWall = ({ y }) => {
  const logs = [];
  for (let x = -50; x < V_WIDTH + 50; x += 25) {
    if ((x > 300 && x < 450) || (x > 750 && x < 900)) continue;
    const heightOffset = Math.random() * 10;
    logs.push(
      <g key={`log-${x}`}>
        <path d={`M ${x} ${y + 20} L ${x} ${y - 80 + heightOffset}`} stroke="#5c4a3d" strokeWidth="22" />
        <path d={`M ${x-11} ${y - 80 + heightOffset} L ${x} ${y - 100 + heightOffset} L ${x+11} ${y - 80 + heightOffset} Z`} fill="#5c4a3d" />
      </g>
    );
  }

  const renderSegment = (startX, endX) => (
    <g key={`seg-${startX}`}>
      <path d={`M ${startX} ${y + 20} L ${endX} ${y + 20}`} stroke="#2c2a29" strokeWidth="25" opacity="0.3"/>
      {Array.from({length: Math.max(1, Math.floor((endX - startX)/120))}).map((_, i) => {
        const sx = startX + 60 + i * 120;
        if (sx > endX - 30) return null;
        return <path key={`support-${sx}`} d={`M ${sx} ${y - 40} L ${sx + 30} ${y + 80}`} stroke="#4a3830" strokeWidth="16" strokeLinecap="round"/>
      })}
      <path d={`M ${startX} ${y - 30} L ${endX} ${y - 30}`} stroke="#4a3830" strokeWidth="14"/>
      <path d={`M ${startX} ${y - 60} L ${endX} ${y - 60}`} stroke="#4a3830" strokeWidth="14"/>
    </g>
  );

  return (
    <g>
      {logs}
      {renderSegment(-50, 300)}
      {renderSegment(450, 750)}
      {renderSegment(900, V_WIDTH + 50)}
      <path d={`M 300 ${y+20} L 300 ${y-120}`} stroke="#2c2a29" strokeWidth="24"/>
      <path d={`M 450 ${y+20} L 450 ${y-120}`} stroke="#2c2a29" strokeWidth="24"/>
      <path d={`M 750 ${y+20} L 750 ${y-120}`} stroke="#2c2a29" strokeWidth="24"/>
      <path d={`M 900 ${y+20} L 900 ${y-120}`} stroke="#2c2a29" strokeWidth="24"/>
      <path d={`M 280 ${y-110} L 470 ${y-110}`} stroke="#2c2a29" strokeWidth="20" />
      <path d={`M 730 ${y-110} L 920 ${y-110}`} stroke="#2c2a29" strokeWidth="20" />
      <path d={`M 290 ${y-90} L 460 ${y-90}`} stroke="#5c4a3d" strokeWidth="10" />
      <path d={`M 740 ${y-90} L 910 ${y-90}`} stroke="#5c4a3d" strokeWidth="10" />
    </g>
  );
};

// LEVEL 3: Stone Wall
const StoneWall = ({ y }) => {
  const renderSegment = (startX, endX) => (
    <g key={`seg-${startX}`}>
      <path d={`M ${startX} ${y + 30} L ${endX} ${y + 30}`} stroke="#2c2a29" strokeWidth="30" opacity="0.4"/>
      {/* Stone Base (Ishigaki) */}
      <path d={`M ${startX} ${y + 20} L ${endX} ${y + 20} L ${endX} ${y - 20} L ${startX} ${y - 20} Z`} fill="#696866" stroke="#2c2a29" strokeWidth="4"/>
      {/* Plaster Wall (Shirokabe) */}
      <path d={`M ${startX} ${y - 20} L ${endX} ${y - 20} L ${endX} ${y - 80} L ${startX} ${y - 80} Z`} fill="#e8dac1" stroke="#2c2a29" strokeWidth="4"/>
      {/* Wooden supports */}
      {Array.from({length: Math.floor((endX - startX)/60)}).map((_, i) => (
        <path key={`beam-${i}`} d={`M ${startX + i * 60 + 30} ${y - 20} L ${startX + i * 60 + 30} ${y - 80}`} stroke="#2c2a29" strokeWidth="4"/>
      ))}
      <path d={`M ${startX-10} ${y - 80} L ${endX+10} ${y - 80}`} stroke="#4a4847" strokeWidth="10"/>
      <path d={`M ${startX-10} ${y - 85} L ${endX+10} ${y - 85}`} stroke="#2c2a29" strokeWidth="6"/>
    </g>
  );

  return (
    <g>
      {renderSegment(-50, 300)}
      {renderSegment(450, 750)}
      {renderSegment(900, V_WIDTH + 50)}
      <path d={`M 300 ${y+20} L 300 ${y-120}`} stroke="#2c2a29" strokeWidth="30"/>
      <path d={`M 450 ${y+20} L 450 ${y-120}`} stroke="#2c2a29" strokeWidth="30"/>
      <path d={`M 750 ${y+20} L 750 ${y-120}`} stroke="#2c2a29" strokeWidth="30"/>
      <path d={`M 900 ${y+20} L 900 ${y-120}`} stroke="#2c2a29" strokeWidth="30"/>
      <path d={`M 270 ${y-110} L 480 ${y-110}`} stroke="#4a4847" strokeWidth="24" strokeLinecap="round"/>
      <path d={`M 720 ${y-110} L 930 ${y-110}`} stroke="#4a4847" strokeWidth="24" strokeLinecap="round"/>
      <path d={`M 270 ${y-120} L 480 ${y-120}`} stroke="#2c2a29" strokeWidth="8" strokeLinecap="round"/>
      <path d={`M 720 ${y-120} L 930 ${y-120}`} stroke="#2c2a29" strokeWidth="8" strokeLinecap="round"/>
    </g>
  );
};

// LEVEL 4: Castle Wall
const CastleWall = ({ y }) => {
  const renderSegment = (startX, endX) => (
    <g key={`seg-${startX}`}>
      <path d={`M ${startX} ${y + 40} L ${endX} ${y + 40}`} stroke="#2c2a29" strokeWidth="40" opacity="0.5"/>
      <path d={`M ${startX} ${y + 20} L ${endX} ${y + 20} L ${endX} ${y - 40} L ${startX} ${y - 40} Z`} fill="#4a4847" stroke="#2c2a29" strokeWidth="6"/>
      <path d={`M ${startX} ${y - 10} L ${endX} ${y - 10}`} stroke="#2c2a29" strokeWidth="2" opacity="0.5"/>
      <path d={`M ${startX} ${y - 40} L ${endX} ${y - 40} L ${endX} ${y - 120} L ${startX} ${y - 120} Z`} fill="#fff" stroke="#2c2a29" strokeWidth="4"/>
      {Array.from({length: Math.floor((endX - startX)/50)}).map((_, i) => (
        <rect key={`slit-${i}`} x={startX + i * 50 + 20} y={y - 100} width="6" height="30" fill="#2c2a29"/>
      ))}
      <path d={`M ${startX-10} ${y - 120} L ${endX+10} ${y - 120}`} stroke="#4a4847" strokeWidth="16"/>
      <path d={`M ${startX-10} ${y - 128} L ${endX+10} ${y - 128}`} stroke="#2c2a29" strokeWidth="8"/>
    </g>
  );

  return (
    <g>
      {renderSegment(-50, 300)}
      {renderSegment(450, 750)}
      {renderSegment(900, V_WIDTH + 50)}
      <path d={`M 290 ${y+20} L 290 ${y-160}`} stroke="#2c2a29" strokeWidth="40"/>
      <path d={`M 460 ${y+20} L 460 ${y-160}`} stroke="#2c2a29" strokeWidth="40"/>
      <path d={`M 740 ${y+20} L 740 ${y-160}`} stroke="#2c2a29" strokeWidth="40"/>
      <path d={`M 910 ${y+20} L 910 ${y-160}`} stroke="#2c2a29" strokeWidth="40"/>
      <path d={`M 260 ${y-150} L 490 ${y-150}`} stroke="#4a4847" strokeWidth="36" strokeLinecap="round"/>
      <path d={`M 710 ${y-150} L 940 ${y-150}`} stroke="#4a4847" strokeWidth="36" strokeLinecap="round"/>
      <path d={`M 260 ${y-165} L 490 ${y-165}`} stroke="#2c2a29" strokeWidth="12" strokeLinecap="round"/>
      <path d={`M 710 ${y-165} L 940 ${y-165}`} stroke="#2c2a29" strokeWidth="12" strokeLinecap="round"/>
      <circle cx="375" cy={y-150} r="10" fill="#dfd4ba"/>
      <circle cx="825" cy={y-150} r="10" fill="#dfd4ba"/>
    </g>
  );
};

// DOJO BUILDINGS 
const BaseBuilding = ({ x, y, color, title, children }) => {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)` }}>
      <ellipse cx="0" cy="100" rx="140" ry="40" fill="#2c2a29" opacity="0.4"/>
      {children}
      <rect x="-60" y="115" width="120" height="30" rx="4" fill="#2c2a29" stroke={color} strokeWidth="2"/>
      <text x="0" y="136" fill="#fff" fontSize="16" textAnchor="middle" fontWeight="bold" letterSpacing="2">{title}</text>
    </g>
  );
};

const SwordDojo = ({ x, y }) => (
  <BaseBuilding x={x} y={y} color="#4a90e2" title="SWORD DOJO">
    <path d="M -90 90 L -70 20 L 70 20 L 90 90 Z" fill="#e8dac1" stroke="#2c2a29" strokeWidth="4"/>
    <path d="M -90 90 L -70 20 M -30 90 L -20 20 M 30 90 L 20 20 M 90 90 L 70 20" stroke="#5c4a3d" strokeWidth="6"/>
    <path d="M -120 40 Q 0 -40 120 40 L 140 10 L 80 -80 L -80 -80 L -140 10 Z" fill="#2c2a29" stroke="#1b1918" strokeWidth="5" strokeLinejoin="round"/>
    <path d="M -100 20 Q 0 -50 100 20 M -80 0 Q 0 -60 80 0 M -60 -20 Q 0 -70 60 -20" stroke="#4a4847" strokeWidth="4" fill="none"/>
    <path d="M -70 -70 L 70 -70 L 80 -90 L -80 -90 Z" fill="#b84235" stroke="#1b1918" strokeWidth="3"/>
    <circle cx="-80" cy="-80" r="10" fill="#dfd4ba" stroke="#1b1918" strokeWidth="3"/>
    <circle cx="80" cy="-80" r="10" fill="#dfd4ba" stroke="#1b1918" strokeWidth="3"/>
    <g style={{ transform: 'translate(-110px, -20px)' }}>
      <path d="M 0 100 L 0 -80" stroke="#2c2a29" strokeWidth="4"/>
      <path d="M 0 -70 L -40 -70 L -40 30 L 0 30 Z" fill="#4a90e2" stroke="#2c2a29" strokeWidth="3"/>
      <text x="-20" y="-10" fill="#fff" fontSize="24" textAnchor="middle" fontWeight="bold">剣</text>
    </g>
    <g style={{ transform: 'translate(110px, -20px)' }}>
      <path d="M 0 100 L 0 -80" stroke="#2c2a29" strokeWidth="4"/>
      <path d="M 0 -70 L 40 -70 L 40 30 L 0 30 Z" fill="#4a90e2" stroke="#2c2a29" strokeWidth="3"/>
      <text x="20" y="-10" fill="#fff" fontSize="24" textAnchor="middle" fontWeight="bold">剣</text>
    </g>
    <rect x="-40" y="-10" width="10" height="40" fill="#8b7355" stroke="#2c2a29" strokeWidth="2"/>
    <rect x="-50" y="0" width="30" height="6" fill="#8b7355" stroke="#2c2a29" strokeWidth="2"/>
    <rect x="30" y="-10" width="10" height="40" fill="#8b7355" stroke="#2c2a29" strokeWidth="2"/>
    <rect x="20" y="0" width="30" height="6" fill="#8b7355" stroke="#2c2a29" strokeWidth="2"/>
    <path d="M -100 90 L 100 90 L 110 110 L -110 110 Z" fill="#5c4a3d" stroke="#2c2a29" strokeWidth="4"/>
  </BaseBuilding>
);

const BowDojo = ({ x, y }) => (
  <BaseBuilding x={x} y={y} color="#dfd4ba" title="ARCHERY RANGE">
    <path d="M -90 90 L -70 20 L 70 20 L 90 90 Z" fill="#2c2a29" stroke="#2c2a29" strokeWidth="4"/>
    <circle cx="-30" cy="50" r="15" fill="#e8dac1" stroke="#b84235" strokeWidth="4"/>
    <circle cx="-30" cy="50" r="5" fill="#b84235"/>
    <circle cx="30" cy="50" r="15" fill="#e8dac1" stroke="#b84235" strokeWidth="4"/>
    <circle cx="30" cy="50" r="5" fill="#b84235"/>
    <path d="M -90 90 L -70 20 M 90 90 L 70 20" stroke="#5c4a3d" strokeWidth="6"/>
    <path d="M -130 30 L 130 30 L 110 -30 L -110 -30 Z" fill="#2c2a29" stroke="#1b1918" strokeWidth="5"/>
    <path d="M -100 -50 L 100 -50 L 110 -30 L -110 -30 Z" fill="#b84235" stroke="#1b1918" strokeWidth="3"/>
    <g style={{ transform: 'translate(-110px, -20px)' }}>
      <path d="M 0 100 L 0 -80" stroke="#2c2a29" strokeWidth="4"/>
      <path d="M 0 -70 L -40 -70 L -40 30 L 0 30 Z" fill="#dfd4ba" stroke="#2c2a29" strokeWidth="3"/>
      <text x="-20" y="-10" fill="#2c2a29" fontSize="24" textAnchor="middle" fontWeight="bold">弓</text>
    </g>
    <path d="M -100 90 L 100 90 L 110 110 L -110 110 Z" fill="#5c4a3d" stroke="#2c2a29" strokeWidth="4"/>
  </BaseBuilding>
);

const StablesDojo = ({ x, y }) => (
  <BaseBuilding x={x} y={y} color="#8b7355" title="STABLES">
    <path d="M -90 90 L -70 20 L 70 20 L 90 90 Z" fill="#e8dac1" stroke="#2c2a29" strokeWidth="4"/>
    <path d="M -90 90 L -70 20 M -30 90 L -20 20 M 30 90 L 20 20 M 90 90 L 70 20" stroke="#5c4a3d" strokeWidth="6"/>
    <path d="M -110 30 Q 0 -50 110 30 L 90 -40 L -90 -40 Z" fill="#dfd4ba" stroke="#8b7355" strokeWidth="5"/>
    <path d="M -80 -20 Q 0 -60 80 -20 M -60 -10 Q 0 -40 60 -10" stroke="#8b7355" strokeWidth="3" fill="none"/>
    <path d="M 50 80 L 140 60 M 60 95 L 140 85" stroke="#5c4a3d" strokeWidth="4" fill="none"/>
    <path d="M 120 100 L 120 50 M 140 100 L 140 50" stroke="#5c4a3d" strokeWidth="6" strokeLinecap="round"/>
    <g style={{ transform: 'translate(-100px, -20px)' }}>
      <path d="M 0 100 L 0 -80" stroke="#2c2a29" strokeWidth="4"/>
      <path d="M 0 -70 L -40 -70 L -40 30 L 0 30 Z" fill="#8b7355" stroke="#2c2a29" strokeWidth="3"/>
      <text x="-20" y="-10" fill="#fff" fontSize="24" textAnchor="middle" fontWeight="bold">馬</text>
    </g>
    <path d="M -100 90 L 100 90 L 110 110 L -110 110 Z" fill="#5c4a3d" stroke="#2c2a29" strokeWidth="4"/>
  </BaseBuilding>
);

const PowderMillDojo = ({ x, y }) => (
  <BaseBuilding x={x} y={y} color="#b84235" title="POWDER MILL">
    <circle cx="80" cy="70" r="15" fill="#b84235" stroke="#2c2a29" strokeWidth="3"/>
    <circle cx="105" cy="75" r="15" fill="#b84235" stroke="#2c2a29" strokeWidth="3"/>
    <circle cx="95" cy="50" r="15" fill="#b84235" stroke="#2c2a29" strokeWidth="3"/>
    <path d="M -90 90 L -70 20 L 70 20 L 90 90 Z" fill="#4a4847" stroke="#2c2a29" strokeWidth="4"/>
    <path d="M -40 20 L -30 -80 L -10 -80 L 0 20 Z" fill="#8b7355" stroke="#2c2a29" strokeWidth="3"/>
    <path d="M -30 -60 L -10 -60 M -25 -40 L -5 -40" stroke="#5c4a3d" strokeWidth="2"/>
    <circle cx="-20" cy="-90" r="15" fill="#e8dac1" opacity="0.8"/>
    <circle cx="-35" cy="-110" r="20" fill="#e8dac1" opacity="0.6"/>
    <circle cx="0" cy="-120" r="25" fill="#e8dac1" opacity="0.4"/>
    <path d="M -110 30 L 110 30 L 80 -10 L -80 -10 Z" fill="#2c2a29" stroke="#1b1918" strokeWidth="5"/>
    <path d="M -90 20 L -70 -10 M -50 20 L -30 -10 M 10 20 L 30 -10 M 50 20 L 70 -10" stroke="#4a4847" strokeWidth="3"/>
    <g style={{ transform: 'translate(130px, -20px)' }}>
      <path d="M 0 100 L 0 -80" stroke="#2c2a29" strokeWidth="4"/>
      <path d="M 0 -70 L 40 -70 L 40 30 L 0 30 Z" fill="#b84235" stroke="#2c2a29" strokeWidth="3"/>
      <text x="20" y="-10" fill="#fff" fontSize="24" textAnchor="middle" fontWeight="bold">爆</text>
    </g>
    <path d="M -100 90 L 100 90 L 110 110 L -110 110 Z" fill="#2c2a29" stroke="#1b1918" strokeWidth="4"/>
  </BaseBuilding>
);

export const BaseMock = ({ state }) => {
  const wallType = state?.wallType ?? 'bamboo';
  return (
    <div className="w-full h-full bg-[#1b1918] p-4 flex items-center justify-center overflow-hidden">
      <div 
        className="relative bg-white shadow-2xl rounded-sm"
        style={{
          width: '100%',
          maxWidth: '800px',
          aspectRatio: `${V_WIDTH} / ${V_HEIGHT}`,
          background: COLORS.parchment,
          backgroundImage: `
            radial-gradient(circle at 50% 50%, transparent 20%, rgba(0,0,0,0.05) 100%),
            url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")
          `,
        }}
      >
        <svg 
          viewBox={`0 0 ${V_WIDTH} ${V_HEIGHT}`} 
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Ground Grid for Depth Reference */}
          <g opacity="0.1">
            {Array.from({length: 20}).map((_, i) => (
              <line key={`v-${i}`} x1={i*60} y1="0" x2={i*60} y2={V_HEIGHT} stroke="#2c2a29" strokeWidth="2"/>
            ))}
            {Array.from({length: 27}).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i*60} x2={V_WIDTH} y2={i*60} stroke="#2c2a29" strokeWidth="2"/>
            ))}
          </g>

          {/* Battlefield Boundary */}
          <rect x="0" y="0" width={V_WIDTH} height={WALL_Y} fill="rgba(184, 66, 53, 0.02)"/>
          <text x={V_WIDTH / 2} y={WALL_Y / 2} fill="#b84235" fontSize="80" textAnchor="middle" opacity="0.1" fontWeight="bold">
            BATTLEFIELD / NO MAN'S LAND
          </text>

          {/* Player Base Region (Behind Wall) */}
          <rect x="0" y={WALL_Y} width={V_WIDTH} height={V_HEIGHT - WALL_Y} fill="rgba(74, 144, 226, 0.05)"/>
          
          {/* Render Active Wall */}
          {wallType === 'bamboo' && <BambooWall y={WALL_Y - 40} />}
          {wallType === 'wooden' && <WoodenWall y={WALL_Y - 40} />}
          {wallType === 'stone' && <StoneWall y={WALL_Y - 40} />}
          {wallType === 'castle' && <CastleWall y={WALL_Y - 40} />}

          {/* The 4 Barracks Buildings */}
          <SwordDojo x={180} y={1440} />
          <BowDojo x={460} y={1440} />
          <StablesDojo x={740} y={1440} />
          <PowderMillDojo x={1020} y={1440} />
        </svg>
      </div>
    </div>
  );
};

export const BaseControls = ({ state, setState }) => {
  const wallType = state?.wallType ?? 'bamboo';
  return (
    <div className="flex rounded-lg bg-white/10 p-1">
      {[
        { id: 'bamboo', label: 'BAMBOO WALL (LV 1)' },
        { id: 'wooden', label: 'WOODEN WALL (LV 2)' },
        { id: 'stone', label: 'STONE WALL (LV 3)' },
        { id: 'castle', label: 'CASTLE WALL (LV 4)' },
      ].map(({ id, label }) => (
        <button
          key={id}
          onClick={() => setState((prev) => ({ ...prev, wallType: id }))}
          className={`rounded-md px-3 py-1.5 text-[10px] font-black tracking-widest ${
            wallType === id ? 'bg-[#feca57] text-zinc-800' : 'text-white/60 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
