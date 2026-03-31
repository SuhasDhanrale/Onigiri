export const CURSES = {
  WEAKENED:      { id: 'WEAKENED',      name: 'Weakened',            effect: 'damage',        value: -0.15, removal: 'shop_rest_event', desc: '-15% damage' },
  CURSED_GOODS:  { id: 'CURSED_GOODS',  name: 'Cursed Goods',        effect: 'max_hp',        value: -0.15, removal: 'shop_rest_event', desc: '-15% max HP' },
  HAUNTED:       { id: 'HAUNTED',       name: 'Haunted',             effect: 'random_debuff', value: true,  removal: 'shop_event',      desc: 'Random debuff each combat start' },
  FOX_DEBT:      { id: 'FOX_DEBT',      name: "Fox's Debt",          effect: 'boss_rewards',  value: -0.50, removal: 'shop_event',      desc: '-50% rewards from boss' },
  OUTLAW:        { id: 'OUTLAW',        name: 'Outlaw',              effect: 'honor',         value: -0.30, removal: 'time_3_combats',  desc: '-30% honor from all sources (3 combats)' },
  VILLAGE_WRATH: { id: 'VILLAGE_WRATH', name: 'Village Wrath',       effect: 'event_outcomes',value: -0.50, removal: 'time_5_nodes',   desc: 'Worse event outcomes (5 nodes)' },
  DIVINE_WRATH:  { id: 'DIVINE_WRATH',  name: 'Divine Wrath',        effect: 'max_hp',        value: -0.20, removal: 'shrine_event',    desc: '-20% max HP this run' },
  NECRO_WRATH:   { id: 'NECRO_WRATH',   name: "Necromancer's Wrath", effect: 'necro_revive',  value: true,  removal: 'never',           desc: 'Dead enemies revive in all future combats' },
};
