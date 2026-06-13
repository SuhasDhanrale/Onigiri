import { useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Map,
  Play,
  RotateCcw,
  ScrollText,
  Skull,
  Sword,
  X,
  Zap,
} from 'lucide-react';

const STEPS = [
  {
    id: 'opening_monologue',
    stage: 'monologue',
    label: 'Story',
    title: 'Set The War',
    body: 'Open with a short backstory so the player understands why the campaign begins before they see systems.',
    target: 'monologue-card',
    placement: 'left',
  },
  {
    id: 'home_start',
    stage: 'home',
    label: 'Home',
    title: 'Start The Campaign',
    body: 'Choose a chapter, clear nodes, and defeat the demon boss.',
    target: 'play',
    placement: 'left',
  },
  {
    id: 'map_select_node',
    stage: 'map',
    label: 'Map',
    title: 'Pick A Route',
    body: 'Each node is a choice. Check threat, waves, and rewards before beginning an encounter.',
    target: 'map-node',
    placement: 'left',
  },
  {
    id: 'map_upgrades',
    stage: 'map',
    label: 'Upgrades',
    title: 'Check The Dojo',
    body: 'The map screen is also where players spend Honor, equip heirlooms, and prepare long-term upgrades.',
    target: 'upgrades',
    placement: 'left',
  },
  {
    id: 'node_detail',
    stage: 'map',
    label: 'Node',
    title: 'Commit To The Encounter',
    body: 'The node card shows what the next choice asks of the player. Optional node types can live in the tutorial book.',
    target: 'node-card',
    placement: 'left',
  },
  {
    id: 'combat_command',
    stage: 'combat',
    label: 'Command',
    title: 'Spend Command',
    body: 'Command is your battle currency. Spend it to strengthen your army before enemies arrive.',
    target: 'command-panel',
    placement: 'left',
  },
  {
    id: 'combat_spell_crisis',
    stage: 'combat',
    label: 'Spells',
    title: 'Try A Free Spell',
    body: 'Combat keeps moving. Your first tutorial spell is free: use Thunder for a few tough enemies, or Fox Fire when enemies crowd the gate approach.',
    target: 'spell-shrine',
    placement: 'left',
  },
];

const STAGE_LABELS = {
  monologue: 'Opening Story',
  home: 'Home Screen',
  map: 'Conquest Map',
  combat: 'Combat',
};

const TARGETS = {
  'monologue-card': 'left-1/2 top-1/2 h-[440px] w-[520px] -translate-x-1/2 -translate-y-1/2',
  play: 'left-[7%] bottom-[16%] h-[92px] w-[340px]',
  'map-node': 'left-[35%] top-[39%] h-[86px] w-[86px]',
  upgrades: 'right-[5%] top-[5%] h-[66px] w-[220px]',
  'node-card': 'right-[5%] bottom-[7%] h-[255px] w-[350px]',
  'command-panel': 'right-[0%] top-[0%] h-full w-[31%]',
  'spell-shrine': 'right-[2%] top-[18%] h-[110px] w-[27%]',
};

const BOOK_SECTIONS = [
  {
    title: 'Story',
    icon: ScrollText,
    rows: [
      ['Premise', 'The shrines are silent, demon roads are opening, and the player commands the last loyal garrison.'],
      ['Delivery', 'Use a short skippable monologue before the first home/menu decision.'],
    ],
  },
  {
    title: 'Upgrades',
    icon: BookOpen,
    rows: [
      ['Honor', 'Long-term currency earned across attempts. Spend it from the map hub, not during combat.'],
      ['Heirlooms', 'Equippable permanent items that change the next run.'],
      ['Dojo', 'Permanent techniques and unit unlock context belong here.'],
    ],
  },
  {
    title: 'Map Nodes',
    icon: Map,
    rows: [
      ['Shop', 'A reference entry is enough: spend Command for run upgrades, recruits, or curse removal.'],
      ['Rest', 'Explain as preparation: garrison, blessing, purification. No forced popup needed.'],
      ['Event', 'Explain as risk/reward choices. Save detailed outcomes for the event screen itself.'],
    ],
  },
  {
    title: 'Enemies',
    icon: Sword,
    rows: [
      ['Ikki Rebel', 'Weak melee pressure. Teaches frontline basics.'],
      ['Tengu Flier', 'Flying threat. Teaches why ranged units matter.'],
      ['Onmyoji', 'Support enemy. Teaches target priority.'],
      ['Shinobi', 'Fast assassin. Teaches emergency response.'],
    ],
  },
  {
    title: 'Bosses',
    icon: Skull,
    rows: [
      ['Goki', 'First chapter boss. Slow, readable, teaches warnings and spacing.'],
      ['Boss Rule', 'Boss details should live in the book before the fight, while combat only shows urgent warnings.'],
    ],
  },
];

const clampIndex = (value) => Math.max(0, Math.min(STEPS.length - 1, value));

function TutorialCoach({ step, index, skipped, onPrev, onNext, onSkip, onRestart }) {
  const isLast = index === STEPS.length - 1;
  const placementClass = step.placement === 'right'
    ? 'right-5 top-1/2 -translate-y-1/2'
    : 'left-5 top-1/2 -translate-y-1/2';

  if (skipped) {
    return (
      <div className="absolute bottom-5 left-5 z-50 w-[280px] border border-[#d4af37]/40 bg-[#0a0908]/95 p-4 text-[#dfd4ba] shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#8b8574]">Tutorial skipped</p>
        <button
          onClick={onRestart}
          className="mt-3 flex items-center gap-2 border border-[#d4af37]/40 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#d4af37] hover:bg-[#d4af37]/10"
        >
          <RotateCcw size={13} />
          Restart mock flow
        </button>
      </div>
    );
  }

  return (
    <div className={`absolute z-50 w-[310px] border border-[#d4af37]/45 bg-[#0a0908]/95 text-[#dfd4ba] shadow-[0_25px_80px_rgba(0,0,0,0.85)] ${placementClass}`}>
      <div className="border-b border-[#d4af37]/20 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#b84235]">{step.label}</p>
          <p className="text-[9px] font-black text-[#8b8574]">{index + 1}/{STEPS.length}</p>
        </div>
        <h2 className="mt-1 text-lg font-black uppercase tracking-wide text-white">{step.title}</h2>
      </div>

      <div className="px-5 py-4">
        <p className="text-sm font-bold leading-relaxed text-[#dfd4ba]/85">{step.body}</p>
        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            onClick={onSkip}
            className="flex items-center gap-1 px-2 py-2 text-[10px] font-black uppercase tracking-widest text-[#8b8574] hover:text-white"
          >
            <X size={12} />
            Skip
          </button>
          <div className="flex gap-2">
            <button
              onClick={onPrev}
              disabled={index === 0}
              className="flex h-9 w-9 items-center justify-center border border-[#8b8574]/30 text-[#dfd4ba] disabled:opacity-30"
              aria-label="Previous tutorial step"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              onClick={onNext}
              className="flex items-center gap-2 bg-[#b84235] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#d65242]"
            >
              {isLast ? 'Done' : 'Next'}
              {isLast ? <Check size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TargetHighlight({ step, showLabels }) {
  const targetClass = TARGETS[step.target];
  if (!targetClass) return null;

  return (
    <>
      <div className="absolute inset-0 z-40 bg-black/28 pointer-events-none" />
      <div
        className={`absolute z-40 border-2 border-[#d4af37] shadow-[0_0_0_9999px_rgba(0,0,0,0.18),0_0_28px_rgba(212,175,55,0.75)] pointer-events-none ${targetClass}`}
      >
        <div className="absolute inset-[-8px] border border-[#d4af37]/40 animate-pulse" />
        {showLabels && (
          <div className="absolute -top-8 left-0 bg-[#d4af37] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#1b1918]">
            {step.target}
          </div>
        )}
      </div>
    </>
  );
}

function MonologueStage() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#090807] font-serif text-[#dfd4ba]">
      <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: 'url(/assets/oni_bg.png)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090807]/95 via-[#1b1918]/85 to-[#090807]/95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(184,66,53,0.18),_transparent_58%)]" />

      <div data-tutorial-target="monologue-card" className="relative z-10 w-[520px] border border-[#d4af37]/35 bg-[#0a0908]/88 shadow-[0_35px_90px_rgba(0,0,0,0.9)]">
        <div className="border-b border-[#d4af37]/20 px-8 py-6 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#b84235]">Opening Monologue</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.18em] text-white">The Last Rice Banner</h1>
        </div>
        <div className="space-y-4 px-8 py-7 text-[15px] font-semibold leading-relaxed text-[#dfd4ba]/88">
          <p>The mountain shrines have gone silent. Villages burn without smoke, and every road to the capital carries stories of masks, curses, and hungry spirits.</p>
          <p>You command the last loyal garrison. Gather soldiers, spend Honor wisely, and cut a path through the demon war before the capital falls.</p>
        </div>
        <div className="border-t border-[#8b8574]/20 px-8 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8b8574]">Design note: keep this under 20 seconds, skippable, and replayable from the tutorial book.</p>
        </div>
      </div>
    </div>
  );
}

function HomeStage() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1b1918] font-sans text-[#dfd4ba]">
      <div className="absolute inset-0 bg-cover bg-center opacity-45" style={{ backgroundImage: 'url(/assets/oni_bg.png)' }} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1b1918] via-[#1b1918]/70 to-transparent" />
      <div className="relative z-10 flex h-full flex-col px-10 py-8">
        <div className="flex-1">
          <h1 className="mt-10 text-7xl font-black tracking-normal text-white drop-shadow-lg" style={{ fontFamily: 'serif' }}>ONIGIRI</h1>
          <p className="mt-2 text-xl font-bold tracking-widest text-[#b84235]">DEMON'S WRATH</p>
        </div>
        <div className="mb-12 flex flex-col gap-6">
          <button className="group flex w-fit items-center gap-3 text-left text-xl font-black tracking-widest text-[#dfd4ba]/75">
            CHAPTER SELECT
            <ChevronRight size={22} className="text-[#b84235]" />
          </button>
          <button data-tutorial-target="play" className="flex w-fit items-center gap-5 border-l-4 border-[#b84235] bg-[#dfd4ba]/5 py-4 pl-5 pr-8 text-left backdrop-blur-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#b84235] text-white shadow-[0_0_20px_rgba(184,66,53,0.5)]">
              <Play size={24} fill="currentColor" className="ml-1" />
            </span>
            <span>
              <span className="block text-3xl font-black tracking-widest text-white">PLAY</span>
              <span className="mt-1 block text-xs font-bold tracking-wider text-[#dfd4ba]/70">CONTINUE - SAKURA RIVERLANDS</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MapStage() {
  const nodes = [
    { id: 'start', x: 50, y: 86, type: 'capital', label: 'Capital', done: true },
    { id: 'river', x: 35, y: 39, type: 'combat', label: 'Bandit Camp', active: true },
    { id: 'event', x: 62, y: 50, type: 'event', label: 'Fox Spirit' },
    { id: 'shop', x: 76, y: 29, type: 'shop', label: 'Merchant' },
    { id: 'boss', x: 50, y: 12, type: 'boss', label: 'Goki Cave' },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0908] font-serif text-[#dfd4ba]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#211310_0%,_#0a0908_72%)]" />
      <div className="absolute left-8 top-6 z-10">
        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b84235]">Stronghold Hub</p>
        <h1 className="mt-1 text-3xl font-black uppercase tracking-[0.18em]">Conquest Map</h1>
      </div>
      <button data-tutorial-target="upgrades" className="absolute right-8 top-6 z-30 flex h-[66px] w-[220px] items-center gap-3 border border-[#d4af37]/35 bg-[#1a1816]/95 px-4 text-left shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#d4af37]/40 bg-[#0a0908] text-[#d4af37]">
          <BookOpen size={20} />
        </span>
        <span>
          <span className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#d4af37]">Upgrades</span>
          <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-[#dfd4ba]/60">Honor, heirlooms, dojo</span>
        </span>
      </button>
      <svg className="absolute inset-0 z-0 h-full w-full">
        <line x1="50%" y1="86%" x2="35%" y2="39%" stroke="#b84235" strokeWidth="2" />
        <line x1="35%" y1="39%" x2="62%" y2="50%" stroke="#8b8574" strokeWidth="1" strokeDasharray="5 5" />
        <line x1="62%" y1="50%" x2="50%" y2="12%" stroke="#8b8574" strokeWidth="1" strokeDasharray="5 5" />
      </svg>
      {nodes.map((node) => {
        const isBoss = node.type === 'boss';
        const icon = node.type === 'capital' ? 'C' : node.type === 'event' ? '?' : node.type === 'shop' ? '$' : node.type === 'rest' ? 'R' : isBoss ? 'O' : 'X';
        return (
          <div key={node.id} className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
            <button
              data-tutorial-target={isBoss ? 'boss-node' : node.active ? 'map-node' : undefined}
              className={`relative flex items-center justify-center rounded-full border-2 font-black transition-transform ${
                isBoss
                  ? 'h-24 w-24 border-[#dfd4ba] bg-[#1b1918] text-4xl text-[#b84235]'
                  : node.active
                    ? 'h-16 w-16 border-[#b84235] bg-[#1a0f0e] text-2xl text-white shadow-[0_0_25px_rgba(184,66,53,0.55)]'
                    : node.done
                      ? 'h-14 w-14 border-[#d4af37] bg-[#2b3d60] text-lg text-[#d4af37]'
                      : 'h-14 w-14 border-[#8b8574]/40 bg-[#0a0908] text-lg text-[#8b8574]'
              }`}
            >
              {node.active && <span className="absolute inset-[-8px] rounded-full border border-white/20 animate-ping" />}
              {icon}
            </button>
            <div className="mt-2 whitespace-nowrap border border-[#d4af37]/30 bg-[#0a0908]/90 px-2 py-1 text-[9px] font-black uppercase tracking-widest">{node.label}</div>
          </div>
        );
      })}
      <div data-tutorial-target="node-card" className="absolute bottom-8 right-8 z-30 w-[350px] border border-[#d4af37]/30 bg-[#0a0908]/95 shadow-[0_25px_70px_rgba(0,0,0,0.9)]">
        <div className="border-b border-[#8b8574]/20 p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d4af37]">Combat Encounter</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-widest text-white">Bandit Camp</h2>
        </div>
        <div className="space-y-3 p-5 text-xs font-bold uppercase tracking-widest">
          <div className="flex justify-between"><span className="text-[#8b8574]">Threat</span><span className="text-[#b84235]">Low</span></div>
          <div className="flex justify-between"><span className="text-[#8b8574]">Waves</span><span>3</span></div>
          <div className="flex justify-between"><span className="text-[#8b8574]">Reward</span><span className="text-[#d4af37]">Command + Honor</span></div>
        </div>
        <button className="w-full bg-[#1a0f0e] px-6 py-4 text-xs font-black uppercase tracking-[0.25em] text-[#dfd4ba]">Begin Encounter</button>
      </div>
    </div>
  );
}

function CombatStage() {
  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#1b1918] font-serif text-[#1b1918]">
      <div className="relative flex-[7] overflow-hidden bg-[#dfd4ba]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#1b1918 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="absolute left-8 top-8 z-10 w-[260px] border-2 border-[#1b1918] bg-[#dfd4ba]/90 px-4 py-3">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-[#2b3d60]">Preparing</span>
            <span className="text-[#8b8574]">1 / 3</span>
          </div>
          <div className="mt-3 h-2 bg-[#8b8574]/30"><div className="h-full w-1/3 bg-[#d4af37]" /></div>
        </div>

        <div data-tutorial-target="frontline" className="absolute left-[22%] top-[43%] flex h-[150px] w-[28%] items-center justify-center gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={`ally-${i}`} className="h-10 w-10 rounded-full border-2 border-[#1b1918] bg-[#2b3d60]" />)}
          {Array.from({ length: 5 }).map((_, i) => <div key={`enemy-${i}`} className="h-8 w-8 rounded-full border-2 border-[#1b1918] bg-[#b84235]" />)}
        </div>
        <div className="absolute left-[55%] top-[35%] flex flex-wrap gap-2">
          {Array.from({ length: 14 }).map((_, i) => <div key={`mob-${i}`} className="h-5 w-5 rounded-full bg-[#b84235]/80" />)}
        </div>

        <div className="absolute bottom-20 left-0 right-0 h-5 bg-[#1b1918]/20" />
      </div>

      <aside data-tutorial-target="command-panel" className="relative z-10 flex-[3] min-w-[300px] border-l-4 border-[#1b1918] bg-[#dfd4ba]">
        <div className="flex h-full flex-col">
          <div className="border-b-4 border-[#1b1918] bg-[#e8e0cc] p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#8b8574]">Command</p>
            <div className="mt-1 flex items-end justify-between">
              <span className="text-4xl font-black">125</span>
              <span className="text-xs font-black uppercase tracking-widest text-[#4a5d23]">Troops 5/12</span>
            </div>
          </div>

          <div data-tutorial-target="spell-shrine" className="border-b-2 border-[#1b1918] p-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em]">Spell Shrine</p>
            <div className="grid grid-cols-3 gap-2">
              {['Thunder', 'Fox Fire', 'Resolve'].map((spell) => (
                <button key={spell} className="border-2 border-[#1b1918] bg-[#e8e0cc] px-2 py-3 text-[9px] font-black uppercase tracking-wider">
                  <Zap className="mx-auto mb-1 text-[#b84235]" size={16} />
                  {spell}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-3 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Military Forces</p>
            {[
              ['Hatamoto', 'Frontline guard', 'Build 40'],
              ['Yumi Archer', 'Safe ranged damage', 'Upgrade 55'],
              ['Cavalry', 'Fast pressure', 'Locked'],
            ].map(([name, role, action]) => (
              <div key={name} className="border-2 border-[#1b1918] bg-[#e8e0cc] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest">{name}</p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[#8b8574]">{role}</p>
                  </div>
                  <button className="border border-[#1b1918] px-2 py-1 text-[9px] font-black uppercase">{action}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function TutorialBook({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="absolute inset-y-0 right-0 z-[70] w-[430px] border-l border-[#d4af37]/35 bg-[#0a0908]/98 text-[#dfd4ba] shadow-[-30px_0_80px_rgba(0,0,0,0.8)]">
      <div className="flex items-start justify-between border-b border-[#d4af37]/25 px-6 py-5">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#b84235]">Optional Reference</p>
          <h2 className="mt-1 text-xl font-black uppercase tracking-widest text-white">Tutorial Book</h2>
          <p className="mt-2 text-[11px] font-bold leading-snug text-[#dfd4ba]/55">
            Holds useful knowledge that should not interrupt the first guided run.
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#8b8574]/30 text-[#8b8574] hover:border-[#dfd4ba] hover:text-white"
          aria-label="Close tutorial book"
        >
          <X size={17} />
        </button>
      </div>

      <div className="h-[calc(100%-116px)] overflow-y-auto px-5 py-5">
        <div className="space-y-4">
          {BOOK_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.title} className="border border-[#8b8574]/25 bg-[#141211]">
                <div className="flex items-center gap-3 border-b border-[#8b8574]/20 px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-[#d4af37]/30 text-[#d4af37]">
                    <Icon size={17} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">{section.title}</h3>
                </div>
                <div className="divide-y divide-[#8b8574]/15">
                  {section.rows.map(([title, body]) => (
                    <div key={title} className="px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#d4af37]">{title}</p>
                      <p className="mt-1 text-[11px] font-bold leading-relaxed text-[#dfd4ba]/68">{body}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StageRenderer({ stage }) {
  if (stage === 'monologue') return <MonologueStage />;
  if (stage === 'home') return <HomeStage />;
  if (stage === 'map') return <MapStage />;
  if (stage === 'combat') return <CombatStage />;
  return <HomeStage />;
}

export const TutorialOnboardingMock = ({ resetToken, state, setState }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const step = STEPS[clampIndex(stepIndex)];
  const completedCount = skipped ? 0 : stepIndex;
  const showLabels = state?.showTargetLabels ?? false;

  useEffect(() => {
    setStepIndex(0);
    setSkipped(false);
    setBookOpen(false);
  }, [resetToken]);

  const goNext = () => {
    if (stepIndex >= STEPS.length - 1) return;
    setStepIndex((value) => clampIndex(value + 1));
  };

  const restart = () => {
    setSkipped(false);
    setStepIndex(0);
    setState?.((prev) => ({ ...prev, showTargetLabels: prev?.showTargetLabels ?? false }));
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0908]">
      <div className="absolute left-0 top-0 z-[60] flex h-full w-[210px] flex-col border-r border-white/10 bg-[#11151f]/95 text-white">
        <div className="border-b border-white/10 px-4 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#feca57]">Mock Tutorial</p>
          <h1 className="mt-1 text-sm font-black uppercase tracking-widest">Onboarding Flow</h1>
          <p className="mt-2 text-[10px] font-bold leading-snug text-white/50">Isolated review surface. No real game files are used.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/45">
            <span>{STAGE_LABELS[step.stage]}</span>
            <span>{completedCount}/{STEPS.length}</span>
          </div>
          <div className="space-y-1.5">
            {STEPS.map((item, index) => {
              const isActive = index === stepIndex && !skipped;
              const isDone = !skipped && index < stepIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSkipped(false);
                    setStepIndex(index);
                  }}
                  className={`flex w-full items-center gap-2 border px-2 py-2 text-left text-[10px] font-black uppercase tracking-wide ${
                    isActive
                      ? 'border-[#feca57] bg-[#feca57]/15 text-white'
                      : isDone
                        ? 'border-[#1dd1a1]/40 bg-[#1dd1a1]/10 text-[#bfffea]'
                        : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10'
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/30">
                    {isDone ? <Check size={12} /> : index + 1}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => setBookOpen(true)}
            className="mb-2 flex w-full items-center justify-center gap-2 border border-[#feca57]/40 bg-[#feca57]/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#feca57] hover:bg-[#feca57]/20"
          >
            <BookOpen size={13} />
            Tutorial Book
          </button>
          <button
            onClick={restart}
            className="flex w-full items-center justify-center gap-2 bg-[#1dd1a1] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#11151f]"
          >
            <RotateCcw size={13} />
            Restart
          </button>
        </div>
      </div>

      <div className="absolute inset-y-0 left-[210px] right-0">
        <StageRenderer stage={step.stage} />
        <TargetHighlight step={step} showLabels={showLabels} />
        <TutorialCoach
          step={step}
          index={stepIndex}
          skipped={skipped}
          onPrev={() => setStepIndex((value) => clampIndex(value - 1))}
          onNext={goNext}
          onSkip={() => setSkipped(true)}
          onRestart={restart}
        />
        <TutorialBook open={bookOpen} onClose={() => setBookOpen(false)} />
      </div>
    </div>
  );
};

export function TutorialOnboardingControls({ state, setState, reset }) {
  const showTargetLabels = state?.showTargetLabels ?? false;
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setState((prev) => ({ ...prev, showTargetLabels: !showTargetLabels }))}
        className={`flex h-8 items-center gap-2 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest ${
          showTargetLabels ? 'bg-[#feca57] text-[#202636]' : 'bg-white/10 text-white/70 hover:text-white'
        }`}
      >
        <Map size={13} />
        Targets
      </button>
      <button
        onClick={reset}
        className="flex h-8 items-center gap-2 rounded-lg bg-white/10 px-3 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white"
      >
        <RotateCcw size={13} />
        Reset
      </button>
    </div>
  );
}
