import React, { useState, useEffect } from 'react';

// ------------------------------------------------------------------
// 1. Slash Effect (Swords / Champions)
// ------------------------------------------------------------------
export const SlashEffect = ({ color = '#fff' }) => {
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full animate-[ping_0.3s_ease-out_forwards]">
      <path 
        d="M -30,20 Q 0,-40 30,20 Q 0,-20 -30,20" 
        fill={color} 
        className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
      />
    </svg>
  );
};

// ------------------------------------------------------------------
// 2. Impact Effect (Generic Hit Sparks)
// ------------------------------------------------------------------
export const ImpactEffect = ({ color = '#ffd700' }) => {
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full animate-[ping_0.4s_ease-out_forwards]">
      {[...Array(8)].map((_, i) => (
        <line
          key={i}
          x1="0" y1="0"
          x2="0" y2="-40"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(${i * 45})`}
          className="drop-shadow-[0_0_5px_currentColor]"
        />
      ))}
      <circle cx="0" cy="0" r="10" fill="#fff" />
    </svg>
  );
};

// ------------------------------------------------------------------
// 3. Chakra Aura (Magic / Spawning / Onmyoji)
// ------------------------------------------------------------------
export const ChakraEffect = ({ color = '#00ffff' }) => {
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full animate-[spin_4s_linear_infinite]">
      <circle cx="0" cy="0" r="45" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      <circle cx="0" cy="0" r="35" fill="none" stroke={color} strokeWidth="2" strokeDasharray="10 5" />
      {[...Array(6)].map((_, i) => (
        <polygon 
          key={i}
          points="0,-40 5,-30 -5,-30" 
          fill={color}
          transform={`rotate(${i * 60})`}
        />
      ))}
      <circle cx="0" cy="0" r="25" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2 4" />
      {/* Inner slow reverse spin */}
      <g className="animate-[spin_6s_linear_infinite_reverse]" style={{ transformOrigin: 'center' }}>
        <rect x="-15" y="-15" width="30" height="30" fill="none" stroke={color} strokeWidth="1" transform="rotate(45)" />
        <rect x="-15" y="-15" width="30" height="30" fill="none" stroke={color} strokeWidth="1" />
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------
// 3b. Summoning Chakra (Complex Hexagram Floor Aura)
// ------------------------------------------------------------------
export const SummoningChakraEffect = ({ color = '#a855f7' }) => {
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full" style={{ perspective: '500px' }}>
      <g className="animate-[spin_8s_linear_infinite]" style={{ transformOrigin: 'center', transform: 'rotateX(60deg)' }}>
        {/* Outer pulsing ring */}
        <circle cx="0" cy="0" r="48" fill="none" stroke={color} strokeWidth="2" className="animate-[pulse_2s_ease-in-out_infinite]" />
        
        {/* Hexagram (Two intersecting triangles) */}
        <polygon points="0,-40 34.6,20 -34.6,20" fill="none" stroke={color} strokeWidth="1.5" />
        <polygon points="0,40 34.6,-20 -34.6,-20" fill="none" stroke={color} strokeWidth="1.5" />
        
        {/* Inner rotating runes/dots */}
        <g className="animate-[spin_4s_linear_infinite_reverse]" style={{ transformOrigin: 'center' }}>
          {[...Array(12)].map((_, i) => (
            <circle key={i} cx="0" cy="-25" r="1.5" fill={color} transform={`rotate(${i * 30})`} />
          ))}
        </g>
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------
// 3c. Fire Chakra (Raging Aura below unit)
// ------------------------------------------------------------------
export const FireChakraEffect = ({ color = '#f97316' }) => {
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full">
      <g style={{ transformOrigin: 'center', transform: 'rotateX(60deg)' }}>
        <circle cx="0" cy="0" r="40" fill="none" stroke={color} strokeWidth="2" opacity="0.3" />
        <g className="animate-[spin_2s_linear_infinite]" style={{ transformOrigin: 'center' }}>
          {[...Array(8)].map((_, i) => (
            <path 
              key={i}
              d="M 0,-20 Q 15,-35 0,-45 Q -5,-35 0,-20" 
              fill={color}
              transform={`rotate(${i * 45})`}
              className="animate-[pulse_0.5s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </g>
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------
// 3d. Dark Chakra (Demonic / Boss Aura)
// ------------------------------------------------------------------
export const DarkChakraEffect = ({ color = '#8b0000' }) => {
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full">
      <g className="animate-[spin_5s_linear_infinite_reverse]" style={{ transformOrigin: 'center', transform: 'rotateX(60deg)' }}>
        <circle cx="0" cy="0" r="45" fill="none" stroke={color} strokeWidth="4" strokeDasharray="20 10 5 10" />
        <g className="animate-[spin_3s_linear_infinite]" style={{ transformOrigin: 'center' }}>
          {[...Array(5)].map((_, i) => (
            <path 
              key={i}
              d="M 0,-15 L 10,-45 L -5,-35 Z" 
              fill={color}
              transform={`rotate(${i * 72})`}
              className="drop-shadow-[0_0_10px_currentColor]"
            />
          ))}
        </g>
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------
// 4. Explosion Effect (Bombs / Horoku)
// ------------------------------------------------------------------
export const ExplosionEffect = ({ color = '#ff4500' }) => {
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full">
      <circle 
        cx="0" cy="0" r="40" 
        fill={color} 
        className="animate-[ping_0.5s_cubic-bezier(0,0,0.2,1)_forwards] opacity-70"
      />
      <circle 
        cx="0" cy="0" r="20" 
        fill="#ffff00" 
        className="animate-[ping_0.3s_cubic-bezier(0,0,0.2,1)_forwards] opacity-90"
      />
      <circle 
        cx="0" cy="0" r="10" 
        fill="#ffffff" 
      />
    </svg>
  );
};

// ------------------------------------------------------------------
// 4b. Poison Explosion (Toxic / Bubbling)
// ------------------------------------------------------------------
export const PoisonExplosionEffect = ({ color = '#84cc16' }) => {
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full">
      <circle cx="0" cy="0" r="30" fill={color} className="animate-[ping_0.8s_ease-out_forwards] opacity-60" />
      {[...Array(5)].map((_, i) => {
        const angle = i * 72 * (Math.PI / 180);
        const x = Math.cos(angle) * 15;
        const y = Math.sin(angle) * 15;
        return (
          <circle 
            key={i} cx={x} cy={y} r="15" fill="#4d7c0f"
            className="animate-[ping_0.6s_ease-out_forwards]"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        );
      })}
    </svg>
  );
};

// ------------------------------------------------------------------
// 4c. Nova Blast (Bright high-energy explosion)
// ------------------------------------------------------------------
export const NovaExplosionEffect = ({ color = '#0ea5e9' }) => {
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full">
      <circle cx="0" cy="0" r="10" fill="#fff" className="animate-[ping_0.2s_ease-out_forwards]" />
      <g className="animate-[spin_1s_ease-out_forwards]">
        {[...Array(8)].map((_, i) => (
          <polygon 
            key={i}
            points="-2,-10 2,-10 0,-40" 
            fill={color}
            transform={`rotate(${i * 45})`}
            className="animate-[ping_0.4s_ease-out_forwards]"
          />
        ))}
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------
// 4d. Smoke Bomb (Shinobi / Ninja escape)
// ------------------------------------------------------------------
export const SmokeBombEffect = ({ color = '#64748b' }) => {
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full">
      {[...Array(4)].map((_, i) => {
        const x = (Math.random() - 0.5) * 20;
        const y = (Math.random() - 0.5) * 20;
        return (
          <circle 
            key={i} cx={x} cy={y} r="25" fill={color}
            className="animate-[ping_1s_ease-out_forwards] opacity-80"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        );
      })}
    </svg>
  );
};

// ------------------------------------------------------------------
// 5. Arrow Trail (Yumi / Projectiles)
// ------------------------------------------------------------------
export const ArrowTrailEffect = ({ color = '#ffffff' }) => {
  // Arrow shooting across horizontally
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full">
      <g className="animate-[slideRight_0.4s_ease-in_forwards]">
        <line x1="-40" y1="0" x2="0" y2="0" stroke={color} strokeWidth="2" strokeDasharray="40 0" opacity="0.6" />
        <line x1="-20" y1="0" x2="20" y2="0" stroke={color} strokeWidth="4" />
        <polygon points="20,-4 30,0 20,4" fill={color} />
      </g>
      <style>{`
        @keyframes slideRight {
          0% { transform: translateX(-50px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(50px); opacity: 0; }
        }
      `}</style>
    </svg>
  );
};

// ------------------------------------------------------------------
// 6. Buff / Heal Aura (Upward floating particles)
// ------------------------------------------------------------------
export const HealAuraEffect = ({ color = '#32cd32' }) => {
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full">
      {[...Array(8)].map((_, i) => {
        const delay = (i * 0.2).toFixed(1);
        const xPos = -30 + Math.random() * 60;
        return (
          <circle 
            key={i}
            cx={xPos} 
            cy="40" 
            r={2 + Math.random() * 3} 
            fill={color}
            className="opacity-0 drop-shadow-[0_0_3px_currentColor]"
            style={{ 
              animation: `floatUp 1.5s ease-in infinite ${delay}s` 
            }}
          />
        );
      })}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          50% { opacity: 1; transform: translateY(-40px) scale(1); }
          100% { transform: translateY(-80px) scale(0); opacity: 0; }
        }
      `}</style>
    </svg>
  );
};

// ------------------------------------------------------------------
// The Mock Screen Renderer
// ------------------------------------------------------------------
export const EffectsMock = () => {
  // We use a state key to force-re-render the CSS animations so they "play" again
  const [triggerCount, setTriggerCount] = useState(0);

  const library = [
    { name: 'Slash Effect (Sword)', Component: SlashEffect, color: '#e2e8f0', bg: '#1a202c' },
    { name: 'Impact Sparks (Hit)', Component: ImpactEffect, color: '#f59e0b', bg: '#371717' },
    { name: 'Basic Chakra (Magic)', Component: ChakraEffect, color: '#38bdf8', bg: '#082f49' },
    { name: 'Summoning Floor Chakra', Component: SummoningChakraEffect, color: '#a855f7', bg: '#2e1065' },
    { name: 'Fire Floor Chakra', Component: FireChakraEffect, color: '#f97316', bg: '#431407' },
    { name: 'Dark Demonic Chakra', Component: DarkChakraEffect, color: '#dc2626', bg: '#2a0606' },
    { name: 'Standard Explosion', Component: ExplosionEffect, color: '#ef4444', bg: '#450a0a' },
    { name: 'Poison Explosion', Component: PoisonExplosionEffect, color: '#84cc16', bg: '#14532d' },
    { name: 'Nova Blast', Component: NovaExplosionEffect, color: '#0ea5e9', bg: '#082f49' },
    { name: 'Smoke Bomb', Component: SmokeBombEffect, color: '#64748b', bg: '#0f172a' },
    { name: 'Arrow Trail (Bow)', Component: ArrowTrailEffect, color: '#cbd5e1', bg: '#1e293b' },
    { name: 'Buff/Heal (Aura)', Component: HealAuraEffect, color: '#22c55e', bg: '#064e3b' },
  ];

  return (
    <div className="w-full h-full bg-[#1b1918] p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b-2 border-[#5c4a3d] pb-4">
          <div>
            <h1 className="text-4xl font-black text-[#dfd4ba] tracking-widest">VFX LIBRARY</h1>
            <p className="text-white/50 mt-2">Pure SVG & CSS animations for auto-battler abilities.</p>
          </div>
          <button 
            onClick={() => setTriggerCount(c => c + 1)}
            className="px-6 py-3 bg-[#b84235] text-white font-bold rounded hover:bg-red-600 transition-colors shadow-lg"
          >
            TRIGGER ALL ANIMATIONS
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {library.map((fx, idx) => (
            <div key={`${fx.name}-${triggerCount}`} className="flex flex-col rounded-xl overflow-hidden shadow-2xl border-2 border-[#5c4a3d]">
              <div className="p-3 bg-[#2c2a29] border-b-2 border-[#5c4a3d]">
                <h3 className="text-lg font-bold text-[#dfd4ba] text-center">{fx.name}</h3>
              </div>
              <div 
                className="h-64 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: fx.bg }}
              >
                {/* A mock dummy unit silhoutte in the background for scale context */}
                <svg className="absolute w-24 h-24 opacity-20 pointer-events-none" viewBox="-50 -50 100 100">
                   <rect x="-15" y="-10" width="30" height="50" rx="10" fill="#fff" />
                   <circle cx="0" cy="-25" r="15" fill="#fff" />
                </svg>
                
                {/* The actual VFX */}
                <div className="w-48 h-48 relative z-10">
                  <fx.Component color={fx.color} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
