// ShopSystem.js
// Pure logic — all functions take runState, return new runState (immutable).
// No React, no canvas, no side effects.

import { SHOP_ITEMS } from '../config/nodes.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Seeded LCG RNG — same constants as MapGenerator for consistency */
function createRNG(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

/** Deterministic integer hash of a string */
function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
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
 * Generate a shop inventory for a specific node visit.
 * Returns an array of 3 inventory entries (one per tier), each shaped:
 *   { id: string, onSale: boolean, price: [min, max] }
 *
 * Rules:
 *   - One item per tier (tier 1, 2, 3)
 *   - Prefers items not yet purchased this run; falls back to any tier item
 *   - 20% chance of a 30% discount on one item, seeded from mapSeed + nodeId
 *   - Deterministic: same runState.mapSeed + nodeId → same inventory
 *
 * @param {object} runState
 * @param {string|number} nodeId
 * @returns {Array<{ id: string, onSale: boolean, price: [number, number] }>}
 */
export function generateShopInventory(runState, nodeId) {
  const nodeSeed  = (runState.mapSeed ^ hashStr(String(nodeId))) >>> 0;
  const itemRng   = createRNG(nodeSeed);
  const purchased = runState.shopPurchases ?? {};
  const allItems  = Object.values(SHOP_ITEMS);

  const inventory = [];

  for (let tier = 1; tier <= 3; tier++) {
    const tierItems = allItems.filter(item => item.tier === tier);
    const shuffled  = shuffle(tierItems, itemRng);

    // Prefer an item not yet purchased; fall back to first shuffled item
    const pick = shuffled.find(item => !purchased[item.id]) ?? shuffled[0];
    inventory.push(pick.id);
  }

  // ── Sale logic ────────────────────────────────────────────────────────────
  // 20% chance of a 30% sale on one random item, seeded independently
  const saleSeed  = (runState.mapSeed ^ hashStr(String(nodeId) + '_sale')) >>> 0;
  const saleRng   = createRNG(saleSeed);
  const hasSale   = saleRng() < 0.20;
  const saleIndex = hasSale ? Math.floor(saleRng() * inventory.length) : -1;

  return inventory.map((id, idx) => {
    const item    = SHOP_ITEMS[id];
    const onSale  = idx === saleIndex;
    const baseMin = item.price[0];
    const baseMax = item.price[1];
    const price   = onSale
      ? [Math.floor(baseMin * 0.7), Math.floor(baseMax * 0.7)]
      : [baseMin, baseMax];
    return { id, onSale, price };
  });
}

/**
 * Apply a shop purchase to runState. Returns a new runState (immutable).
 *
 * The caller should pass the actual displayed price (from generateShopInventory)
 * so that sale discounts are honoured. If price is omitted, the midpoint of the
 * item's base price range is used as a safe fallback.
 *
 * Returns the original runState unchanged if:
 *   - itemId is not found in SHOP_ITEMS
 *   - The item was already purchased this run
 *   - The player cannot afford the price
 *
 * @param {object} runState
 * @param {string} itemId
 * @param {number} [price] — actual displayed price; defaults to base price midpoint
 * @returns {object} newRunState
 */
export function purchaseItem(runState, itemId, price) {
  const item = SHOP_ITEMS[itemId];
  if (!item) return runState; // unknown item

  const alreadyPurchased = (runState.shopPurchases ?? {})[itemId];
  if (alreadyPurchased) return runState; // can't buy twice

  // Resolve price: caller should pass the value from generateShopInventory
  const actualPrice = (typeof price === 'number' && price >= 0)
    ? price
    : Math.round((item.price[0] + item.price[1]) / 2);

  if (runState.baseCommand < actualPrice) return runState; // can't afford

  let newState = {
    ...runState,
    baseCommand: runState.baseCommand - actualPrice,
    shopPurchases: {
      ...(runState.shopPurchases ?? {}),
      [itemId]: true,
    },
  };

  // Immediate run-state effects (run-duration combat buffs are read via computeShopModifiers instead).
  switch (item.effect) {
    case 'base_command_plus_30':
      newState = { ...newState, baseCommand: newState.baseCommand + 30 };
      break;
    // 'remove_1_curse' (curse_removal) and 'plus_1_unit_choice' (fresh_recruits) are resolved by
    // picker UIs in the shop layer; 'reveal_next_tier' (scout_report) acts on the map node list.
    default:
      break;
  }

  return newState;
}

/**
 * Compute run-duration combat modifiers granted by shop purchases.
 * Read once at combat start (stored on game state in startCombat), so the values
 * persist for the whole run via runState.shopPurchases.
 *   - unitStatMult      — elite_training      (+15% all player unit stats)
 *   - archerFireMult     — flaming_arrows_shop (+25% archer damage)
 *   - barracksTimeMult   — rapid_deployment    (spawn timer ×0.5 = 2× faster)
 *   - spellCooldownMult  — spell_mastery       (spell cooldowns ×0.8 = -20%)
 *
 * @param {object} shopPurchases — runState.shopPurchases map ({ itemId: true })
 * @returns {{ unitStatMult: number, archerFireMult: number, barracksTimeMult: number, spellCooldownMult: number }}
 */
export function computeShopModifiers(shopPurchases) {
  const p = shopPurchases ?? {};
  return {
    unitStatMult:      p.elite_training      ? 1.15 : 1.0,
    archerFireMult:    p.flaming_arrows_shop ? 1.25 : 1.0,
    barracksTimeMult:  p.rapid_deployment    ? 0.5  : 1.0,
    spellCooldownMult: p.spell_mastery       ? 0.8  : 1.0,
  };
}
