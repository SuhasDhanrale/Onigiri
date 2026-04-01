// EventSystem.js
// Pure logic — all functions take runState, return new runState (immutable).
// No React, no canvas, no side effects.

import { BLESSINGS } from '../config/blessings.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Create a blessing entry with appropriate combatsRemaining for runState.blessings */
function makeBlessingEntry(blessingId) {
  const b = BLESSINGS[blessingId];
  if (!b) return { id: blessingId, combatsRemaining: 3 };

  let combatsRemaining;
  if (typeof b.duration === 'number') {
    combatsRemaining = b.duration;
  } else if (b.duration === 'next') {
    combatsRemaining = 1;
  } else if (b.duration === 'run') {
    combatsRemaining = Infinity;
  } else {
    combatsRemaining = 3;
  }
  return { id: blessingId, combatsRemaining };
}

/** Apply a single effect descriptor to runState — returns new runState */
function applyEffect(state, effect) {
  if (!effect) return state;
  switch (effect.type) {
    case 'command':
      return { ...state, baseCommand: state.baseCommand + effect.value };

    case 'honor':
      return { ...state, honorEarned: state.honorEarned + effect.value };

    case 'blessing': {
      const entry = makeBlessingEntry(effect.blessingId);
      return { ...state, blessings: [...state.blessings, entry] };
    }

    case 'curse': {
      const alreadyHas = state.curses.some(c => c.id === effect.curseId);
      if (alreadyHas) return state;
      return { ...state, curses: [...state.curses, { id: effect.curseId }] };
    }

    case 'remove_curse': {
      if (effect.curseId) {
        return { ...state, curses: state.curses.filter(c => c.id !== effect.curseId) };
      }
      // Remove first curse when no specific target
      return { ...state, curses: state.curses.slice(1) };
    }

    case 'combat':
      return { ...state, pendingCombat: { variant: effect.variant } };

    default:
      return state;
  }
}

/** Apply an array of effects in sequence */
function applyEffects(state, effects) {
  return effects.reduce((s, eff) => applyEffect(s, eff), state);
}

/** Deterministic integer hash of a string — used for gambling outcomes */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Static event data
// Each choice has:
//   id       — unique within event
//   label    — display text (optionally with cost)
//   cost     — command cost hint for UI (0 if free; informational only)
//   effect   — array of effect descriptors, or null for special handling
//   risk     — null | 'combat' | 'gamble_small' | 'gamble_large'
// ---------------------------------------------------------------------------

const EVENT_DATA = {

  ronin_encounter: {
    id: 'ronin_encounter',
    name: 'Ronin Encounter',
    text: 'A masterless samurai blocks your path. His blade is worn but his eyes remain sharp.',
    choices: [
      {
        id: 'recruit',
        label: 'Recruit the ronin (20 Command)',
        cost: 20,
        effect: [
          { type: 'command', value: -20 },
          { type: 'blessing', blessingId: 'ANCESTOR_FURY' },
        ],
        risk: null,
      },
      {
        id: 'duel',
        label: 'Challenge him to a duel',
        cost: 0,
        effect: null,
        risk: 'combat',
      },
      {
        id: 'offer_coin',
        label: 'Offer coin and pass (10 Command)',
        cost: 10,
        effect: [{ type: 'command', value: -10 }, { type: 'honor', value: 5 }],
        risk: null,
      },
    ],
  },

  shrine_maiden: {
    id: 'shrine_maiden',
    name: 'Shrine Maiden',
    text: 'A young shrine maiden tends a roadside shrine. She offers to pray for your success.',
    choices: [
      {
        id: 'accept_blessing',
        label: 'Accept her blessing',
        cost: 0,
        effect: [{ type: 'blessing', blessingId: 'STONE_STANCE' }],
        risk: null,
      },
      {
        id: 'make_offering',
        label: 'Make a generous offering (15 Honor)',
        cost: 0,
        effect: [
          { type: 'honor', value: -15 },
          { type: 'blessing', blessingId: 'IRON_WILL' },
          { type: 'blessing', blessingId: 'ANCESTOR_FURY' },
        ],
        risk: null,
      },
      {
        id: 'bow_and_pass',
        label: 'Bow respectfully and continue',
        cost: 0,
        effect: [],
        risk: null,
      },
    ],
  },

  abandoned_cache: {
    id: 'abandoned_cache',
    name: 'Abandoned Cache',
    text: 'Half-buried in undergrowth — crates stamped with a regimental seal. Someone left in a hurry.',
    choices: [
      {
        id: 'take_all',
        label: 'Take everything (30 Command)',
        cost: 0,
        effect: [{ type: 'command', value: 30 }],
        risk: null,
      },
      {
        id: 'take_some',
        label: 'Take only what you need (15 Command + 5 Honor)',
        cost: 0,
        effect: [{ type: 'command', value: 15 }, { type: 'honor', value: 5 }],
        risk: null,
      },
      {
        id: 'leave_it',
        label: 'Leave it — could be a trap',
        cost: 0,
        effect: [],
        risk: null,
      },
    ],
  },

  deserting_soldier: {
    id: 'deserting_soldier',
    name: 'Deserting Soldier',
    text: 'You catch a soldier from a neighbouring clan trying to slip away from the front lines.',
    choices: [
      {
        id: 'conscript',
        label: 'Conscript him into your army',
        cost: 0,
        effect: [
          { type: 'command', value: 10 },
          { type: 'blessing', blessingId: 'WAR_DRUMS' },
        ],
        risk: null,
      },
      {
        id: 'bribe',
        label: 'Accept his bribe for silence (25 Command)',
        cost: 0,
        effect: [
          { type: 'command', value: 25 },
          { type: 'curse', curseId: 'OUTLAW' },
        ],
        risk: null,
      },
      {
        id: 'release',
        label: 'Release him with a warning (8 Honor)',
        cost: 0,
        effect: [{ type: 'honor', value: 8 }],
        risk: null,
      },
    ],
  },

  peasant_village: {
    id: 'peasant_village',
    name: 'Peasant Village',
    text: 'A small farming village. The elders look wary but welcoming. They have resources they could spare.',
    choices: [
      {
        id: 'levy_taxes',
        label: 'Levy a war tax (35 Command)',
        cost: 0,
        effect: [
          { type: 'command', value: 35 },
          { type: 'curse', curseId: 'VILLAGE_WRATH' },
        ],
        risk: null,
      },
      {
        id: 'trade',
        label: 'Trade fairly (15 Command + 5 Honor)',
        cost: 0,
        effect: [{ type: 'command', value: 15 }, { type: 'honor', value: 5 }],
        risk: null,
      },
      {
        id: 'help_defenses',
        label: 'Help fortify their village (cost 20 Command)',
        cost: 20,
        effect: [
          { type: 'command', value: -20 },
          { type: 'honor', value: 20 },
          { type: 'blessing', blessingId: 'SWIFT_FEET' },
        ],
        risk: null,
      },
    ],
  },

  cursed_ground: {
    id: 'cursed_ground',
    name: 'Cursed Ground',
    text: 'The earth is blackened and wrong. Old battle-dead linger here. A shortcut — but at what price?',
    choices: [
      {
        id: 'press_through',
        label: 'Press through the cursed ground',
        cost: 0,
        effect: [
          { type: 'command', value: 20 },
          { type: 'curse', curseId: 'WEAKENED' },
        ],
        risk: null,
      },
      {
        id: 'purify',
        label: 'Perform a purification rite (10 Honor)',
        cost: 0,
        effect: [
          { type: 'honor', value: -10 },
          { type: 'command', value: 10 },
        ],
        risk: null,
      },
      {
        id: 'long_route',
        label: 'Take the long route',
        cost: 0,
        effect: [],
        risk: null,
      },
    ],
  },

  traveling_merchant: {
    id: 'traveling_merchant',
    name: 'Traveling Merchant',
    text: 'A cheerful merchant with a laden cart crosses your path. He has unusual wares for sale.',
    choices: [
      {
        id: 'buy_rations',
        label: 'Buy battle rations (25 Command)',
        cost: 25,
        effect: [
          { type: 'command', value: -25 },
          { type: 'blessing', blessingId: 'IRON_WILL' },
        ],
        risk: null,
      },
      {
        id: 'buy_intel',
        label: 'Buy military intelligence (20 Command)',
        cost: 20,
        effect: [
          { type: 'command', value: -20 },
          { type: 'honor', value: 15 },
        ],
        risk: null,
      },
      {
        id: 'extort',
        label: 'Extort the merchant (40 Command)',
        cost: 0,
        effect: [
          { type: 'command', value: 40 },
          { type: 'curse', curseId: 'OUTLAW' },
        ],
        risk: null,
      },
      {
        id: 'pass',
        label: 'Bid him well and move on',
        cost: 0,
        effect: [],
        risk: null,
      },
    ],
  },

  fox_spirit: {
    id: 'fox_spirit',
    name: 'Fox Spirit',
    text: 'A fox with nine tails regards you with ancient golden eyes. It offers a bargain — power, at a price.',
    choices: [
      {
        id: 'accept_deal',
        label: "Accept the fox's bargain (50 Command + 20 Honor)",
        cost: 0,
        effect: [
          { type: 'command', value: 50 },
          { type: 'honor', value: 20 },
          { type: 'curse', curseId: 'FOX_DEBT' },
        ],
        risk: null,
      },
      {
        id: 'appease',
        label: 'Make an offering (20 Honor)',
        cost: 0,
        effect: [
          { type: 'honor', value: -20 },
          { type: 'blessing', blessingId: 'FOX_SPEED' },
        ],
        risk: null,
      },
      {
        id: 'drive_off',
        label: 'Drive the spirit away',
        cost: 0,
        effect: [],
        risk: null,
      },
    ],
  },

  hidden_dojo: {
    id: 'hidden_dojo',
    name: 'Hidden Dojo',
    text: 'A crumbling temple, long abandoned. Inside — training scrolls and weapon racks, perfectly preserved.',
    choices: [
      {
        id: 'train',
        label: 'Train your warriors here',
        cost: 0,
        effect: [
          { type: 'blessing', blessingId: 'EAGLE_EYE' },
          { type: 'blessing', blessingId: 'SWIFT_FEET' },
        ],
        risk: null,
      },
      {
        id: 'loot_scrolls',
        label: 'Take the battle scrolls (25 Honor + 10 Command)',
        cost: 0,
        effect: [
          { type: 'honor', value: 25 },
          { type: 'command', value: 10 },
        ],
        risk: null,
      },
      {
        id: 'burn',
        label: 'Burn it — deny it to your enemies (10 Honor)',
        cost: 0,
        effect: [{ type: 'honor', value: 10 }],
        risk: null,
      },
    ],
  },

  wounded_scout: {
    id: 'wounded_scout',
    name: 'Wounded Scout',
    text: 'A forward scout staggers back from the tree line, gravely wounded but clutching a map.',
    choices: [
      {
        id: 'heal_and_debrief',
        label: 'Treat his wounds and hear his full report (15 Command)',
        cost: 15,
        effect: [
          { type: 'command', value: -15 },
          { type: 'honor', value: 10 },
          { type: 'blessing', blessingId: 'LOOTING' },
        ],
        risk: null,
      },
      {
        id: 'take_map',
        label: 'Take the map and press forward (5 Honor)',
        cost: 0,
        effect: [{ type: 'honor', value: 5 }],
        risk: null,
      },
      {
        id: 'ignore',
        label: 'Leave him — no time to stop (-5 Honor)',
        cost: 0,
        effect: [{ type: 'honor', value: -5 }],
        risk: null,
      },
    ],
  },

  gambling_den: {
    id: 'gambling_den',
    name: 'Gambling Den',
    text: 'Soldiers losing their pay at dice. The odds are uncertain, but the smell of coin is strong.',
    choices: [
      {
        id: 'bet_small',
        label: 'Bet small — 10 Command (win 20, lose 10)',
        cost: 10,
        effect: null,
        risk: 'gamble_small',
      },
      {
        id: 'bet_large',
        label: 'Bet large — 25 Command (win 50, lose 25)',
        cost: 25,
        effect: null,
        risk: 'gamble_large',
      },
      {
        id: 'walk_away',
        label: 'Walk away',
        cost: 0,
        effect: [],
        risk: null,
      },
    ],
  },

  ancestral_shrine: {
    id: 'ancestral_shrine',
    name: 'Ancestral Shrine',
    text: "A grand shrine to your clan's founders. The air is thick with incense and ancient power.",
    choices: [
      {
        id: 'pray',
        label: 'Pray for guidance (20 Honor)',
        cost: 0,
        effect: [
          { type: 'honor', value: 20 },
          { type: 'blessing', blessingId: 'HOLY_PROTECTION' },
        ],
        risk: null,
      },
      {
        id: 'desecrate',
        label: 'Strip the offerings for supplies (30 Command)',
        cost: 0,
        effect: [
          { type: 'command', value: 30 },
          { type: 'curse', curseId: 'DIVINE_WRATH' },
        ],
        risk: null,
      },
      {
        id: 'leave_offering',
        label: 'Leave a generous offering (30 Honor)',
        cost: 0,
        effect: [
          { type: 'honor', value: -30 },
          { type: 'blessing', blessingId: 'ANCESTOR_FURY' },
          { type: 'blessing', blessingId: 'STONE_STANCE' },
        ],
        risk: null,
      },
    ],
  },

  // TODO: Planned feature — Necromancer Power event (Event 13)
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the static event definition for a given variantId.
 * @param {string} variantId
 * @returns {{ id, name, text, choices: Array } | null}
 */
export function getEvent(variantId) {
  return EVENT_DATA[variantId] ?? null;
}

/**
 * Apply a player choice to a runState. Returns a new runState (immutable).
 *
 * If the choice triggers combat, the returned state includes:
 *   { ...newRunState, pendingCombat: { variant: string } }
 *
 * Gambling outcomes are deterministic: seeded by mapSeed + eventId + choiceId + currentNodeId.
 *
 * @param {object} runState
 * @param {string} eventId
 * @param {string} choiceId
 * @returns {object} newRunState
 */
export function applyEventChoice(runState, eventId, choiceId) {
  const event = EVENT_DATA[eventId];
  if (!event) return runState;

  const choice = event.choices.find(c => c.id === choiceId);
  if (!choice) return runState;

  // --- Special: triggers combat ---
  if (choice.risk === 'combat') {
    return { ...runState, pendingCombat: { variant: 'ronin_duel' } };
  }

  // --- Special: gambling (small bet) ---
  if (choice.risk === 'gamble_small') {
    const seed = hashCode(`${runState.mapSeed}-${eventId}-small-${runState.currentNodeId}`);
    const win = seed % 2 === 0; // 50% chance
    const delta = win ? 20 : -10;
    return { ...runState, baseCommand: runState.baseCommand + delta };
  }

  // --- Special: gambling (large bet) ---
  if (choice.risk === 'gamble_large') {
    const seed = hashCode(`${runState.mapSeed}-${eventId}-large-${runState.currentNodeId}`);
    const win = (seed % 3) !== 0; // ~67% chance
    const delta = win ? 50 : -25;
    return { ...runState, baseCommand: runState.baseCommand + delta };
  }

  // --- Standard effect list ---
  if (!choice.effect || choice.effect.length === 0) return runState;
  return applyEffects(runState, choice.effect);
}

// ---------------------------------------------------------------------------
// Blessing / curse multiplier stubs — full implementations added in Step 9
// ---------------------------------------------------------------------------

/**
 * Compute flat combat multipliers from active blessings.
 * Returns an object with keys: damage, attackSpeed, maxHp, archerRange, moveSpeed, defense.
 * Each value starts at 1.0 and is additively modified by blessing values.
 *
 * TODO: Step 9 — replace stubs with real accumulation logic.
 */
export function computeBlessingMultipliers(blessings) { // eslint-disable-line no-unused-vars
  // TODO: Step 9
  return { damage: 1.0, attackSpeed: 1.0, maxHp: 1.0, archerRange: 1.0, moveSpeed: 1.0, defense: 1.0 };
}

/**
 * Compute flat combat multipliers from active curses.
 * Returns an object with keys: damage, maxHp.
 * Each value starts at 1.0 and is additively modified by curse values.
 *
 * TODO: Step 9 — replace stubs with real accumulation logic.
 */
export function computeCurseMultipliers(curses) { // eslint-disable-line no-unused-vars
  // TODO: Step 9
  return { damage: 1.0, maxHp: 1.0 };
}
