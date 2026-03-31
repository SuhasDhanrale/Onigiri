export const BLESSINGS = {
  WAR_DRUMS:       { id: 'WAR_DRUMS',       name: 'War Drums',       effect: 'attack_speed', value: 0.20, duration: 3,      desc: '+20% attack speed for 3 combats' },
  BLOODLUST:       { id: 'BLOODLUST',       name: 'Bloodlust',       effect: 'damage_hp',    value: [0.30, -0.10], duration: 'next', desc: '+30% damage, -10% max HP (next combat only)' },
  STONE_STANCE:    { id: 'STONE_STANCE',    name: 'Stone Stance',    effect: 'defense',      value: 0.25, duration: 3,      desc: '+25% defense for 3 combats' },
  EAGLE_EYE:       { id: 'EAGLE_EYE',       name: 'Eagle Eye',       effect: 'archer_range', value: 0.30, duration: 2,      desc: '+30% archer range for 2 combats' },
  SWIFT_FEET:      { id: 'SWIFT_FEET',      name: 'Swift Feet',      effect: 'move_speed',   value: 0.20, duration: 3,      desc: '+20% unit move speed for 3 combats' },
  LOOTING:         { id: 'LOOTING',         name: 'Looting Spree',   effect: 'command_drops',value: 0.25, duration: 'next', desc: '+25% command drops (next combat)' },
  ANCESTOR_FURY:   { id: 'ANCESTOR_FURY',   name: "Ancestor's Fury", effect: 'damage',       value: 0.25, duration: 'next', desc: '+25% damage (next combat)' },
  IRON_WILL:       { id: 'IRON_WILL',       name: 'Iron Will',       effect: 'max_hp',       value: 0.25, duration: 'next', desc: '+25% max HP (next combat)' },
  FOX_SPEED:       { id: 'FOX_SPEED',       name: "Fox's Speed",     effect: 'move_speed',   value: 0.20, duration: 'run',  desc: '+20% unit speed for entire run' },
  HOLY_PROTECTION: { id: 'HOLY_PROTECTION', name: 'Holy Protection', effect: 'necro_immune', value: true, duration: 'run',  desc: 'Immune to necromancer enemies this run' },
};
