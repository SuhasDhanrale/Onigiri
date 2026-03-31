// MapGenerator.js
// Pure function: same seed + runNumber → identical map output.
// No React, no side effects, no enemy wave data.

import { COMBAT_VARIANTS, ELITE_VARIANTS, EVENT_IDS, NODE_POOL } from '../config/nodes.js';

// --- Seeded LCG RNG (Numerical Recipes constants) ---
function createRNG(seed) {
  let s = seed >>> 0; // ensure 32-bit unsigned integer
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

// Fisher-Yates shuffle using seeded RNG — returns new array
function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick one element at random using seeded RNG
function pickRandom(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

// --- Node count per tier ---
const TIER_NODE_COUNTS = [1, 3, 3, 3, 2, 1];

// --- Y positions indexed by node count in tier ---
const Y_POSITIONS = {
  1: [50],
  2: [30, 70],
  3: [15, 50, 85],
};

// --- Node ID helpers ---
function makeNodeId(tier, index) {
  if (tier === 0) return 'START';
  if (tier === 5) return 'BOSS';
  return `${tier}${String.fromCharCode(65 + index)}`; // 1A, 1B, 1C ...
}

// --- Assign variant data to a node in-place ---
function assignVariant(node, rng) {
  switch (node.type) {
    case 'combat': {
      const keys = Object.keys(COMBAT_VARIANTS);
      const variantKey = pickRandom(keys, rng);
      const v = COMBAT_VARIANTS[variantKey];
      node.variant = variantKey;
      node.name    = v.name;
      node.threat  = v.threat;
      node.waves   = v.waves;
      node.reward  = `${v.command[0]}-${v.command[1]} Command, ${v.honor[0]}-${v.honor[1]} Honor`;
      break;
    }
    case 'elite': {
      const keys = Object.keys(ELITE_VARIANTS);
      const variantKey = pickRandom(keys, rng);
      const v = ELITE_VARIANTS[variantKey];
      node.variant = variantKey;
      node.name    = v.name;
      node.threat  = v.threat;
      node.waves   = v.waves;
      const gKeys  = Object.keys(v.guarantee);
      node.reward  = gKeys.map(k => `${v.guarantee[k]} ${k.replace(/_/g, ' ')}`).join(', ');
      break;
    }
    case 'event': {
      if (node.tierId === 0) {
        // START node — always the same
        node.variant = null;
        node.name    = 'Stronghold Gates';
        node.threat  = 0;
        node.waves   = 0;
        node.reward  = 'DEPART';
      } else {
        const eventId = pickRandom(EVENT_IDS, rng);
        node.variant = eventId;
        node.name    = eventId
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        node.threat  = 0;
        node.waves   = 0;
        node.reward  = 'Unknown';
      }
      break;
    }
    case 'shop': {
      node.variant = null;
      node.name    = 'Traveling Merchant';
      node.threat  = 0;
      node.waves   = 0;
      node.reward  = 'Buy Supplies';
      break;
    }
    case 'rest': {
      node.variant = null;
      node.name    = 'Rest Camp';
      node.threat  = 0;
      node.waves   = 0;
      node.reward  = 'Recover';
      break;
    }
    case 'boss': {
      node.variant = 'the_shogun';
      node.name    = 'The Shogun';
      node.threat  = 6;
      node.waves   = 6;
      node.reward  = 'Victory';
      break;
    }
    default: {
      node.variant = null;
      node.name    = node.type;
      node.threat  = 1;
      node.waves   = 3;
      node.reward  = '';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// generateMap — main export
// Returns flat array of node objects; deterministic for same seed + runNumber.
// ─────────────────────────────────────────────────────────────────────────────
export function generateMap(seed, runNumber) {
  // Mix seed and runNumber so different runs with same base seed differ
  const rng = createRNG(((seed >>> 0) ^ (runNumber * 2654435761)) >>> 0);

  // ── Pass 1: create tier arrays with types and positions ──────────────────
  const tiers = [];

  for (let tier = 0; tier <= 5; tier++) {
    const count   = TIER_NODE_COUNTS[tier];
    const pool    = NODE_POOL[`TIER_${tier}`];
    const types   = shuffle(pool, rng).slice(0, count);
    const x       = Math.round(tier * (90 / 5) + 8);
    const yPos    = Y_POSITIONS[count] || [50];

    const tierNodes = types.map((type, i) => ({
      id:      makeNodeId(tier, i),
      tierId:  tier,
      type,
      variant: null,
      name:    '',
      threat:  0,
      reward:  '',
      waves:   0,
      x,
      y:       yPos[i],
      next:    [],
      status:  tier === 0 ? 'available' : (tier === 5 ? 'boss' : 'locked'),
    }));

    tiers.push(tierNodes);
  }

  // ── Pass 2: build connections tier-by-tier ───────────────────────────────
  for (let tier = 0; tier < 5; tier++) {
    const current = tiers[tier];
    const next    = tiers[tier + 1];
    const reached = new Set();

    for (const node of current) {
      const shuffledNext  = shuffle(next, rng);
      // Bias toward 1 connection; ~40% chance of 2 when next tier has multiple nodes
      const wantTwo       = next.length > 1 && rng() < 0.4;
      const count         = wantTwo ? 2 : 1;
      const targets       = shuffledNext.slice(0, Math.min(count, next.length));
      node.next           = targets.map(n => n.id);
      targets.forEach(n => reached.add(n.id));
    }

    // Guarantee every next-tier node has ≥1 incoming connection
    for (const nextNode of next) {
      if (!reached.has(nextNode.id)) {
        const source = pickRandom(current, rng);
        if (!source.next.includes(nextNode.id)) {
          source.next.push(nextNode.id);
        }
        reached.add(nextNode.id);
      }
    }
  }

  // Boss must be reachable from ALL tier-4 nodes (spec requirement)
  const bossNode = tiers[5][0];
  for (const node of tiers[4]) {
    if (!node.next.includes(bossNode.id)) {
      node.next.push(bossNode.id);
    }
  }

  // ── Pass 3: assign variants, names, waves ────────────────────────────────
  for (const tierNodes of tiers) {
    for (const node of tierNodes) {
      assignVariant(node, rng);
    }
  }

  return tiers.flat();
}

// ─────────────────────────────────────────────────────────────────────────────
// applyNodeCompletion — immutable update
// Returns a new mapNodes array:
//   - completedNodeId.status  → 'completed'
//   - successors where ALL predecessors are completed → 'available'
// ─────────────────────────────────────────────────────────────────────────────
export function applyNodeCompletion(mapNodes, completedNodeId) {
  // Build predecessor map: nodeId → [predecessorIds]
  const predecessorMap = {};
  for (const node of mapNodes) {
    if (!predecessorMap[node.id]) predecessorMap[node.id] = [];
    for (const nextId of node.next) {
      if (!predecessorMap[nextId]) predecessorMap[nextId] = [];
      predecessorMap[nextId].push(node.id);
    }
  }

  // Build a quick lookup of current statuses (treating completedNodeId as completed)
  const statusOf = (id) => {
    if (id === completedNodeId) return 'completed';
    return mapNodes.find(n => n.id === id)?.status ?? 'locked';
  };

  const completedNode = mapNodes.find(n => n.id === completedNodeId);

  return mapNodes.map(node => {
    // Mark the completed node
    if (node.id === completedNodeId) {
      return { ...node, status: 'completed' };
    }

    // Unlock successors of the completed node whose all predecessors are now done
    if (
      node.status === 'locked' &&
      completedNode?.next.includes(node.id)
    ) {
      const preds = predecessorMap[node.id] ?? [];
      const allDone = preds.every(predId => statusOf(predId) === 'completed');
      if (allDone) {
        return { ...node, status: 'available' };
      }
    }

    return node;
  });
}
