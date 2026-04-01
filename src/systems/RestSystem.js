// RestSystem.js
// Pure logic — all functions take runState, return new runState (immutable).
// No React, no canvas, no side effects.

import { REST_OPTIONS } from '../config/nodes.js';
import { BLESSINGS }    from '../config/blessings.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Create a blessing entry with the correct combatsRemaining for runState.blessings */
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

/** Seeded LCG RNG — same constants as MapGenerator */
function createRNG(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

/** Fisher-Yates shuffle with seeded RNG — returns new array */
function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the list of rest options available to the player.
 * Each option is a copy of the REST_OPTIONS entry augmented with a `locked` flag.
 *
 * Locking rules:
 *   - REMOVE_CURSE is locked when the player has no active curses
 *
 * @param {object} runState
 * @returns {Array<{ id, name, effect, desc, locked: boolean }>}
 */
export function getRestOptions(runState) {
  const hasCurses = Array.isArray(runState.curses) && runState.curses.length > 0;

  return Object.values(REST_OPTIONS).map(option => ({
    ...option,
    locked: option.id === 'REMOVE_CURSE' && !hasCurses,
  }));
}

/**
 * Pick 2 distinct blessing IDs for the BLESSING rest option.
 * Selection is deterministic — seeded by mapSeed + number of completed nodes.
 * Excludes blessings already active on the current run where possible.
 *
 * @param {object} runState
 * @returns {[string, string]} Two blessing IDs
 */
export function getRestBlessingChoices(runState) {
  const allIds        = Object.keys(BLESSINGS);
  const activeIds     = new Set((runState.blessings ?? []).map(b => b.id));
  const available     = allIds.filter(id => !activeIds.has(id));

  // Fallback: if all blessings are already active, allow any
  const pool = available.length >= 2 ? available : allIds;

  const seed = (
    ((runState.mapSeed >>> 0) ^ ((runState.completedNodeIds ?? []).length * 1013904223)) >>> 0
  );
  const rng       = createRNG(seed);
  const shuffled  = shuffle(pool, rng);

  // Guarantee 2 distinct entries
  const first  = shuffled[0];
  const second = shuffled.find(id => id !== first) ?? allIds.find(id => id !== first) ?? allIds[1];

  return [first, second];
}

/**
 * Apply a rest choice to runState. Returns a new runState (immutable).
 *
 * Payload shapes per optionId:
 *   REMOVE_CURSE  → { curseId: string }           — which curse to remove
 *   BLESSING      → { blessingId: string }         — which of the 2 choices was picked
 *   RECRUIT_CAP   → { size: 'small'|'medium'|'large' } — garrison size
 *
 * Returns the original runState unchanged for unknown or locked options.
 *
 * @param {object} runState
 * @param {string} optionId
 * @param {object} [payload]
 * @returns {object} newRunState
 */
export function applyRestChoice(runState, optionId, payload) {
  switch (optionId) {

    case 'REMOVE_CURSE': {
      // Guard: option is locked if there are no curses
      if (!runState.curses || runState.curses.length === 0) return runState;

      if (payload?.curseId) {
        return {
          ...runState,
          curses: runState.curses.filter(c => c.id !== payload.curseId),
        };
      }
      // No specific curse supplied — remove the first one
      return { ...runState, curses: runState.curses.slice(1) };
    }

    case 'BLESSING': {
      if (!payload?.blessingId) return runState;
      const entry = makeBlessingEntry(payload.blessingId);
      return { ...runState, blessings: [...(runState.blessings ?? []), entry] };
    }

    case 'RECRUIT_CAP': {
      const size = payload?.size ?? 'small';
      if (!['small', 'medium', 'large'].includes(size)) return runState;
      return { ...runState, pendingGarrison: { size } };
    }

    default:
      return runState;
  }
}
