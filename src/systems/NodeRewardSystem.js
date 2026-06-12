import { COMBAT_VARIANTS, ELITE_VARIANTS } from '../config/nodes.js';
import { BLESSINGS } from '../config/blessings.js';

function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rollInt(min, max, seedKey) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  if (low === high) return low;
  return low + (hashString(seedKey) % (high - low + 1));
}

function rangeFrom(value) {
  if (!Array.isArray(value)) return null;
  return { min: value[0], max: value[1] };
}

export function getNodeRewardPreview(node) {
  if (!node) return emptyRewardPreview();

  if (node.type === 'combat') {
    const variant = COMBAT_VARIANTS[node.variant];
    if (!variant) return emptyRewardPreview();
    return {
      command: rangeFrom(variant.command),
      honor: rangeFrom(variant.honor),
      squadCap: 0,
      blessingChoices: 0,
    };
  }

  if (node.type === 'elite') {
    const variant = ELITE_VARIANTS[node.variant];
    const guarantee = variant?.guarantee ?? {};
    return {
      command: null,
      honor: guarantee.honor ? { min: guarantee.honor, max: guarantee.honor } : null,
      squadCap: guarantee.squad_cap ?? 0,
      blessingChoices: guarantee.blessing_choice ?? 0,
    };
  }

  return emptyRewardPreview();
}

export function resolveNodeVictoryReward(node, runState) {
  const preview = getNodeRewardPreview(node);
  const seedBase = [
    runState?.mapSeed ?? 'no-seed',
    node?.id ?? runState?.currentNodeId ?? 'no-node',
    node?.type ?? runState?.currentNodeType ?? 'no-type',
    node?.variant ?? runState?.currentNodeVariant ?? 'no-variant',
  ].join(':');

  return {
    command: preview.command
      ? rollInt(preview.command.min, preview.command.max, `${seedBase}:command`)
      : 0,
    honor: preview.honor
      ? rollInt(preview.honor.min, preview.honor.max, `${seedBase}:honor`)
      : 0,
    squadCap: preview.squadCap ?? 0,
    blessingChoices: preview.blessingChoices ?? 0,
    blessings: pickBlessings(preview.blessingChoices ?? 0, `${seedBase}:blessing`),
  };
}

export function makeNodeFromRun(runState) {
  if (!runState?.currentNodeId) return null;
  return {
    id: runState.currentNodeId,
    type: runState.currentNodeType,
    variant: runState.currentNodeVariant,
    threat: runState.currentNodeThreat,
    waves: runState.currentNodeWaves,
  };
}

export function applyNodeRewardToRunState(runState, reward) {
  if (!runState || !reward) return runState;
  return {
    ...runState,
    baseCommand: (runState.baseCommand ?? 0) + (reward.command ?? 0),
    honorEarned: (runState.honorEarned ?? 0) + (reward.honor ?? 0),
    squadCapBonus: (runState.squadCapBonus ?? 0) + (reward.squadCap ?? 0),
    blessings: [
      ...(runState.blessings ?? []),
      ...((reward.blessings ?? []).map(makeBlessingEntry)),
    ],
  };
}

export function formatNodeRewardLines(node) {
  const preview = getNodeRewardPreview(node);
  const lines = [];

  if (preview.command) {
    lines.push({
      text: `${formatRange(preview.command)} Command`,
      tone: 'primary',
    });
  }

  if (preview.honor) {
    lines.push({
      text: `+${formatRange(preview.honor)} Honor`,
      tone: preview.command ? 'secondary' : 'primary',
    });
  }

  if (preview.squadCap > 0) {
    lines.push({
      text: `+${preview.squadCap} Squad Cap`,
      tone: lines.length ? 'secondary' : 'primary',
    });
  }

  if (preview.blessingChoices > 0) {
    lines.push({
      text: `Gain ${preview.blessingChoices} Blessing`,
      tone: lines.length ? 'secondary' : 'primary',
    });
  }

  return lines;
}

export function summarizeResolvedReward(reward) {
  const resources = [];
  const impacts = [];

  if ((reward?.command ?? 0) > 0) {
    resources.push({ name: 'Victory Command', change: `+${reward.command}`, color: 'text-[#4a5d23]' });
  }
  if ((reward?.honor ?? 0) > 0) {
    resources.push({ name: 'Victory Honor', change: `+${reward.honor}`, color: 'text-[#d4af37]' });
  }
  if ((reward?.squadCap ?? 0) > 0) {
    impacts.push({ description: `Squad cap increased by ${reward.squadCap} for this run`, color: 'text-[#2b3d60]' });
  }
  if ((reward?.blessingChoices ?? 0) > 0) {
    const names = (reward.blessings ?? []).map(id => BLESSINGS[id]?.name ?? id).join(', ');
    impacts.push({ description: `Blessing gained: ${names || reward.blessingChoices}`, color: 'text-[#4a5d23]' });
  }

  return { resources, impacts };
}

function emptyRewardPreview() {
  return {
    command: null,
    honor: null,
    squadCap: 0,
    blessingChoices: 0,
  };
}

function formatRange(range) {
  return range.min === range.max ? `${range.min}` : `${range.min}-${range.max}`;
}

function pickBlessings(count, seedKey) {
  const ids = Object.keys(BLESSINGS);
  const picked = [];
  for (let i = 0; i < count && ids.length > 0; i++) {
    picked.push(ids[hashString(`${seedKey}:${i}`) % ids.length]);
  }
  return picked;
}

function makeBlessingEntry(blessingId) {
  const blessing = BLESSINGS[blessingId];
  if (!blessing) return { id: blessingId, combatsRemaining: 3 };

  if (typeof blessing.duration === 'number') {
    return { id: blessingId, combatsRemaining: blessing.duration };
  }
  if (blessing.duration === 'next') {
    return { id: blessingId, combatsRemaining: 1 };
  }
  if (blessing.duration === 'run') {
    return { id: blessingId, combatsRemaining: Infinity };
  }
  return { id: blessingId, combatsRemaining: 3 };
}
