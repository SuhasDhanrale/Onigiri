import { useState } from 'react';
import { Info, Shield, Zap, Heart } from 'lucide-react';

// --- CUSTOM SVG DEMON VISUALS ---

const GokiVisual = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    {/* Blocky, golem-like head */}
    <path d="M20 80 L25 30 L40 15 L60 15 L75 30 L80 80 Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="bevel" />
    <path d="M25 30 L75 30" stroke="currentColor" strokeWidth="4" strokeLinejoin="bevel" />
    <path d="M40 15 L40 30 M60 15 L60 30" stroke="currentColor" strokeWidth="4" />
    {/* Glowing slit eyes */}
    <path d="M35 50 L45 55 L35 60 Z" fill="#b84235" />
    <path d="M65 50 L55 55 L65 60 Z" fill="#b84235" />
    {/* Cracks / Mud texture */}
    <path d="M30 80 L35 65 L28 55 M70 80 L65 65 L72 55 M45 80 L50 70 L45 65" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
  </svg>
);

const KashaVisual = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    {/* Blazing Wheel */}
    <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="6" />
    <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
    {/* Demonic Eye in center */}
    <path d="M35 50 Q50 35 65 50 Q50 65 35 50" stroke="currentColor" strokeWidth="3" />
    <circle cx="50" cy="50" r="4" fill="#b84235" />
    {/* Fire/Ash trails spinning */}
    <path d="M25 50 Q10 40 15 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M75 50 Q90 60 85 80" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M50 25 Q60 10 80 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M50 75 Q40 90 20 85" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const DaitenguVisual = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    {/* Tengu Mask / Beak */}
    <path d="M30 20 Q50 10 70 20 L80 50 Q50 90 20 50 Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    {/* Long nose or beak */}
    <path d="M50 40 Q55 60 50 85 Q45 60 50 40" fill="currentColor" />
    {/* Angry Eyes */}
    <path d="M35 35 L45 40 L35 45 Z M65 35 L55 40 L65 45 Z" fill="#b84235" />
    {/* Wind/Feather motifs */}
    <path d="M20 30 Q10 40 5 35 M80 30 Q90 40 95 35 M15 50 Q5 60 10 70 M85 50 Q95 60 90 70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const YukionnaVisual = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    {/* Frozen, sharp female face / Ice crown */}
    <path d="M25 25 L50 10 L75 25 L80 60 L50 90 L20 60 Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="miter" />
    {/* Sharp internal facets (ice crystals) */}
    <path d="M50 10 L50 90 M25 25 L75 25 M20 60 L80 60" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
    {/* Cold, piercing eyes */}
    <path d="M35 45 L45 42 L35 48 Z M65 45 L55 42 L65 48 Z" fill="#b84235" />
    {/* Frost aura */}
    <path d="M50 0 L50 5 M10 15 L15 20 M90 15 L85 20 M0 50 L5 50 M100 50 L95 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const OtakemaruVisual = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    {/* Terrifying multi-horned Oni Mask */}
    <path d="M15 40 Q50 90 85 40 Q85 15 50 30 Q15 15 15 40 Z" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
    {/* Multiple Horns */}
    <path d="M25 35 Q10 10 5 5 Q20 5 35 25 M75 35 Q90 10 95 5 Q80 5 65 25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M40 30 Q40 5 50 0 Q60 5 60 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    {/* Fangs & Mouth */}
    <path d="M35 65 Q50 75 65 65" stroke="currentColor" strokeWidth="3" />
    <path d="M40 67 L45 80 L50 69 M60 67 L55 80 L50 69" fill="currentColor" />
    {/* Six Eyes */}
    <circle cx="35" cy="45" r="3" fill="#b84235" />
    <circle cx="65" cy="45" r="3" fill="#b84235" />
    <circle cx="42" cy="52" r="2" fill="#b84235" />
    <circle cx="58" cy="52" r="2" fill="#b84235" />
    <circle cx="25" cy="50" r="2" fill="#b84235" />
    <circle cx="75" cy="50" r="2" fill="#b84235" />
  </svg>
);

const DEMONS = [
  {
    id: 'goki',
    tier: 'I',
    name: 'GOKI',
    title: 'The Mud Golem',
    theme: 'Earth / Explosives',
    icon: GokiVisual,
    color: '#8b7355',
    stats: { hp: 90, speed: 20, attack: 70 },
    description: 'A massive, lumbering golem of animated river sludge and bedrock. It relies on its immense durability to absorb damage while marching forward.',
    powerUpName: 'Detonation Mines',
    powerUpDesc: 'Throws explosive mud-bombs across the battlefield. If player units step on them, they detonate for AoE damage and slow.'
  },
  {
    id: 'kasha',
    tier: 'II',
    name: 'KASHA',
    title: 'The Ashen Weaver',
    theme: 'Fire / Speed',
    icon: KashaVisual,
    color: '#b84235',
    stats: { hp: 40, speed: 95, attack: 85 },
    description: 'A fiery phantom wrapped in burning ash. She does not walk directly to the tower; instead, she moves in erratic arcs to maximize disruption.',
    powerUpName: 'Fireballs & Trails',
    powerUpDesc: 'Leaves a persistent, damaging wall of fire in her erratic wake. Occasionally lobs Fireballs directly at player structures.'
  },
  {
    id: 'daitengu',
    tier: 'III',
    name: 'DAITENGU',
    title: 'The Howling Tempest',
    theme: 'Storm / Lightning',
    icon: DaitenguVisual,
    color: '#4a90e2',
    stats: { hp: 60, speed: 75, attack: 80 },
    description: 'A winged horror that rides the howling winds. It possesses high evasion against projectiles and flies directly over ground traps.',
    powerUpName: 'Lightning Strikes',
    powerUpDesc: 'Calls down targeted lightning bolts from the stormy sky that heavily damage clustered player units and temporarily stun them.'
  },
  {
    id: 'yukionna',
    tier: 'IV',
    name: 'YUKI-ONNA',
    title: 'The Glacial Maiden',
    theme: 'Ice / Freeze',
    icon: YukionnaVisual,
    color: '#a0c4ff',
    stats: { hp: 80, speed: 40, attack: 60 },
    description: 'A chilling apparition from the frozen iron mines. Her mere presence slowly chills nearby units, drastically reducing their attack speed.',
    powerUpName: 'Deep Freeze',
    powerUpDesc: 'Unleashes a blast of pure frost that completely freezes player units in a wide area, rendering them unable to move or attack for several seconds.'
  },
  {
    id: 'otakemaru',
    tier: 'V',
    name: 'OTAKEMARU',
    title: 'The Calamity of Yomi',
    theme: 'Void / Master of Elements',
    icon: OtakemaruVisual,
    color: '#9b59b6',
    stats: { hp: 100, speed: 85, attack: 100 },
    description: 'The ultimate demon lord. He is completely immune to all forms of crowd control (stuns, slows, freezes) and unleashes devastating mixed attacks.',
    powerUpName: 'Eclipse & Elemental Chaos',
    powerUpDesc: 'Plunges the battlefield into darkness (disabling new deployments) and rapidly cycles through the powers of the previous 4 bosses.'
  }
];

export const DemonsMock = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeDemon = DEMONS[selectedIndex];
  const Icon = activeDemon.icon;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1b1918] font-sans text-[#dfd4ba]">
      {/* Background with dynamic tint based on selected demon */}
      <div 
        className="absolute inset-0 transition-colors duration-1000 opacity-[0.03]"
        style={{ backgroundColor: activeDemon.color }}
      />
      
      {/* Grid Pattern overlay for tech/compendium feel */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(223,212,186,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(223,212,186,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 flex h-full flex-col p-10">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#dfd4ba]/20 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-widest text-white">DEMON COMPENDIUM</h1>
            <p className="mt-1 text-sm font-bold tracking-widest text-[#dfd4ba]/50">THREAT LEVEL DATABASE</p>
          </div>
          <div className="flex items-center gap-3 bg-[#dfd4ba]/10 px-4 py-2 border border-[#dfd4ba]/20">
            <Info size={16} className="text-[#b84235]" />
            <span className="text-xs font-bold tracking-widest text-[#dfd4ba]/70">CLASSIFIED DATA</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mt-8 flex flex-1 gap-12">
          
          {/* Left Column: Visual/Title */}
          <div className="flex w-1/3 flex-col justify-center border-r border-[#dfd4ba]/10 pr-12 transition-all duration-500" key={activeDemon.id}>
            <div className="text-xs font-black tracking-widest text-[#dfd4ba]/50">TIER {activeDemon.tier} THREAT</div>
            <h2 className="mt-2 text-6xl font-black tracking-tighter text-white" style={{ fontFamily: 'serif', color: activeDemon.color }}>
              {activeDemon.name}
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <Icon size={24} style={{ color: activeDemon.color }} />
              <div className="text-lg font-bold tracking-widest text-white">{activeDemon.title}</div>
            </div>
            <div className="mt-2 text-xs font-bold tracking-widest text-[#dfd4ba]/50">{activeDemon.theme.toUpperCase()}</div>
          </div>

          {/* Right Column: Stats & Data */}
          <div className="flex flex-1 flex-col justify-center space-y-10 pl-4 animate-in fade-in duration-500" key={`data-${activeDemon.id}`}>
            
            {/* Description */}
            <div className="border-l-2 pl-6" style={{ borderColor: activeDemon.color }}>
              <p className="text-lg leading-relaxed text-[#dfd4ba]/80">{activeDemon.description}</p>
            </div>

            {/* Power Up Card */}
            <div className="bg-[#dfd4ba]/5 border border-[#dfd4ba]/10 p-6 relative overflow-hidden">
               {/* Decorative background icon */}
               <Icon size={120} className="absolute -right-10 -bottom-10 opacity-5" style={{ color: activeDemon.color }} />
               
               <div className="relative z-10">
                 <div className="text-xs font-bold tracking-widest text-[#b84235] mb-2">UNIQUE MECHANIC</div>
                 <h3 className="text-2xl font-black tracking-wide text-white mb-3">{activeDemon.powerUpName}</h3>
                 <p className="text-sm leading-relaxed text-[#dfd4ba]/70">{activeDemon.powerUpDesc}</p>
               </div>
            </div>

            {/* Stat Bars */}
            <div className="grid grid-cols-3 gap-8 pt-4 border-t border-[#dfd4ba]/10">
              <StatBar label="DURABILITY" icon={<Heart size={16} />} value={activeDemon.stats.hp} color={activeDemon.color} />
              <StatBar label="AGILITY" icon={<Zap size={16} />} value={activeDemon.stats.speed} color={activeDemon.color} />
              <StatBar label="LETHALITY" icon={<Shield size={16} />} value={activeDemon.stats.attack} color={activeDemon.color} />
            </div>

          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-8 flex gap-4 border-t border-[#dfd4ba]/20 pt-6">
          {DEMONS.map((demon, idx) => {
            const isSelected = selectedIndex === idx;
            const NavIcon = demon.icon;
            return (
              <button
                key={demon.id}
                onClick={() => setSelectedIndex(idx)}
                className={`flex-1 flex items-center justify-center gap-3 py-4 border transition-all ${
                  isSelected 
                    ? 'bg-[#dfd4ba]/10 text-white' 
                    : 'border-[#dfd4ba]/10 bg-transparent text-[#dfd4ba]/50 hover:bg-[#dfd4ba]/5'
                }`}
                style={{ borderColor: isSelected ? demon.color : undefined }}
              >
                <NavIcon size={18} style={{ color: isSelected ? demon.color : undefined }} />
                <span className="text-xs font-black tracking-widest">{demon.name}</span>
              </button>
            );
          })}
        </div>
        
      </div>
    </div>
  );
};

const StatBar = ({ label, icon, value, color }) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2 mb-2 text-[#dfd4ba]/70">
      {icon}
      <span className="text-xs font-bold tracking-widest">{label}</span>
    </div>
    <div className="h-2 w-full bg-[#dfd4ba]/10 overflow-hidden relative">
      <div 
        className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out" 
        style={{ width: `${value}%`, backgroundColor: color }} 
      />
    </div>
  </div>
);
