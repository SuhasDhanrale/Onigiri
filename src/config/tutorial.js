export const TUTORIAL_STORAGE_KEY = 'onigiri_tutorial_v1';

export const TUTORIAL_STEP_ORDER = [
  'opening_monologue',
  'home_start',
  'map_select_node',
  'map_upgrades',
  'node_detail',
  'combat_command',
  'combat_spell_crisis',
];

export const TUTORIAL_STEPS = {
  opening_monologue: {
    id: 'opening_monologue',
    label: 'Story',
    title: 'The Last Rice Banner',
    body: [
      'The mountain shrines have gone silent. Villages burn without smoke, and every road to the capital carries stories of masks, curses, and hungry spirits.',
      'You command the last loyal garrison. Gather soldiers, spend Honor wisely, and cut a path through the demon war before the capital falls.',
    ],
    mode: 'monologue',
  },
  home_start: {
    id: 'home_start',
    label: 'Campaign',
    title: 'Start The Campaign',
    body: 'Choose a chapter, clear nodes, and defeat the demon boss.',
    target: 'home-play',
    placement: 'right',
  },
  map_select_node: {
    id: 'map_select_node',
    label: 'Map',
    title: 'Pick A Route',
    body: 'Each node is a choice. Check threat, waves, and rewards before beginning an encounter.',
    target: 'map-available-node',
    placement: 'right',
  },
  map_upgrades: {
    id: 'map_upgrades',
    label: 'Upgrades',
    title: 'Check The Dojo',
    body: 'The map screen is also where you spend Honor, equip heirlooms, and prepare long-term upgrades.',
    target: 'map-upgrades',
    placement: 'bottom',
  },
  node_detail: {
    id: 'node_detail',
    label: 'Node',
    title: 'Commit To The Encounter',
    body: 'The node card shows what the next choice asks of you. Detailed node types live in the Tutorial Book.',
    target: 'node-detail-card',
    placement: 'left',
  },
  combat_command: {
    id: 'combat_command',
    label: 'Command',
    title: 'Spend Command',
    body: 'Command is your battle currency. Spend it to strengthen your army before enemies arrive.',
    target: 'command-panel',
    placement: 'left',
  },
  combat_spell_crisis: {
    id: 'combat_spell_crisis',
    label: 'Spells',
    title: 'Try A Free Spell',
    body: 'Combat keeps moving. Your first tutorial spell is free: use Lightning Shower for scattered enemies, or Fox Fire when enemies crowd the gate approach.',
    target: 'spell-shrine',
    placement: 'left',
  },
};

export const TUTORIAL_BOOK_SECTIONS = [
  {
    title: 'Story',
    rows: [
      ['Premise', 'The shrines are silent, demon roads are opening, and you command the last loyal garrison.'],
      ['Opening', 'The first story card should stay short, skippable, and replayable from this book.'],
    ],
  },
  {
    title: 'Upgrades',
    rows: [
      ['Honor', 'Long-term currency earned across attempts and spent from the map hub.'],
      ['Heirlooms', 'Equippable permanent items that change the next run.'],
      ['Dojo', 'Permanent techniques and provisions that strengthen future attempts.'],
    ],
  },
  {
    title: 'Dojo Powers',
    rows: [
      ['Rule', 'Dojo techniques are passive. Once unlocked, they activate automatically in combat.'],
      ['Flaming Arrows', 'Yumi Archers sometimes ignite enemies. Watch for IGNITE.'],
      ['Takeda Charge', 'Cavalry enter battle with a short charge burst. Watch for CHARGE.'],
      ['Spiked Caltrops', 'Barricades hurt enemies that strike them. Watch for SPIKES.'],
    ],
  },
  {
    title: 'Map Nodes',
    rows: [
      ['Combat', 'Standard battles that pay Command and Honor.'],
      ['Shop', 'Spend Command on run upgrades, recruits, or curse removal.'],
      ['Rest', 'Prepare with garrisons, blessings, or purification.'],
      ['Event', 'Risk and reward choices with uncertain outcomes.'],
      ['Boss', 'Chapter tests that expect the player to use the full toolset.'],
    ],
  },
  {
    title: 'Enemies',
    rows: [
      ['Ikki Rebel', 'Weak melee pressure. Teaches frontline basics.'],
      ['Tengu Flier', 'Flying threat. Teaches why ranged units matter.'],
      ['Onmyoji', 'Support enemy. Teaches target priority.'],
      ['Shinobi', 'Fast assassin. Teaches emergency response.'],
    ],
  },
  {
    title: 'Bosses',
    rows: [
      ['Goki', 'First chapter boss. Slow, readable, and built around warning markers.'],
      ['Boss Rule', 'Learn the boss in the book before the fight; in combat, only urgent warnings should appear.'],
    ],
  },
];

export function getPreviousTutorialStep(stepId) {
  const index = TUTORIAL_STEP_ORDER.indexOf(stepId);
  if (index <= 0) return null;
  return TUTORIAL_STEP_ORDER[index - 1];
}
