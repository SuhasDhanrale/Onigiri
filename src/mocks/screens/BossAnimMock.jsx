import { useState, useEffect } from 'react';

// --- HIGHLY DETAILED "CRAZY" SVG DESIGNS ---
// These use complex, multi-layered jagged paths to simulate aggressive, detailed Sumi-e monster designs.

// ==========================================
// BOSSES
// ==========================================
const GokiSVG = ({ className }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
    <path d="M 50 180 Q 20 150 30 100 Q 10 50 60 40 Q 100 10 140 40 Q 190 50 170 100 Q 180 150 150 180 Z" fill="#2c2a29" opacity="0.6"/>
    <path d="M 40 160 L 20 120 L 35 90 L 15 60 L 50 45 L 70 20 L 100 10 L 130 20 L 150 45 L 185 60 L 165 90 L 180 120 L 160 160 Z" fill="#1b1918" stroke="#dfd4ba" strokeWidth="1"/>
    <path d="M 40 100 L 70 80 L 60 120 M 160 100 L 130 80 L 140 120 M 100 40 L 90 70 M 100 40 L 110 70 M 70 140 L 100 120 L 130 140" stroke="#4a4846" strokeWidth="3" fill="none" strokeLinecap="square"/>
    <path d="M 20 80 L 40 70 L 30 50 M 180 80 L 160 70 L 170 50 M 80 160 L 100 150 L 120 160" stroke="#4a4846" strokeWidth="2" fill="none"/>
    <path d="M 75 50 L 85 20 L 115 20 L 125 50 Z" fill="#1b1918" stroke="#dfd4ba" strokeWidth="1"/>
    <path d="M 85 30 L 95 33 L 85 36 Z M 115 30 L 105 33 L 115 36 Z" fill="#b84235"/>
    <path d="M 88 40 L 96 42 L 88 44 Z M 112 40 L 104 42 L 112 44 Z" fill="#b84235"/>
    <path d="M 92 48 L 98 49 L 92 50 Z M 108 48 L 102 49 L 108 50 Z" fill="#b84235"/>
  </svg>
);

const KashaSVG = ({ className, time }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
    <g style={{ transform: `rotate(${time * 120}deg)`, transformOrigin: '100px 100px' }}>
      <circle cx="100" cy="100" r="80" stroke="#b84235" strokeWidth="12" fill="none" strokeDasharray="30 10" />
      <circle cx="100" cy="100" r="70" stroke="#1b1918" strokeWidth="6" fill="none" />
      {[...Array(16)].map((_, i) => (
        <path key={i} d="M 100 30 L 95 60 L 105 60 Z" fill="#b84235" style={{ transform: `rotate(${i * 22.5}deg)`, transformOrigin: '100px 100px' }} />
      ))}
      {[...Array(8)].map((_, i) => (
        <path key={`spoke-${i}`} d="M 100 20 L 98 100 L 102 100 Z" fill="#dfd4ba" style={{ transform: `rotate(${i * 45}deg)`, transformOrigin: '100px 100px' }} />
      ))}
    </g>
    <g style={{ transform: `translateY(${Math.sin(time * 4) * 10}px)` }}>
      <path d="M 100 60 Q 50 100 70 160 Q 100 130 130 160 Q 150 100 100 60 Z" fill="#1b1918" stroke="#b84235" strokeWidth="2"/>
      <path d="M 80 150 Q 100 180 120 150" stroke="#b84235" strokeWidth="2" fill="none"/>
      <path d="M 85 70 Q 100 50 115 70 L 120 90 Q 100 110 80 90 Z" fill="#dfd4ba"/>
      <ellipse cx="100" cy="95" rx="8" ry="12" fill="#1b1918"/>
      <circle cx="90" cy="75" r="4" fill="#b84235"/>
      <circle cx="110" cy="75" r="4" fill="#b84235"/>
      <path d="M 85 70 L 95 78 M 115 70 L 105 78" stroke="#1b1918" strokeWidth="2"/>
    </g>
  </svg>
);

const DaitenguSVG = ({ className, time }) => {
  const flap = Math.sin(time * 8) * 15;
  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
      <g style={{ transform: `rotate(${flap}deg)`, transformOrigin: '90px 100px' }}>
        <path d="M 90 90 Q 10 30 10 120 Q 30 160 50 140 Q 60 180 80 140 Q 90 150 90 90 Z" fill="#1b1918" stroke="#4a90e2" strokeWidth="2"/>
        <path d="M 20 100 L 40 105 M 30 130 L 50 125 M 60 150 L 70 130" stroke="#dfd4ba" strokeWidth="2" fill="none"/>
      </g>
      <g style={{ transform: `rotate(${-flap}deg)`, transformOrigin: '110px 100px' }}>
        <path d="M 110 90 Q 190 30 190 120 Q 170 160 150 140 Q 140 180 120 140 Q 110 150 110 90 Z" fill="#1b1918" stroke="#4a90e2" strokeWidth="2"/>
        <path d="M 180 100 L 160 105 M 170 130 L 150 125 M 140 150 L 130 130" stroke="#dfd4ba" strokeWidth="2" fill="none"/>
      </g>
      <g style={{ transform: `translateY(${Math.sin(time * 3) * 5}px)` }}>
        <path d="M 80 160 L 70 90 L 100 70 L 130 90 L 120 160 Z" fill="#2c2a29" stroke="#1b1918" strokeWidth="4"/>
        <path d="M 75 70 Q 100 30 125 70 Q 120 100 100 110 Q 80 100 75 70 Z" fill="#b84235" stroke="#1b1918" strokeWidth="3"/>
        <path d="M 90 85 L 100 130 L 110 85 Z" fill="#1b1918"/>
        <circle cx="85" cy="75" r="4" fill="#dfd4ba"/>
        <circle cx="115" cy="75" r="4" fill="#dfd4ba"/>
      </g>
    </svg>
  );
};

const YukionnaSVG = ({ className, time }) => {
  const wave1 = Math.sin(time * 3) * 10;
  const wave2 = Math.cos(time * 3) * 10;
  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
      {[...Array(12)].map((_, i) => {
        const a = (i * Math.PI) / 6 + time;
        const r = 80 + Math.sin(time * 5 + i) * 10;
        return (
          <path key={i} d={`M 100 100 L ${100 + Math.cos(a)*r} ${100 + Math.sin(a)*r} L ${100 + Math.cos(a+0.1)*(r-20)} ${100 + Math.sin(a+0.1)*(r-20)} Z`} fill="#a0c4ff" opacity="0.3"/>
        );
      })}
      <g style={{ transform: `translateY(${Math.sin(time * 2) * 10}px)` }}>
        <path d={`M 50 160 C ${60 + wave1} 190, ${140 + wave2} 190, 150 160 L 130 90 L 70 90 Z`} fill="#1b1918" stroke="#a0c4ff" strokeWidth="2"/>
        <path d={`M 70 160 Q ${100 + wave1} 180 130 160`} stroke="#a0c4ff" strokeWidth="2" fill="none"/>
        <path d="M 60 90 L 100 40 L 140 90 Z" fill="#2c2a29" stroke="#a0c4ff" strokeWidth="2"/>
        <path d="M 100 40 L 100 90 M 60 90 L 140 90 M 80 65 L 120 65" stroke="#1b1918" strokeWidth="3" fill="none"/>
        <path d="M 70 40 L 60 10 L 80 30 L 100 0 L 120 30 L 140 10 L 130 40 Z" fill="#a0c4ff"/>
        <path d="M 85 60 L 95 55 L 85 65 Z M 115 60 L 105 55 L 115 65 Z" fill="#fff"/>
      </g>
    </svg>
  );
};

const OtakemaruSVG = ({ className, time }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
    {[0, 1, 2].map(i => {
      const a = time * 2 + (i * Math.PI * 2) / 3;
      const x = 100 + Math.cos(a) * 90;
      const y = 100 + Math.sin(a) * 40;
      return (
        <g key={i} style={{ transform: `translate(${x}px, ${y}px)` }}>
          <path d="M -15 -10 Q 0 -30 15 -10 L 10 10 L -10 10 Z" fill="#9b59b6"/>
          <circle cx="-5" cy="-5" r="3" fill="#1b1918"/>
          <circle cx="5" cy="-5" r="3" fill="#1b1918"/>
        </g>
      );
    })}
    <g style={{ transform: `scale(${1 + Math.sin(time*3)*0.02})`, transformOrigin: '100px 100px' }}>
      <path d="M 100 100 L 20 20 L 50 80 L 10 70 L 60 100 L 10 130 L 50 120 L 20 180 L 100 100 Z" fill="#1b1918" stroke="#9b59b6" strokeWidth="2"/>
      <path d="M 100 100 L 180 20 L 150 80 L 190 70 L 140 100 L 190 130 L 150 120 L 180 180 L 100 100 Z" fill="#1b1918" stroke="#9b59b6" strokeWidth="2"/>
      <path d="M 50 160 L 40 80 L 80 40 L 120 40 L 160 80 L 150 160 Z" fill="#1b1918" stroke="#dfd4ba" strokeWidth="3"/>
      <path d="M 60 100 L 70 150 L 100 170 L 130 150 L 140 100 Z" fill="#2c2a29"/>
      <path d="M 70 150 L 80 120 L 90 160 M 130 150 L 120 120 L 110 160" fill="#dfd4ba"/>
      <circle cx="75" cy="110" r="5" fill="#b84235"/>
      <circle cx="125" cy="110" r="5" fill="#b84235"/>
      <circle cx="85" cy="100" r="4" fill="#b84235"/>
      <circle cx="115" cy="100" r="4" fill="#b84235"/>
      <circle cx="95" cy="90" r="3" fill="#b84235"/>
      <circle cx="105" cy="90" r="3" fill="#b84235"/>
      <path d="M 90 40 L 100 10 L 110 40 Z" fill="#b84235"/>
    </g>
  </svg>
);

// ==========================================
// PLAYERS (3/4 BACK VIEW)
// ==========================================
const HatamotoSVG = ({ className, time }) => {
  const strike = Math.pow(Math.max(0, Math.sin(time * 3)), 12);
  const lunge = strike * -40; // Dash away/up
  const slash = strike * 80; // Sword swing
  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
      <g style={{ transform: `translateY(${Math.sin(time*5)*2 + lunge}px)` }}>
        {/* Katana swinging */}
        <g style={{ transform: `rotate(${slash}deg)`, transformOrigin: '140px 100px' }}>
          <path d="M 140 100 L 160 30" stroke="#dfd4ba" strokeWidth="4" fill="none"/>
          <path d="M 130 110 L 150 90" stroke="#4a90e2" strokeWidth="6" fill="none"/>
        </g>
        {/* Body */}
        <path d="M 50 140 L 40 80 L 100 60 L 160 80 L 150 140 Z" fill="#1b1918" stroke="#4a90e2" strokeWidth="3"/>
        <path d="M 45 100 L 155 100 M 48 120 L 152 120" stroke="#dfd4ba" strokeWidth="2" fill="none"/>
        <path d="M 70 70 C 70 30, 130 30, 130 70 Z" fill="#2c2a29" stroke="#4a90e2" strokeWidth="2"/>
        <path d="M 60 80 Q 100 90 140 80" stroke="#dfd4ba" strokeWidth="3" fill="none"/>
      </g>
    </svg>
  );
};

const YumiSVG = ({ className, time }) => {
  const pull = Math.sin(time * 2);
  const isDrawing = pull > 0;
  const tension = isDrawing ? pull : 0;
  const bowFlex = tension * 20;
  const stringX = 100 - tension * 40;
  const arrowFly = !isDrawing ? Math.abs(pull) * -200 : 0;

  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
      <g style={{ transform: `translateY(${Math.sin(time*5)*2}px)` }}>
        {/* Arrow firing away */}
        {!isDrawing && <path d={`M 100 ${100 + arrowFly} L 100 ${70 + arrowFly}`} stroke="#b84235" strokeWidth="4" />}
        
        {/* Bow */}
        <path d={`M 160 20 Q ${190 - bowFlex} 100 160 180`} stroke="#1b1918" strokeWidth="8" fill="none"/>
        <path d={`M 160 20 Q ${190 - bowFlex} 100 160 180`} stroke="#dfd4ba" strokeWidth="2" fill="none"/>
        
        {/* Dynamic Bowstring */}
        <path d={`M 160 20 L ${stringX} 100 L 160 180`} stroke="#dfd4ba" strokeWidth="1" fill="none"/>
        
        {/* Drawn arrow */}
        {isDrawing && <path d={`M ${stringX} 100 L 160 100`} stroke="#b84235" strokeWidth="4" />}

        {/* Quiver & Body */}
        <path d="M 70 60 L 110 140 L 90 150 L 50 70 Z" fill="#2c2a29" stroke="#4a90e2" strokeWidth="2"/>
        <path d="M 50 60 L 40 30 M 60 55 L 55 25 M 70 65 L 75 35" stroke="#dfd4ba" strokeWidth="2" fill="none"/>
        <path d="M 60 160 L 70 80 L 130 80 L 120 160 Z" fill="#1b1918" stroke="#4a90e2" strokeWidth="3"/>
        <circle cx="100" cy="60" r="25" fill="#1b1918" stroke="#dfd4ba" strokeWidth="2"/>
        <path d="M 100 35 L 90 10 L 110 20 Z" fill="#4a90e2"/>
      </g>
    </svg>
  );
};

const CavalrySVG = ({ className, time }) => {
  const charge = Math.pow(Math.max(0, Math.sin(time * 2.5)), 6);
  const gallop = Math.sin(time * 15) * 5;
  const lunge = charge * -50;
  const leg1 = Math.sin(time * 15) * 10;
  const leg2 = Math.sin(time * 15 + Math.PI) * 10;

  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
      <g style={{ transform: `translateY(${gallop + lunge}px)` }}>
        {/* Horse Head and Neck */}
        <path d="M 85 130 L 90 20 L 110 20 L 115 130 Z" fill="#1b1918" stroke="#2c2a29" strokeWidth="2"/>
        <path d="M 80 20 Q 100 -10 120 20 Z" fill="#2c2a29"/>
        <path d="M 85 30 Q 70 40 80 50 M 85 50 Q 70 60 80 70 M 85 70 Q 70 80 80 90" stroke="#dfd4ba" strokeWidth="3" fill="none"/>
        
        {/* Hind Legs */}
        <path d={`M 70 150 L 55 ${170 + leg1}`} stroke="#1b1918" strokeWidth="12" strokeLinecap="round"/>
        <path d={`M 130 150 L 145 ${170 + leg2}`} stroke="#1b1918" strokeWidth="12" strokeLinecap="round"/>

        {/* Horse Body */}
        <ellipse cx="100" cy="140" rx="55" ry="35" fill="#2c2a29" stroke="#1b1918" strokeWidth="4"/>
        <path d={`M 100 170 Q ${100 + Math.sin(time*10)*20} 210 100 220`} stroke="#dfd4ba" strokeWidth="5" fill="none" strokeLinecap="round"/>

        {/* Spear thrust */}
        <g style={{ transform: `translateY(${charge * -40}px)` }}>
          <path d="M 140 160 L 170 20" stroke="#dfd4ba" strokeWidth="4"/>
          <path d="M 160 30 L 170 10 L 180 30 Z" fill="#b84235"/>
        </g>
        
        {/* Rider */}
        <path d="M 60 120 L 70 50 L 130 50 L 140 120 Z" fill="#1b1918" stroke="#4a90e2" strokeWidth="3"/>
        <path d="M 55 80 L 145 80 M 58 100 L 142 100" stroke="#dfd4ba" strokeWidth="2" fill="none"/>
        <circle cx="100" cy="40" r="18" fill="#1b1918" stroke="#dfd4ba" strokeWidth="2"/>
      </g>
    </svg>
  );
};

const HorokuSVG = ({ className, time }) => {
  const throwCycle = Math.sin(time * 2.5);
  const isThrowing = throwCycle > 0.8;
  const bombFly = isThrowing ? (throwCycle - 0.8) * -300 : 0;
  const bombArc = isThrowing ? Math.sin((throwCycle - 0.8) * 10) * -50 : 0;
  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
      <g style={{ transform: `translateY(${Math.sin(time*4)*2}px)` }}>
        {/* Bomb throwing arc */}
        <g style={{ transform: `translate(${bombArc}px, ${bombFly}px)` }}>
          <circle cx="140" cy="60" r="20" fill="#2c2a29" stroke="#b84235" strokeWidth="3"/>
          <path d="M 140 40 Q 150 20 170 30" stroke="#dfd4ba" strokeWidth="2" fill="none"/>
          <circle cx="170" cy="30" r="4" fill="#dfd4ba" opacity={Math.random() > 0.5 ? 1 : 0.5}/>
        </g>
        {/* Body leans back to throw */}
        <g style={{ transform: `rotate(${isThrowing ? 10 : 0}deg)`, transformOrigin: '100px 160px' }}>
          <path d="M 50 160 L 60 80 L 140 80 L 130 160 Z" fill="#1b1918" stroke="#4a90e2" strokeWidth="3"/>
          <circle cx="100" cy="60" r="20" fill="#1b1918" stroke="#dfd4ba" strokeWidth="2"/>
        </g>
      </g>
    </svg>
  );
};

const ChampionSVG = ({ className, time }) => {
  const strike = Math.pow(Math.max(0, Math.sin(time * 2)), 10);
  const slash = strike * -120; // Massive horizontal sweep
  const lunge = strike * -20;
  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
      <g style={{ transform: `translateY(${Math.sin(time*3)*3 + lunge}px)` }}>
        <path d={`M 60 80 C ${20 + Math.sin(time*4)*20} 140, 40 180, 80 180 L 100 100 Z`} fill="#4a90e2" opacity="0.8"/>
        
        {/* Greatsword Sweep */}
        <g style={{ transform: `rotate(${slash}deg)`, transformOrigin: '100px 100px' }}>
          <path d="M 40 160 L 180 20" stroke="#dfd4ba" strokeWidth="8" fill="none"/>
          <path d="M 175 35 L 195 5 L 165 25 Z" fill="#4a90e2"/> {/* Blade tip */}
        </g>
        
        <path d="M 40 140 L 50 60 L 150 60 L 160 140 Z" fill="#1b1918" stroke="#dfd4ba" strokeWidth="4"/>
        <path d="M 40 100 L 160 100 M 45 120 L 155 120" stroke="#4a90e2" strokeWidth="3" fill="none"/>
        <path d="M 70 50 Q 100 10 130 50 Z" fill="#2c2a29" stroke="#dfd4ba" strokeWidth="2"/>
        <path d="M 80 40 L 50 10 M 120 40 L 150 10" stroke="#dfd4ba" strokeWidth="4" fill="none"/>
      </g>
    </svg>
  );
};

// ==========================================
// ENEMIES (3/4 FRONT VIEW)
// ==========================================
const RebelSVG = ({ className, time }) => {
  const strike = Math.pow(Math.max(0, Math.sin(time * 3)), 8);
  const lunge = strike * 40; // Lunge towards camera (positive Y)
  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
      <g style={{ transform: `translateY(${Math.sin(time*6)*3 + lunge}px) scale(${1 + strike*0.1})` }}>
        {/* Spear thrusts down/forward */}
        <g style={{ transform: `translateY(${strike * 30}px)` }}>
          <path d="M 140 20 L 70 160" stroke="#dfd4ba" strokeWidth="4" fill="none"/>
          <path d="M 80 140 L 60 180 L 50 150 Z" fill="#b84235"/>
        </g>
        <path d="M 60 80 L 140 80 L 120 160 L 80 160 Z" fill="#1b1918" stroke="#b84235" strokeWidth="3"/>
        <path d="M 40 80 Q 100 30 160 80 Q 100 90 40 80 Z" fill="#2c2a29" stroke="#dfd4ba" strokeWidth="2"/>
        <circle cx="90" cy="85" r="3" fill="#b84235"/>
        <circle cx="110" cy="85" r="3" fill="#b84235"/>
      </g>
    </svg>
  );
};

const TenguFlierSVG = ({ className, time }) => {
  const flap = Math.sin(time * 12) * 20; // Aggressive flapping
  const dive = Math.pow(Math.max(0, Math.sin(time * 2.5)), 6) * 50; // Diving attack
  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
      <g style={{ transform: `translateY(${Math.sin(time*6)*5 + dive}px) scale(${1 + dive*0.005})` }}>
        {/* Left Wing Flapping */}
        <g style={{ transform: `rotate(${flap}deg)`, transformOrigin: '80px 100px' }}>
          <path d="M 80 100 Q 20 60 10 120 Q 40 140 80 100" fill="#2c2a29" stroke="#1b1918" strokeWidth="3"/>
        </g>
        {/* Right Wing Flapping */}
        <g style={{ transform: `rotate(${-flap}deg)`, transformOrigin: '120px 100px' }}>
          <path d="M 120 100 Q 180 60 190 120 Q 160 140 120 100" fill="#2c2a29" stroke="#1b1918" strokeWidth="3"/>
        </g>
        <path d="M 70 160 L 80 80 L 120 80 L 130 160 Z" fill="#1b1918" stroke="#b84235" strokeWidth="2"/>
        <circle cx="100" cy="70" r="20" fill="#b84235"/>
        <path d="M 95 70 L 100 100 L 105 70 Z" fill="#dfd4ba"/>
        <circle cx="90" cy="65" r="3" fill="#1b1918"/>
        <circle cx="110" cy="65" r="3" fill="#1b1918"/>
      </g>
    </svg>
  );
};

const OnmyojiSVG = ({ className, time }) => {
  const cast = Math.pow(Math.max(0, Math.sin(time * 3)), 8);
  const magicFly = cast * 100; // Ofuda flies toward camera
  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
      <g style={{ transform: `translateY(${Math.sin(time*2)*5}px)` }}>
        <path d="M 80 80 L 40 140 L 70 180 L 130 180 L 160 140 L 120 80 Z" fill="#1b1918" stroke="#b84235" strokeWidth="2"/>
        <path d="M 85 60 L 90 10 L 110 10 L 115 60 Z" fill="#2c2a29" stroke="#dfd4ba" strokeWidth="2"/>
        <rect x="80" y="60" width="40" height="30" fill="#dfd4ba"/>
        <path d="M 90 70 L 100 80 L 110 70" stroke="#b84235" strokeWidth="2" fill="none"/>
        
        {/* Fired Magic Charm */}
        <g style={{ transform: `translate(${-magicFly*0.5}px, ${Math.sin(time*4)*10 + magicFly}px) scale(${1 + cast})` }}>
          <rect x="140" y="60" width="20" height="40" fill="#dfd4ba" stroke="#b84235" strokeWidth="2" transform="rotate(15 150 80)"/>
          <path d="M 145 65 L 155 75 M 145 75 L 155 85" stroke="#b84235" strokeWidth="2"/>
        </g>
      </g>
    </svg>
  );
};

const ShinobiSVG = ({ className, time }) => {
  const flurry = Math.pow(Math.max(0, Math.sin(time * 5)), 2);
  const dash = Math.sin(time * 2.5) > 0 ? -30 : 30; // Side-to-side dash
  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
      <g style={{ transform: `translate(${dash}px, ${flurry * 20}px) scale(1, ${1 + Math.sin(time*8)*0.05})`, transformOrigin: '100px 160px' }}>
        <path d={`M 110 70 Q 160 ${60 + Math.sin(time*10)*20} 180 90`} stroke="#b84235" strokeWidth="6" fill="none"/>
        <path d="M 50 160 L 70 90 L 120 100 L 130 160 Z" fill="#1b1918" stroke="#2c2a29" strokeWidth="4"/>
        <circle cx="95" cy="75" r="22" fill="#1b1918" stroke="#2c2a29" strokeWidth="3"/>
        <path d="M 80 75 L 110 75" stroke="#dfd4ba" strokeWidth="4" fill="none"/>
        <circle cx="90" cy="75" r="2" fill="#b84235"/>
        <circle cx="100" cy="75" r="2" fill="#b84235"/>
        
        {/* Rapid stabs */}
        <g style={{ transform: `translate(${flurry * 20}px, ${flurry * 30}px)` }}>
          <path d="M 50 100 L 30 50 L 40 40 L 60 90 Z" fill="#dfd4ba" stroke="#1b1918" strokeWidth="1"/>
        </g>
      </g>
    </svg>
  );
};

const GreatOniSVG = ({ className, time }) => {
  const smash = Math.pow(Math.max(0, Math.sin(time * 2)), 8);
  const clubSwing = smash * 90; // Massive downward swing
  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${className}`}>
      <g style={{ transform: `translateY(${smash * 20 - 20}px) scale(${1 + Math.sin(time*4)*0.02 + smash*0.1})`, transformOrigin: '100px 100px' }}>
        {/* Legs */}
        <path d="M 65 150 L 40 200 L 70 210 L 85 160 Z" fill="#b84235" stroke="#1b1918" strokeWidth="3"/>
        <path d="M 40 200 L 30 210 L 50 215 Z" fill="#dfd4ba"/>
        <path d="M 135 150 L 160 200 L 130 210 L 115 160 Z" fill="#b84235" stroke="#1b1918" strokeWidth="3"/>
        <path d="M 160 200 L 170 210 L 150 215 Z" fill="#dfd4ba"/>

        {/* Club Swinging */}
        <g style={{ transform: `rotate(${clubSwing}deg)`, transformOrigin: '120px 140px' }}>
          <path d="M 120 140 L 180 40" stroke="#2c2a29" strokeWidth="15" strokeLinecap="round"/>
          <circle cx="170" cy="50" r="3" fill="#dfd4ba"/>
          <circle cx="160" cy="70" r="3" fill="#dfd4ba"/>
          <circle cx="150" cy="90" r="3" fill="#dfd4ba"/>
        </g>
        
        <path d="M 60 160 L 50 80 L 130 80 L 140 160 Z" fill="#b84235" stroke="#1b1918" strokeWidth="3"/>
        <path d="M 65 160 L 100 200 L 135 160 Z" fill="#dfd4ba" stroke="#1b1918" strokeWidth="2"/>
        <circle cx="90" cy="60" r="25" fill="#b84235" stroke="#1b1918" strokeWidth="2"/>
        <circle cx="80" cy="55" r="4" fill="#dfd4ba"/>
        <circle cx="100" cy="55" r="4" fill="#dfd4ba"/>
        <path d="M 85 70 L 85 60 M 95 70 L 95 60" stroke="#dfd4ba" strokeWidth="3"/>
        <path d="M 90 35 L 110 10 L 105 40 Z" fill="#dfd4ba"/>
      </g>
    </svg>
  );
};

const CHARACTER_ROSTER = [
  // BOSSES (SVG)
  { id: 'goki', category: 'BOSS', name: 'GOKI', title: 'The Mud Golem', Component: GokiSVG },
  { id: 'kasha', category: 'BOSS', name: 'KASHA', title: 'The Ashen Weaver', Component: KashaSVG },
  { id: 'daitengu', category: 'BOSS', name: 'DAITENGU', title: 'The Howling Tempest', Component: DaitenguSVG },
  { id: 'yukionna', category: 'BOSS', name: 'YUKI-ONNA', title: 'The Glacial Maiden', Component: YukionnaSVG },
  { id: 'otakemaru', category: 'BOSS', name: 'OTAKEMARU', title: 'The Calamity of Yomi', Component: OtakemaruSVG },
  
  // PLAYERS (SVG - 3/4 BACK)
  { id: 'hatamoto', category: 'PLAYER', name: 'HATAMOTO', title: 'Heavy Melee', Component: HatamotoSVG },
  { id: 'yumi', category: 'PLAYER', name: 'YUMI ARCHER', title: 'Ranged', Component: YumiSVG },
  { id: 'cavalry', category: 'PLAYER', name: 'CAVALRY', title: 'Mounted', Component: CavalrySVG },
  { id: 'horoku', category: 'PLAYER', name: 'HOROKU', title: 'Siege', Component: HorokuSVG },
  { id: 'champion', category: 'PLAYER', name: 'CHAMPION', title: 'Hero', Component: ChampionSVG },

  // ENEMIES (SVG - 3/4 FRONT)
  { id: 'rebel', category: 'ENEMY', name: 'IKKI REBEL', title: 'Basic Melee', Component: RebelSVG },
  { id: 'tengu', category: 'ENEMY', name: 'TENGU', title: 'Flying', Component: TenguFlierSVG },
  { id: 'onmyoji', category: 'ENEMY', name: 'ONMYOJI', title: 'Support', Component: OnmyojiSVG },
  { id: 'shinobi', category: 'ENEMY', name: 'SHINOBI', title: 'Assassin', Component: ShinobiSVG },
  { id: 'oni', category: 'ENEMY', name: 'GREAT ONI', title: 'Mini Boss', Component: GreatOniSVG },
];

export const BossAnimMock = () => {
  const [activeCharId, setActiveCharId] = useState('goki');
  const [time, setTime] = useState(0);

  // Global animation loop for the SVG properties
  useEffect(() => {
    let animationId;
    const startTime = Date.now();
    const render = () => {
      setTime((Date.now() - startTime) / 1000);
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, []);

  const activeChar = CHARACTER_ROSTER.find(c => c.id === activeCharId);
  const categories = ['BOSS', 'PLAYER', 'ENEMY'];

  return (
    <div className="flex h-full w-full bg-[#1b1918] text-[#dfd4ba]">
      {/* Sidebar */}
      <div className="flex w-72 flex-col border-r border-[#dfd4ba]/20 bg-[#1b1918]/90 z-20 shadow-2xl">
        <div className="p-6 border-b border-[#dfd4ba]/20">
          <h2 className="text-xl font-black tracking-widest text-white">CHARACTER VIEWER</h2>
          <p className="text-xs font-bold text-[#dfd4ba]/50">ROSTER DATABASE</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {categories.map(category => (
            <div key={category} className="space-y-2">
              <div className="text-[10px] font-black tracking-widest text-[#dfd4ba]/40 border-b border-[#dfd4ba]/10 pb-1">
                {category} ROSTER
              </div>
              {CHARACTER_ROSTER.filter(c => c.category === category).map(char => (
                <button
                  key={char.id}
                  onClick={() => setActiveCharId(char.id)}
                  className={`w-full text-left p-3 border transition-colors ${
                    activeCharId === char.id 
                      ? 'bg-[#dfd4ba]/10 border-[#dfd4ba]/30' 
                      : 'bg-transparent border-transparent hover:bg-[#dfd4ba]/5'
                  }`}
                >
                  <div className="text-xs font-bold tracking-widest text-[#dfd4ba]/70">{char.name}</div>
                  <div className="text-[10px] text-white/50 font-serif uppercase tracking-widest">{char.title}</div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(223,212,186,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(223,212,186,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        {/* Perspective Lines */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-[#dfd4ba]/20" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-[#dfd4ba]/20" />
        <div className="absolute inset-x-0 bottom-[15%] h-px border-t border-dashed border-[#dfd4ba]/20" />
        
        {/* Ground Drop Shadow underneath the character */}
        <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-96 h-24 bg-black/60 blur-2xl rounded-full" />

        <div className="absolute top-6 left-6 z-10">
          <div className="text-xs font-bold tracking-widest text-[#dfd4ba]/50">VISUAL ENGINE</div>
          <div className="text-lg font-black text-white tracking-widest">
            PURE SVG ANIMATION
          </div>
        </div>

        {/* The active character component */}
        <div className="relative z-10 w-[500px] h-[500px]">
          <activeChar.Component time={time} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};
