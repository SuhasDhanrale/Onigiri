export const NODE_TYPES = ['combat', 'elite', 'event', 'shop', 'rest', 'boss'];

export const COMBAT_VARIANTS = {
  bandit_camp: { id: 'bandit_camp', name: 'Bandit Camp',      threat: 1, command: [15, 25], honor: [1, 2], waves: 3, special: null },
  ambush:      { id: 'ambush',      name: 'Forest Ambush',    threat: 1, command: [20, 30], honor: [1, 2], waves: 2, special: 'units_start_closer' },
  patrol:      { id: 'patrol',      name: 'Patrol Route',     threat: 2, command: [25, 40], honor: [2, 3], waves: 4, special: 'timed_bonus' },
  garrison:    { id: 'garrison',    name: 'Forward Garrison', threat: 2, command: [10, 20], honor: [4, 6], waves: 4, special: 'enemies_behind_barricades' },
  caravan:     { id: 'caravan',     name: 'Merchant Caravan', threat: 1, command: [35, 50], honor: [1, 1], waves: 2, special: 'extra_command_drops' },
  swarm:       { id: 'swarm',       name: 'Peasant Swarm',    threat: 1, command: [20, 30], honor: [1, 2], waves: 3, special: 'more_weak_enemies' },
  night_raid:  { id: 'night_raid',  name: 'Night Raid',       threat: 3, command: [45, 60], honor: [3, 5], waves: 5, special: 'low_visibility' },
  fortress:    { id: 'fortress',    name: 'Fortress Gate',    threat: 3, command: [30, 45], honor: [4, 6], waves: 6, special: 'multiple_waves' },
};

export const ELITE_VARIANTS = {
  tengu_master:   { id: 'tengu_master',   name: 'Tengu Master',     threat: 4, guarantee: { honor: 25 },          waves: 3, special: 'dodge_50_arrows' },
  oni_warlord:    { id: 'oni_warlord',    name: 'Oni Warlord',      threat: 5, guarantee: { honor: 40 },          waves: 3, special: 'rage_mode' },
  shinobi_squad:  { id: 'shinobi_squad',  name: 'Shinobi Squad',    threat: 4, guarantee: { squad_cap: 1 },        waves: 2, special: 'target_buildings' },
  onmyoji_ritual: { id: 'onmyoji_ritual', name: 'Onmyoji Ritual',   threat: 5, guarantee: { honor: 30 },          waves: 4, special: 'summon_reinforcements' },
  yamabushi:      { id: 'yamabushi',      name: 'Yamabushi Monk',   threat: 4, guarantee: { blessing_choice: 1 }, waves: 3, special: 'self_heal' },
  ronin_duel:     { id: 'ronin_duel',     name: 'Masterless Ronin', threat: 4, guarantee: { honor: 30 },          waves: 1, special: 'duel_challenge' },
};

export const NODE_POOL = {
  TIER_0: ['event'],
  TIER_1: ['combat', 'combat', 'combat', 'event'],
  TIER_2: ['combat', 'combat', 'elite', 'event'],
  TIER_3: ['combat', 'elite', 'event', 'shop'],
  TIER_4: ['combat', 'elite', 'rest', 'shop'],
  TIER_5: ['boss'],
};

export const EVENT_IDS = [
  'ronin_encounter', 'shrine_maiden', 'abandoned_cache', 'deserting_soldier',
  'peasant_village', 'cursed_ground', 'traveling_merchant', 'fox_spirit',
  'hidden_dojo', 'wounded_scout', 'gambling_den', 'ancestral_shrine',
];

export const SHOP_ITEMS = {
  fresh_recruits:      { id: 'fresh_recruits',      tier: 1, price: [30,  60],  effect: 'plus_1_unit_choice',      desc: 'Choose 1 unit type to add',        duration: 'immediate' },
  scout_report:        { id: 'scout_report',        tier: 1, price: [20,  40],  effect: 'reveal_next_tier',        desc: 'Reveal all nodes in next tier',    duration: 'immediate' },
  quick_repairs:       { id: 'quick_repairs',       tier: 1, price: [40,  60],  effect: 'repair_towers_50',        desc: 'Restore 50% HP to all towers',     duration: 'immediate' },
  flaming_arrows_shop: { id: 'flaming_arrows_shop', tier: 2, price: [80,  120], effect: 'archers_fire_damage',     desc: 'Archers deal +25% fire damage',    duration: 'run' },
  rapid_deployment:    { id: 'rapid_deployment',    tier: 2, price: [100, 140], effect: 'barracks_2x_speed',       desc: 'Barracks spawn units 2x faster',   duration: 'run' },
  spell_mastery:       { id: 'spell_mastery',       tier: 2, price: [110, 150], effect: 'spell_cooldown_minus_20', desc: 'All spell cooldowns -20%',          duration: 'run' },
  curse_removal:       { id: 'curse_removal',       tier: 2, price: [70,  100], effect: 'remove_1_curse',          desc: 'Remove 1 curse',                   duration: 'immediate' },
  iron_fortifications: { id: 'iron_fortifications', tier: 3, price: [200, 280], effect: 'towers_double_hp',        desc: 'All towers have +100% HP',         duration: 'run' },
  elite_training:      { id: 'elite_training',      tier: 3, price: [180, 240], effect: 'upgrade_all_units',       desc: '+15% all unit stats',               duration: 'run' },
  command_expansion:   { id: 'command_expansion',   tier: 3, price: [200, 300], effect: 'base_command_plus_30',    desc: '+30 Base Command this run',        duration: 'run' },
  dragon_scroll:       { id: 'dragon_scroll',       tier: 3, price: [280, 350], effect: 'unlock_dragon_wave',      desc: 'Unlock Dragon Wave spell',         duration: 'run' },
};

export const REST_OPTIONS = {
  RECRUIT_CAP:  { id: 'RECRUIT_CAP',  name: 'Establish Garrison',  effect: 'set_base_spawn',         desc: 'Set units that auto-spawn at start of next combat' },
  REMOVE_CURSE: { id: 'REMOVE_CURSE', name: 'Purification Rites',  effect: 'remove_1_curse',         desc: 'Remove 1 curse of your choice' },
  BLESSING:     { id: 'BLESSING',     name: 'War Council',          effect: 'choose_blessing_from_2', desc: 'Choose 1 blessing from 2 options' },
};
