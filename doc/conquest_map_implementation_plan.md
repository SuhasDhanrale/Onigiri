# Conquest Map — Implementation Plan

> **Based on:** `doc/conquest_map_design.md` v1.3.1
> **Architecture ref:** `ARCHITECTURE_PLAN.md`
> **Target screen:** `src/ui/screens/HubTestScreen.jsx` → replaces `src/ui/screens/MapScreen.jsx`
> **Status:** Ready for implementation
> **Date:** March 30, 2026

---

## How to Use This Document

This plan divides the full conquest map feature into **9 sequential steps**. Each step:

- Has a single clear goal
- Lists exact files to create or edit (no guessing)
- Defines the exact data shape or component contract before any code is written
- Ends with a specific test you can run to confirm it works
- Has a **"Hallucination Guard"** block — rules the AI must follow when implementing that step

Complete one step, confirm the test passes, then move to the next. Never skip steps.

---

## Confirmed Architecture Decisions

| Decision | Answer |
|----------|--------|
| HubTestScreen vs MapScreen | HubTestScreen **replaces** MapScreen.jsx. App.jsx routes to HubTestScreen. |
| Currency naming | **Global rename: Koku → Command** across all source files |
| Progression structure | **Merge into PROVISIONS**: PERMANENT_TECHS + HEIRLOOMS + new Starting Bonuses + Tower Upgrades |

---

## Step Overview

| Step | Name | Category | Risk |
|------|------|----------|------|
| 1 | Global Rename: Koku → Command | Refactor | Low |
| 2 | Config Layer: Provisions, Blessings, Curses, Nodes | Data | Very Low |
| 3 | Run State + useMeta Expansion | State | Low |
| 4 | Map Generator System | Logic | Medium |
| 5 | Event, Shop, Rest Systems | Logic | Medium |
| 6 | HubTestScreen → MapScreen Integration | UI | Low |
| 7 | Node Interaction + Play Button Wiring | UI + Routing | Medium |
| 8 | Tooltip Upgrade + Visual Polish | UI | Low |
| 9 | Combat Systems Bridge: RunState → Combat | Systems | High |

---

## Step 1 — Global Rename: Koku → Command

### Goal

Align code terminology with the design document. Every variable, prop, event, and comment that says `koku`/`Koku`/`KOKU` becomes `command`/`Command`/`COMMAND`.

### Why first

All future steps emit `COMMAND_CHANGED` events, pass `command` props, and read `state.command`. If we rename after building, we break the new code. Do this once, do it now.

### Files to Rename Inside

Search the entire `src/` directory for the string `koku` (case-insensitive). Expected hits:

| File | Examples to rename |
|------|--------------------|
| `src/config/campaign.js` | reward strings, `ENEMY_COSTS` comments |
| `src/config/progression.js` | HEIRLOOM desc (`"Taps grant extreme Koku"`) |
| `src/core/GameState.js` | `state.koku`, initial value |
| `src/systems/RewardSystem.js` | `koku` drop logic, `bus.emit('KOKU_CHANGED')` |
| `src/systems/SpellSystem.js` | `harvest` spell, any koku spending |
| `src/systems/BarracksSystem.js` | training cost checks |
| `src/hooks/useMeta.js` | if koku is in meta state |
| `src/ui/panels/EconomyHeader.jsx` | display label, props |
| `src/ui/panels/CommandPanel.jsx` | prop names |
| `src/ui/screens/HubTestScreen.jsx` | any mock data references |
| `App.jsx` | state and prop passing |

### Exact Rename Map

```
koku            → command
Koku            → Command
KOKU            → COMMAND
kokuRef         → commandRef
setKoku         → setCommand
onKokuChange    → onCommandChange
KOKU_CHANGED    → COMMAND_CHANGED   (EventBus event name)
koku_drops      → command_drops
```

### Critical: `equippedHeirloom` field rename

`useMeta.js` currently stores `equippedHeirloom`. Three combat system files read this by string key:

| File | Line | Current code | After rename |
|------|------|-------------|-------------|
| `src/systems/BarracksSystem.js` | 15 | `metaRef.current.equippedHeirloom === 'IMPERIAL_BANNER'` | `metaRef.current.equippedItem === 'IMPERIAL_BANNER'` |
| `src/systems/SpawnSystem.js` | 62 | `metaRef.current.equippedHeirloom === 'DEMON_MASK'` | `metaRef.current.equippedItem === 'DEMON_MASK'` |
| `src/systems/RewardSystem.js` | 25 | `metaRef.current.equippedHeirloom === 'BLOOD_KATANA'` | `metaRef.current.equippedItem === 'BLOOD_KATANA'` |

**The string values (`'IMPERIAL_BANNER'`, `'DEMON_MASK'`, `'BLOOD_KATANA'`) do NOT change** — they are provision IDs, they stay the same. Only the field name on the meta object changes.

Also rename in `src/core/utils.js` — `getSquadCap` receives `equippedHeirloom` as a parameter:

```js
// src/core/utils.js — find the getSquadCap signature and rename the parameter
// Before: getSquadCap(key, level, equippedHeirloom, conqueredRegions)
// After:  getSquadCap(key, level, equippedItem, conqueredRegions)
// Also rename internal usage inside the function body
```

Call sites that pass this parameter:
- `src/systems/BarracksSystem.js:23` — `getSquadCap(key, level, metaRef.current.equippedHeirloom, ...)` → `metaRef.current.equippedItem`

### Hallucination Guard

- **DO NOT** rename file names (e.g. `koku.js` does not exist, do not create one)
- **DO NOT** change any game logic — only identifiers
- **DO NOT** rename CSS classes unless they literally say "koku"
- **DO NOT** touch `public/assets/` — nothing there uses this term
- **DO NOT** change the provision ID strings themselves (`'DEMON_MASK'`, `'BLOOD_KATANA'`, `'IMPERIAL_BANNER'`) — only the meta field name changes from `equippedHeirloom` to `equippedItem`

### Test for Step 1

1. Run `npm run dev` — game loads with no console errors
2. Play one wave — Command counter in EconomyHeader updates correctly
3. Equip DEMON_MASK in meta — units spawn with reduced HP and tripled damage (SpawnSystem check still works)
4. Search codebase for `koku` (case-insensitive) — zero results (except this document)
5. Search for `equippedHeirloom` — zero results

---

## Step 2 — Config Layer: Provisions, Blessings, Curses, Nodes

### Goal

Create all static data files that the new systems will read. No logic, no React, no imports between these files. Pure data objects.

### Files to Create

#### `src/config/provisions.js` (replaces + extends `progression.js`)

```js
// PROVISIONS replaces PERMANENT_TECHS + HEIRLOOMS
// All provisions are purchased with Honor in the Dojo
// Once unlocked, they apply to all future runs automatically

export const PROVISIONS = {
  // --- ITEMS (equip one per run) ---
  DEMON_MASK:      { id: 'DEMON_MASK',      type: 'item',          name: 'Demon Mask',             cost: 150, desc: '+25% damage, -10% max HP', icon: '👹' },
  IMPERIAL_BANNER: { id: 'IMPERIAL_BANNER', type: 'item',          name: 'Imperial Banner',        cost: 200, desc: '+20% unit attack speed', icon: '🎌' },
  BLOOD_KATANA:    { id: 'BLOOD_KATANA',    type: 'item',          name: 'Blood Katana',           cost: 175, desc: '+15% crit chance', icon: '🗡️' },
  SPIKED_CALTROPS: { id: 'SPIKED_CALTROPS', type: 'item',          name: 'Spiked Caltrops',        cost: 125, desc: 'Enemies take damage when attacking barricades', icon: '⚙️' },
  // --- STARTING BONUSES (passive, always active) ---
  COMMANDERS_SEAL: { id: 'COMMANDERS_SEAL', type: 'starting_bonus', name: "Commander's Seal",      cost: 100, desc: '+15 Starting Command per run', icon: '📜' },
  WAR_CHEST:       { id: 'WAR_CHEST',       type: 'starting_bonus', name: 'War Chest',             cost: 150, desc: '+25 Starting Command per run', icon: '🪙' },
  SHOGUNS_DECREE:  { id: 'SHOGUNS_DECREE',  type: 'starting_bonus', name: "Shogun's Decree",       cost: 250, desc: '+40 Starting Command per run', icon: '👑' },
  // --- TOWER UPGRADES (apply to all starting towers) ---
  REINFORCED_FOUNDATIONS: { id: 'REINFORCED_FOUNDATIONS', type: 'tower_upgrade', name: 'Reinforced Foundations', cost: 175, desc: 'Starting towers have +20% HP', icon: '🏯' },
  VETERAN_ENGINEERS:      { id: 'VETERAN_ENGINEERS',      type: 'tower_upgrade', name: 'Veteran Engineers',      cost: 200, desc: 'Starting towers deal +10% damage', icon: '⚒️' },
  FORTIFIED_POSITIONS:    { id: 'FORTIFIED_POSITIONS',    type: 'tower_upgrade', name: 'Fortified Positions',    cost: 225, desc: 'Starting towers have +15% range', icon: '🏹' },
};

// Keep old export aliases so CombatScreen/App.jsx don't break before Step 6
export const PERMANENT_TECHS = {
  SPIKED_CALTROPS: PROVISIONS.SPIKED_CALTROPS,
};
export const HEIRLOOMS = {
  DEMON_MASK:      PROVISIONS.DEMON_MASK,
  IMPERIAL_BANNER: PROVISIONS.IMPERIAL_BANNER,
  BLOOD_KATANA:    PROVISIONS.BLOOD_KATANA,
};
```

#### `src/config/blessings.js` (new file)

```js
// Blessings are temporary buffs gained during a run (events, rest nodes, shop)
// duration: number of combats remaining | 'run' = entire run | 'next' = next combat only

export const BLESSINGS = {
  WAR_DRUMS:       { id: 'WAR_DRUMS',       name: 'War Drums',        effect: 'attack_speed', value: 0.20, duration: 3,      desc: '+20% attack speed for 3 combats' },
  BLOODLUST:       { id: 'BLOODLUST',       name: 'Bloodlust',        effect: 'damage_hp',    value: [0.30, -0.10], duration: 'next', desc: '+30% damage, -10% max HP (next combat)' },
  STONE_STANCE:    { id: 'STONE_STANCE',    name: 'Stone Stance',     effect: 'defense',      value: 0.25, duration: 3,      desc: '+25% defense for 3 combats' },
  EAGLE_EYE:       { id: 'EAGLE_EYE',       name: 'Eagle Eye',        effect: 'archer_range', value: 0.30, duration: 2,      desc: '+30% archer range for 2 combats' },
  SWIFT_FEET:      { id: 'SWIFT_FEET',      name: 'Swift Feet',       effect: 'move_speed',   value: 0.20, duration: 3,      desc: '+20% unit move speed for 3 combats' },
  LOOTING:         { id: 'LOOTING',         name: 'Looting Spree',    effect: 'command_drops',value: 0.25, duration: 'next', desc: '+25% command drops (next combat)' },
  ANCESTOR_FURY:   { id: 'ANCESTOR_FURY',   name: "Ancestor's Fury",  effect: 'damage',       value: 0.25, duration: 'next', desc: '+25% damage (next combat)' },
  IRON_WILL:       { id: 'IRON_WILL',       name: 'Iron Will',        effect: 'max_hp',       value: 0.25, duration: 'next', desc: '+25% max HP (next combat)' },
  FOX_SPEED:       { id: 'FOX_SPEED',       name: "Fox's Speed",      effect: 'move_speed',   value: 0.20, duration: 'run',  desc: '+20% unit speed for entire run' },
  HOLY_PROTECTION: { id: 'HOLY_PROTECTION', name: 'Holy Protection',  effect: 'necro_immune', value: true, duration: 'run',  desc: 'Immune to necromancer enemies this run' },
};
```

#### `src/config/curses.js` (new file)

```js
// Curses are debuffs that persist until removed
// removal: how the curse can be removed

export const CURSES = {
  WEAKENED:      { id: 'WEAKENED',      name: 'Weakened',       effect: 'damage',        value: -0.15, removal: 'shop_rest_event', desc: '-15% damage' },
  CURSED_GOODS:  { id: 'CURSED_GOODS',  name: 'Cursed Goods',   effect: 'max_hp',        value: -0.15, removal: 'shop_rest_event', desc: '-15% max HP' },
  HAUNTED:       { id: 'HAUNTED',       name: 'Haunted',        effect: 'random_debuff', value: true,  removal: 'shop_event',      desc: 'Random debuff at start of each combat' },
  FOX_DEBT:      { id: 'FOX_DEBT',      name: "Fox's Debt",     effect: 'boss_rewards',  value: -0.50, removal: 'shop_event',      desc: '-50% rewards from boss' },
  OUTLAW:        { id: 'OUTLAW',        name: 'Outlaw',         effect: 'honor',         value: -0.30, removal: 'time_3_combats',  desc: '-30% honor from all sources (expires after 3 combats)' },
  VILLAGE_WRATH: { id: 'VILLAGE_WRATH', name: 'Village Wrath',  effect: 'event_outcomes',value: -0.50, removal: 'time_5_nodes',   desc: 'Worse event outcomes (expires after 5 nodes)' },
  DIVINE_WRATH:  { id: 'DIVINE_WRATH',  name: 'Divine Wrath',   effect: 'max_hp',        value: -0.20, removal: 'shrine_event',    desc: '-20% max HP this run' },
  NECRO_WRATH:   { id: 'NECRO_WRATH',   name: "Necromancer's Wrath", effect: 'necro_revive', value: true, removal: 'never',       desc: 'Enemy dead revive in all future combats' },
};
```

#### `src/config/nodes.js` (new file)

```js
// Static definitions for each node variant (the template, not the generated instance)
// Map generator reads from NODE_POOL to produce a run's concrete map

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
  tengu_master:    { id: 'tengu_master',    name: 'Tengu Master',     threat: 4, guarantee: { honor: 25 },          special: 'dodge_50_arrows' },
  oni_warlord:     { id: 'oni_warlord',     name: 'Oni Warlord',      threat: 5, guarantee: { honor: 40 },          special: 'rage_mode' },
  shinobi_squad:   { id: 'shinobi_squad',   name: 'Shinobi Squad',    threat: 4, guarantee: { squad_cap: 1 },        special: 'target_buildings' },
  onmyoji_ritual:  { id: 'onmyoji_ritual',  name: 'Onmyoji Ritual',   threat: 5, guarantee: { honor: 30 },          special: 'summon_reinforcements' },
  yamabushi:       { id: 'yamabushi',       name: 'Yamabushi Monk',   threat: 4, guarantee: { blessing_choice: 1 }, special: 'self_heal' },
  ronin_duel:      { id: 'ronin_duel',      name: 'Masterless Ronin', threat: 4, guarantee: { honor: 30 },          special: 'duel_challenge' },
};

// NODE_POOL defines which types appear in each tier during map generation
// The generator picks variants randomly within each type
export const NODE_POOL = {
  TIER_0: ['event'],                                          // Always start node
  TIER_1: ['combat', 'combat', 'combat', 'event'],           // Combat focus
  TIER_2: ['combat', 'combat', 'elite', 'event'],            // First elite possible
  TIER_3: ['combat', 'elite', 'event', 'shop'],              // Shop appears
  TIER_4: ['combat', 'elite', 'rest', 'shop'],               // Rest before boss
  TIER_5: ['boss'],                                           // Always boss
};

export const SHOP_ITEMS = {
  // Tier 1 — cheap utility
  fresh_recruits:    { id: 'fresh_recruits',    tier: 1, price: [30, 60],   effect: 'plus_1_unit_choice',       desc: 'Choose 1 unit type to add', duration: 'immediate' },
  scout_report:      { id: 'scout_report',      tier: 1, price: [20, 40],   effect: 'reveal_next_tier',         desc: 'Reveal all nodes in next tier', duration: 'immediate' },
  quick_repairs:     { id: 'quick_repairs',     tier: 1, price: [40, 60],   effect: 'repair_towers_50',         desc: 'Restore 50% HP to all towers', duration: 'immediate' },
  // Tier 2 — build defining
  flaming_arrows:    { id: 'flaming_arrows',    tier: 2, price: [80, 120],  effect: 'archers_fire_damage',      desc: 'Archers deal +25% fire damage', duration: 'run' },
  rapid_deployment:  { id: 'rapid_deployment',  tier: 2, price: [100, 140], effect: 'barracks_2x_speed',        desc: 'Barracks spawn units 2x faster', duration: 'run' },
  spell_mastery:     { id: 'spell_mastery',     tier: 2, price: [110, 150], effect: 'spell_cooldown_minus_20',  desc: 'All spell cooldowns -20%', duration: 'run' },
  curse_removal:     { id: 'curse_removal',     tier: 2, price: [70, 100],  effect: 'remove_1_curse',           desc: 'Remove 1 curse', duration: 'immediate' },
  // Tier 3 — run defining
  iron_fortifications:{ id: 'iron_fortifications', tier: 3, price: [200, 280], effect: 'towers_double_hp',     desc: 'All towers have +100% HP', duration: 'run' },
  elite_training:    { id: 'elite_training',    tier: 3, price: [180, 240], effect: 'upgrade_all_units',        desc: '+15% all unit stats', duration: 'run' },
  command_expansion: { id: 'command_expansion', tier: 3, price: [200, 300], effect: 'base_command_plus_30',     desc: '+30 Base Command this run', duration: 'run' },
  dragon_scroll:     { id: 'dragon_scroll',     tier: 3, price: [280, 350], effect: 'unlock_dragon_wave',       desc: 'Unlock Dragon Wave spell', duration: 'run' },
};

export const REST_OPTIONS = {
  RECRUIT_CAP: { id: 'RECRUIT_CAP', name: 'Establish Garrison', effect: 'set_base_spawn',        desc: 'Set units that auto-spawn at start of next combat' },
  REMOVE_CURSE:{ id: 'REMOVE_CURSE',name: 'Purification Rites', effect: 'remove_1_curse',        desc: 'Remove 1 curse of your choice' },
  BLESSING:    { id: 'BLESSING',    name: 'War Council',         effect: 'choose_blessing_from_2', desc: 'Choose 1 blessing from 2 options' },
};
```

### Files to Edit

| File | Change |
|------|--------|
| `src/config/progression.js` | Replace content with `provisions.js` (keep alias exports for now) |
| `src/hooks/useMeta.js` | Add `unlockedProvisions: []` to initial state (alongside existing fields) |

### Hallucination Guard

- **DO NOT** write any logic in config files — pure data objects only
- **DO NOT** import from other config files inside config files
- **DO NOT** create `EliteSystem.js` yet — that is Step 9
- The `PERMANENT_TECHS` and `HEIRLOOMS` alias exports in `provisions.js` are **temporary** — they prevent Step 4 UI breakage; delete them in Step 6

### Critical: What the aliases do NOT fix

The aliases in `provisions.js` only fix **data shape imports**. They do not fix the **runtime string checks** in combat systems. These three lines check `metaRef.current.equippedItem` (renamed in Step 1) by string value:

| File | Check | Status after Step 1 |
|------|-------|-------------------|
| `BarracksSystem.js:15` | `equippedItem === 'IMPERIAL_BANNER'` | Safe — ID string unchanged |
| `SpawnSystem.js:62` | `equippedItem === 'DEMON_MASK'` | Safe — ID string unchanged |
| `RewardSystem.js:25` | `equippedItem === 'BLOOD_KATANA'` | Safe — ID string unchanged |

These checks will continue to work **if and only if** Step 1 renamed `equippedHeirloom` → `equippedItem` on the meta object AND the PROVISIONS IDs (`'DEMON_MASK'` etc.) were not changed. Verify this before proceeding.

Also note: `SpawnSystem.js:85` checks `metaRef.current.unlockedTechs.includes('TAKEDA_CHARGE')`. After this step, `SPIKED_CALTROPS` is now a PROVISION with `type: 'item'` — but `TAKEDA_CHARGE` is **not** in PROVISIONS yet (it was in the old PERMANENT_TECHS). Verify whether TAKEDA_CHARGE needs to be added to PROVISIONS or handled separately. If missing, cavalry charge will silently break.

> **Resolution:** Add `TAKEDA_CHARGE` to PROVISIONS in this step under `type: 'starting_bonus'` with appropriate cost, and rename the check in `SpawnSystem.js:85` from `unlockedTechs` to `unlockedProvisions`.

### Test for Step 2

1. Import `PROVISIONS` in browser console (or a test component) — it logs correctly
2. `npm run dev` — no import errors in console
3. Grep for `PERMANENT_TECHS` — only found in `App.jsx` and combat files (covered by aliases)
4. Grep for `unlockedTechs` — should only be in `useMeta.js` (as a legacy field, kept for now) and `SpawnSystem.js:85` (updated to `unlockedProvisions`)

---

## Step 3 — Run State + useMeta Expansion

### Goal

Add the full **run-persistent state** layer. When a player starts a run, this object is created fresh. It tracks blessings, curses, base command, and current node — all things that persist within a run but reset between runs.

### What Changes

#### `src/hooks/useMeta.js` — add permanent meta fields

```js
// New shape of meta state:
{
  // PERMANENT (survives across runs — already exists)
  honor: 0,
  unlockedProvisions: [],         // replaces unlockedHeirlooms + unlockedTechs
  equippedItem: null,             // replaces equippedHeirloom (single item slot)
  conqueredRegions: [],           // keep as-is

  // --- FIELDS BELOW ARE NEW ---
  totalRuns: 0,                   // for dynamic difficulty scaling
}
```

#### `src/core/GameState.js` — add `createRunState()` factory

This is a **new exported function** added to the existing file. The existing `createInitialState()` stays untouched.

```js
// src/core/GameState.js — ADD this function (do not remove existing exports)

export function createRunState(meta) {
  // meta = the current useMeta state, used to apply provision bonuses at run start

  // Calculate starting command from provisions
  const startingCommandBonus = 
    (meta.unlockedProvisions.includes('COMMANDERS_SEAL') ? 15 : 0) +
    (meta.unlockedProvisions.includes('WAR_CHEST')       ? 25 : 0) +
    (meta.unlockedProvisions.includes('SHOGUNS_DECREE')  ? 40 : 0);

  return {
    // Economy
    baseCommand: 100 + startingCommandBonus,  // persists between nodes, resets before each node
    honorEarned: 0,                            // honor accumulated this run (added to meta on run end)

    // Status effects (arrays of { id, combatsRemaining })
    blessings: [],
    curses: [],

    // Navigation
    currentNodeId: 'START',
    completedNodeIds: [],
    mapSeed: Date.now(),              // used by MapGenerator

    // Garrison (from rest node)
    pendingGarrison: null,            // { units: [...] } | null

    // Shop purchase flags (one per tier per shop visit)
    shopPurchases: {},

    // Run metadata
    runNumber: (meta.totalRuns || 0) + 1,
    activeItem: meta.equippedItem,    // copy of equipped provision for this run
  };
}
```

#### `src/hooks/useRunState.js` — new hook (new file)

```js
// Manages the current run's state (blessings, curses, baseCommand, current node)
// Created fresh at run start, discarded at run end

import { useState, useRef, useEffect } from 'react';
import { createRunState } from '../core/GameState.js';

export function useRunState() {
  const [runState, setRunState] = useState(null);  // null = not in a run
  const runStateRef = useRef(null);

  useEffect(() => {
    runStateRef.current = runState;
  }, [runState]);

  function startRun(meta) {
    const fresh = createRunState(meta);
    setRunState(fresh);
    return fresh;
  }

  function endRun() {
    setRunState(null);
  }

  return { runState, setRunState, runStateRef, startRun, endRun };
}
```

### Hallucination Guard

- **DO NOT** remove or rename anything in `createInitialState()` — combat depends on it
- `runState` is **never passed** to the canvas game loop — it stays in React/UI layer
- `baseCommand` in `runState` is **not** the same as `command` in `GameState` (combat currency). `baseCommand` = allocation per map node; `command` = in-combat spending currency
- The `createRunState` function only reads from `meta` — it does not import `useMeta`
- **DO NOT** persist `runState` to localStorage in this step (that is Step 5)

### Test for Step 3

1. In `App.jsx` (or any test component), call `startRun(meta)` and log the result — should print a valid runState object
2. Unlock `COMMANDERS_SEAL` in meta test → `baseCommand` should be 115
3. `runState` is `null` before `startRun` is called — confirm in React DevTools

---

## Step 4 — Map Generator System

### Goal

Create a procedural map generator that produces a concrete node graph for a run. The generator reads `NODE_POOL` from `nodes.js`, uses the run seed, and outputs a flat array of node objects that HubTestScreen renders.

### File to Create: `src/systems/MapGenerator.js`

**Contract — what this file exports:**

```js
// INPUT
generateMap(seed, runNumber)

// OUTPUT — array of node objects, one per node in the run
[
  {
    id: 'START',                     // unique string ID
    tierId: 0,                       // 0 = leftmost, 5 = boss
    type: 'event',                   // from NODE_TYPES
    variant: 'ronin_encounter',      // specific variant id (from COMBAT_VARIANTS etc.)
    name: 'Stronghold Gates',        // display name
    threat: 0,                       // 0-7
    reward: 'DEPART',                // human-readable reward preview
    x: 8,                            // % based position for rendering
    y: 50,
    next: ['1A', '1B', '1C'],        // node IDs this connects to
    status: 'available',             // 'available' | 'locked' | 'completed' | 'active' | 'boss'
  },
  // ... more nodes
]
```

**Internal algorithm (what the code must do — do not deviate):**

```
1. Seed a simple LCG (linear congruential generator) with the run seed
2. For each tier 0-5:
   a. Pick N nodes from NODE_POOL[TIER_N] — N = how many columns in that tier
      - Tier 0:  1 node
      - Tier 1:  3 nodes  (pick 3 from pool, shuffle pool first)
      - Tier 2:  3 nodes
      - Tier 3:  3 nodes
      - Tier 4:  2 nodes
      - Tier 5:  1 node (always boss)
   b. Assign Y positions evenly spaced: positions = [15, 50, 85] for 3 nodes, [30, 70] for 2
   c. X positions: tier * (90 / 5) + 8
3. Build connections:
   a. Each node in tier N connects to 1-2 nodes in tier N+1
   b. Rule: no node in tier N+1 can be unreachable (every node must have at least 1 incoming connection)
   c. Rule: boss always has all tier-4 nodes connecting to it
4. Set initial status:
   a. START node: 'available'
   b. All others: 'locked'
5. For each node, pick a specific variant:
   a. combat → random from COMBAT_VARIANTS using seeded RNG
   b. elite → random from ELITE_VARIANTS
   c. event → random event id from EVENT_IDS (create a list)
   d. shop / rest → no variant needed
   e. boss → always 'the_shogun'
6. Return the flat array
```

**LCG implementation (use exactly this, no external libraries):**

```js
// Simple seeded RNG — deterministic, no dependencies
function createRNG(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}
```

### Hallucination Guard

- **DO NOT** import React or any hook
- **DO NOT** generate enemy wave data — WaveSystem.js does that at combat time
- **DO NOT** hardcode specific node layouts — use the algorithm above
- The generator **does not** persist state — it is a pure function: same seed = same map every time
- Event variant IDs are just strings (e.g. `'ronin_encounter'`) — the EventSystem (Step 5) maps them to full event objects
- **DO NOT** create `EliteSystem.js` in this step

### Test for Step 4

```js
// Paste in browser console after import:
import { generateMap } from './src/systems/MapGenerator.js';
const map = generateMap(12345, 1);
console.log(map.length);            // should be ~13-15 nodes
console.log(map[0].id);             // 'START'
console.log(map[map.length-1].type);// 'boss'

// Same seed = same map:
const map2 = generateMap(12345, 1);
console.log(JSON.stringify(map) === JSON.stringify(map2)); // true
```

---

## Step 5 — Event, Shop, Rest Node Systems

### Goal

Create the three interactive node systems. These are pure logic files — no React, no canvas. They take the current `runState`, process a player's choice, and return an updated `runState`.

### File: `src/systems/EventSystem.js`

**Contract:**

```js
// Returns the full event object for a given event variant id
getEvent(variantId)  →  { id, name, text, choices: [ { id, label, effect, risk } ] }

// Applies a player's choice to runState. Returns new runState (immutable update).
applyEventChoice(runState, eventId, choiceId)  →  newRunState
```

**Event IDs to implement (minimum for Step 5):**

```
ronin_encounter, shrine_maiden, abandoned_cache, deserting_soldier,
peasant_village, cursed_ground, traveling_merchant, fox_spirit,
hidden_dojo, wounded_scout, gambling_den, ancestral_shrine
```

Each event must reference blessing/curse IDs from `blessings.js` and `curses.js` rather than duplicating effect data.

**Example event object shape:**

```js
{
  id: 'ronin_encounter',
  name: 'Ronin Encounter',
  text: 'A masterless samurai blocks your path, hand on his blade.',
  choices: [
    {
      id: 'hire',
      label: 'Hire Him',
      cost: { command: 100 },
      effect: { type: 'add_unit', unit: 'hatamoto', temp: true },
      risk: null,
    },
    {
      id: 'duel',
      label: 'Challenge to Duel',
      cost: null,
      effect: { type: 'combat', variant: 'ronin_duel', onWin: { honor: 30, unit: 'ronin' }, onLoss: { honor: -20 } },
      risk: 'Combat encounter',
    },
    {
      id: 'bow',
      label: 'Bow and Pass',
      cost: null,
      effect: { type: 'honor', value: 5 },
      risk: null,
    },
  ],
}
```

### File: `src/systems/ShopSystem.js`

**Contract:**

```js
// Generates the shop inventory for a given shop node (uses run seed + node id)
generateShopInventory(runState, nodeId)  →  [ shopItemId, shopItemId, shopItemId ]
// Returns 3-4 item IDs (one from each tier, possibly a sale)

// Applies a purchase. Returns new runState.
purchaseItem(runState, itemId)  →  newRunState
// Deducts command, records in shopPurchases, applies effect if immediate
```

**Shop rules (enforce in code):**

- Max 1 item per tier purchased per shop visit
- Sale: 20% chance an item is 30% off (use seeded RNG from runState.mapSeed + nodeId)
- If `runState.baseCommand < item.price`, return unchanged runState with an error flag

### File: `src/systems/RestSystem.js`

**Contract:**

```js
// Returns available rest options for this node
// (some options may be locked if no curses active)
getRestOptions(runState)  →  [ REST_OPTION, ... ]

// Applies a rest choice. Returns new runState.
applyRestChoice(runState, optionId, payload)  →  newRunState
// payload examples:
//   optionId = 'RECRUIT_CAP' → payload = { size: 'small' | 'medium' | 'large' }
//   optionId = 'REMOVE_CURSE' → payload = { curseId: 'HAUNTED' }
//   optionId = 'BLESSING' → payload = { blessingId: 'WAR_DRUMS' }
```

### Hallucination Guard

- **DO NOT** import React in any system file
- `applyEventChoice` must return a **new object** (do not mutate `runState` directly): `return { ...runState, ... }`
- Event choices that trigger **combat** (e.g. ronin duel) return a special flag: `{ ...newRunState, pendingCombat: { variant: 'ronin_duel' } }` — the UI layer reads this flag and routes to CombatScreen
- **DO NOT** implement the Necromancer Power event (Event 13) in this step — mark it as `// TODO: Planned feature`
- All honor changes go into `runState.honorEarned` (not directly into `meta.honor`) — meta honor is only updated when the run ends

### Test for Step 5

```js
import { getEvent, applyEventChoice } from './src/systems/EventSystem.js';
import { createRunState } from './src/core/GameState.js';

const run = createRunState({ unlockedProvisions: [], equippedItem: null, totalRuns: 0 });

// Test event retrieval
const event = getEvent('abandoned_cache');
console.log(event.choices.length); // 3

// Test choice application
const result = applyEventChoice(run, 'abandoned_cache', 'take_all');
console.log(result.baseCommand);   // 300 (base 100 + event +200)
console.log(result.curses.length); // 1 (CURSED_GOODS applied)
console.log(run.baseCommand);      // 100 (original unchanged — immutable)
```

---

## Step 6 — HubTestScreen → MapScreen Integration

### Goal

Integrate `HubTestScreen.jsx` into the live routing system. Replace `MapScreen.jsx` with it. Wire it to real data instead of mock data.

### Changes

#### `App.jsx`

- Import `HubTestScreen` instead of `MapScreen`
- Pass `meta`, `setMeta`, `runState`, `setRunState`, `startRun` as props
- Routing: `gameState === 'MAP_SCREEN'` renders `<HubTestScreen ... />`

```jsx
// App.jsx routing block (simplified):
if (appScreen === 'MAP_SCREEN') {
  return (
    <HubTestScreen
      meta={meta}
      setMeta={setMeta}
      runState={runState}
      startRun={startRun}
      onPlayNode={(nodeId) => {
        startRun(meta);
        setCurrentNodeId(nodeId);
        setAppScreen('COMBAT_SCREEN');
      }}
    />
  );
}
```

#### `HubTestScreen.jsx` — replace mock data with real data

| Mock → Real |
|-------------|
| `const techs = { ... }` → import `PROVISIONS` from `provisions.js`, filter by `meta.unlockedProvisions` |
| `const heirlooms = [ ... ]` → filter `PROVISIONS` by `type === 'item'` |
| `const spireNodes = [ ... ]` → call `generateMap(runState?.mapSeed, meta.totalRuns)` |
| Honor display `1,250` → `meta.honor` |

#### Dojo Tab — real provisions

The Dojo tab should show provisions grouped by type:

```jsx
// Group provisions by type for display
const items          = Object.values(PROVISIONS).filter(p => p.type === 'item');
const startingBonuses= Object.values(PROVISIONS).filter(p => p.type === 'starting_bonus');
const towerUpgrades  = Object.values(PROVISIONS).filter(p => p.type === 'tower_upgrade');

// A provision is "unlocked" if its id is in meta.unlockedProvisions
const isUnlocked = (id) => meta.unlockedProvisions.includes(id);
```

#### Shrine Tab → Provision Unlock UI

The Shrine tab becomes the **Provision unlock shop**:
- Shows all provisions grouped by type
- Locked ones show cost in Honor
- Clicking an unlocked provision equips it as `meta.equippedItem` (items only)
- Clicking a locked provision shows "Requires X Honor" if affordable, triggers `setMeta` to unlock

#### Delete `src/ui/screens/MapScreen.jsx`

Only after this step's tests pass. Keep a commented copy in git history.

#### `src/config/progression.js` — remove alias exports

Delete the `PERMANENT_TECHS` and `HEIRLOOMS` alias exports added in Step 2. Update any remaining imports.

### Hallucination Guard

- **DO NOT** rewrite HubTestScreen's CSS or layout — only replace data sources
- **DO NOT** change the drag-to-scroll logic — it already works
- **DO NOT** add game state management to HubTestScreen directly — it receives everything as props
- If `runState === null` (no run started yet), HubTestScreen generates a **preview map** with `generateMap(Date.now(), 0)` — this is just visual, the real map is seeded when `startRun()` is called
- The `onPlayNode` callback prop is wired in `App.jsx` — HubTestScreen only calls it, doesn't implement the routing

### Test for Step 6

1. Open the app — Map/Hub screen renders with real honor value from `useMeta`
2. The conquest map shows generated nodes (not the hardcoded mock array)
3. Dojo tab shows real PROVISIONS with unlock states
4. `npm run dev` — no console errors
5. Old `MapScreen.jsx` usage is gone from `App.jsx`

---

## Step 7 — Node Interaction + Play Button Wiring

### Goal

Make the map interactive: clicking a node selects it, "Play Selected Area" triggers the correct combat or event modal, and node status updates when a node is completed.

### New State: `selectedNodeId`

Add `const [selectedNodeId, setSelectedNodeId] = useState(null)` to `HubTestScreen`.

**Node click rules:**

- Only nodes with `status === 'available'` or `status === 'active'` are clickable
- Clicking selects the node (highlight it)
- The footer "Play Selected Area" button is enabled only when a node is selected

### Node Completion Flow

When a node is completed (combat won, event resolved, shop left), the parent component calls:

```js
function completeNode(nodeId, runState) {
  // 1. Mark nodeId as 'completed' in the map
  // 2. Unlock the nodes that nodeId.next[] points to
  // 3. Update runState.completedNodeIds
  // 4. If nodeId was the boss: end run, award meta honor
}
```

This logic belongs in `MapGenerator.js` as an exported helper:

```js
export function applyNodeCompletion(mapNodes, completedNodeId) → newMapNodes
// Returns a new array with:
//   - completedNodeId.status = 'completed'
//   - any node in completedNodeId.next[] with all their previous nodes completed → status = 'available'
```

### Event Node Flow (new: `EventModal`)

When "Play Selected Area" is pressed on an event node:
- Do NOT go to CombatScreen
- Show an `EventModal` component (new file: `src/ui/screens/EventModal.jsx`) as an overlay
- EventModal receives: `event` (from `getEvent()`), `runState`, `onChoice(choiceId)` callback
- After choice is made, EventModal closes, `runState` is updated, node is marked completed

**EventModal layout (from design doc Appendix B):**

```
┌─────────────────────────────────────────────────────────────┐
│  EVENT: [Event Name]                                         │
│  ─────────────────────────────────────────────────────────   │
│  [Flavor Text]                                               │
│                                                              │
│  [A] Choice Label                                            │
│      Effect: description               Cost: X Command       │
│      Risk: description                                       │
│                                                              │
│  [B] Choice Label  ...                                       │
│  [C] Choice Label  ...                                       │
└─────────────────────────────────────────────────────────────┘
```

### Shop Node Flow (new: `ShopModal`)

New file: `src/ui/screens/ShopModal.jsx`. Renders shop inventory, purchase buttons, command balance.

### Rest Node Flow (new: `RestModal`)

New file: `src/ui/screens/RestModal.jsx`. Shows 3 rest options, player picks 1.

### Hallucination Guard

- Modals are **overlays on HubTestScreen** — they do not navigate away from the hub
- Only event nodes with `pendingCombat` flag (from `applyEventChoice`) navigate to CombatScreen
- **DO NOT** implement the full shop purchase → CombatScreen effect flow in this step — shop effects are stored in `runState` and CombatSystem reads them in Step 8
- `applyNodeCompletion` must return a new array (immutable) — **do not mutate** the existing map array
- Boss node completion triggers run end — `meta.honor += runState.honorEarned`, `meta.totalRuns += 1`

### Test for Step 7

1. Click an available node — it gets a visual highlight
2. Click "Play Selected Area" on a combat node — routes to CombatScreen
3. Click "Play Selected Area" on an event node — EventModal appears
4. Choose option [B] in an event — modal closes, node is marked complete, next node unlocks
5. Completing boss node logs `runState.honorEarned` to console (or updates meta)

---

## Step 8 — Tooltip Upgrade + Visual Polish

### Goal

Upgrade the existing tooltip panel in HubTestScreen to show real node data from the design doc, and apply the node visual hierarchy from Section 7.1.

### Tooltip Panel Updates

The existing `hoveredMapNode` tooltip panel already has the right structure. Replace its static content:

| Element | Old (mock) | New (real) |
|---------|------------|------------|
| Node type label | `hoveredMapNode.type === 'shop' ? 'Traveling Merchant' : ...` | Keep but add 'Rest' → `'War Camp'` |
| Threat display | `'💀'.repeat(threat)` | Cap at 6, use color coding (threat 1-2 = muted, 4-5 = red, 6 = gold) |
| Enemy Waves | `'UNKNOWN'` | Combat/Elite nodes: pull wave count from variant: `COMBAT_VARIANTS[hoveredNode.variant]?.waves` |
| Potential Reward | `hoveredMapNode.reward` | Structured: show command range + honor range from variant data |
| Status badge | Static | Add `'available'` status in addition to existing ones |

### Node Visual Hierarchy (Section 7.1 of design doc)

Update node circle styling in HubTestScreen to match:

| Type | Border Color | Size |
|------|-------------|------|
| `combat` | `#b84235` (vermilion) | `w-16 h-16` |
| `elite` | `#8b1420` (dark red) | `w-20 h-20` |
| `event` | `#d4af37` (gold) | `w-16 h-16` |
| `shop` | `#4a5d23` (jade) | `w-16 h-16` |
| `rest` | `#2b3d60` (navy) | `w-14 h-14` |
| `boss` | `#dfd4ba` (parchment) | `w-24 h-24` |

Add `available` status visual: full opacity, subtle white glow.

### Connection Line Color Logic (Section 7.3)

Update `getSvgLines()`:

```js
// Color rules for SVG connection lines:
// completed → gold (#d4af37), solid, width 4px
// active (from node to active) → vermilion (#b84235), solid, width 4px
// available → muted (#8b8574), dashed, width 2px
// locked → very muted (#8b8574 opacity 40%), dotted, width 1px
```

The current implementation already has some of this. Extend it to handle `available` status.

### Dojo Tab — Tech Tree Polish

The Dojo now shows Provisions instead of just 3 tech nodes. Add 3 sections (items, starting bonuses, tower upgrades) each rendered as a small grid. Keep the hover tooltip for detail panel.

### Hallucination Guard

- **DO NOT** change the drag-to-scroll logic
- **DO NOT** change the overall layout (left sidebar + right map + bottom tooltip)  
- Node size changes are CSS only — do not change the positioning logic
- CSS color values must match exactly what is in `src/config/colors.js` (or `src/styles/base.css` CSS variables)
- The bottom tooltip panel stays at `h-[150px]` — do not make it taller

### Test for Step 8

1. Hover a combat node — tooltip shows wave count and command/honor range
2. Elite nodes are visually larger than combat nodes
3. Boss node has largest circle
4. Completed path lines are gold; locked path lines are dotted and dim
5. Available nodes have a subtle glow

---

## Step 9 — Combat Systems Bridge: RunState → Combat

### Goal

Wire the `runState` produced by the map layer into the actual combat systems. This is the bridge between the hub (Steps 1–8) and the existing game engine. After this step, blessings granted in an event node visibly change combat behavior, garrison units auto-spawn at combat start, and elite nodes trigger their special wave configurations.

### Why this is the highest-risk step

Three live combat files read `metaRef.current` directly with hardcoded field assumptions:
- `BarracksSystem.js:15` — `equippedItem` (renamed in Step 1)
- `SpawnSystem.js:59-65` — `conqueredRegions`, `equippedItem`
- `RewardSystem.js:25-44` — `equippedItem`, `conqueredRegions`

`runState` is a different object from `meta`. The bridge must inject `runState` modifiers without breaking the existing meta-based logic.

### Approach: Inject `runState` into `metaRef`

The cleanest method is to **merge the active runState modifiers into metaRef** at the moment a combat starts, rather than threading `runStateRef` through every system. This requires zero changes to `BarracksSystem`, `SpawnSystem`, or `RewardSystem` beyond what Step 1 already changed.

#### In `App.jsx` — combat start function

```js
function startCombat(nodeId, runState) {
  // 1. Compute all active modifier multipliers from runState.blessings
  const blessingMults = computeBlessingMultipliers(runState.blessings);

  // 2. Inject computed modifiers into metaRef so combat systems see them
  //    without knowing about runState at all
  setMeta(prev => ({
    ...prev,
    // Pass-through: systems already read these
    equippedItem: prev.equippedItem,
    conqueredRegions: prev.conqueredRegions,

    // NEW: blessing modifiers (computed scalars, not raw blessing objects)
    activeDamageMult:     blessingMults.damage,       // e.g. 1.25 from ANCESTOR_FURY
    activeAttackSpeedMult:blessingMults.attackSpeed,  // e.g. 1.20 from WAR_DRUMS
    activeMaxHpMult:      blessingMults.maxHp,        // e.g. 0.90 from BLOODLUST
    activeArcherRangeMult:blessingMults.archerRange,  // e.g. 1.30 from EAGLE_EYE
    activeMoveSpeedMult:  blessingMults.moveSpeed,    // e.g. 1.20 from SWIFT_FEET

    // NEW: curse modifiers
    activeCurseDamageMult:computeCurseMultipliers(runState.curses).damage, // e.g. 0.85 from WEAKENED
    activeCurseMaxHpMult: computeCurseMultipliers(runState.curses).maxHp,  // e.g. 0.85 from CURSED_GOODS

    // NEW: node context for WaveSystem
    activeNodeType:    runState.currentNodeType,    // 'combat' | 'elite' | 'boss'
    activeNodeVariant: runState.currentNodeVariant, // e.g. 'tengu_master'
    activeNodeThreat:  runState.currentNodeThreat,  // 1-7

    // NEW: garrison units to auto-spawn
    pendingGarrison: runState.pendingGarrison,      // null | { size: 'small'|'medium'|'large' }
  }));

  // 3. Reset game state for new combat
  state.current = createInitialState();
  state.current.currentRegion = nodeId; // existing routing
}
```

#### New helper: `computeBlessingMultipliers(blessings)` in `src/systems/EventSystem.js`

```js
// Returns a flat multiplier object for combat systems to consume
export function computeBlessingMultipliers(blessings) {
  return blessings.reduce((mults, b) => {
    if (b.combatsRemaining === 0) return mults; // expired
    switch (b.id) {
      case 'WAR_DRUMS':     mults.attackSpeed += 0.20; break;
      case 'BLOODLUST':     mults.damage += 0.30; mults.maxHp -= 0.10; break;
      case 'STONE_STANCE':  mults.defense += 0.25; break;
      case 'EAGLE_EYE':     mults.archerRange += 0.30; break;
      case 'SWIFT_FEET':    mults.moveSpeed += 0.20; break;
      case 'ANCESTOR_FURY': mults.damage += 0.25; break;
      case 'IRON_WILL':     mults.maxHp += 0.25; break;
      case 'FOX_SPEED':     mults.moveSpeed += 0.20; break;
    }
    return mults;
  }, { damage: 1.0, attackSpeed: 1.0, maxHp: 1.0, archerRange: 1.0, moveSpeed: 1.0, defense: 1.0 });
}

export function computeCurseMultipliers(curses) {
  return curses.reduce((mults, c) => {
    switch (c.id) {
      case 'WEAKENED':     mults.damage += -0.15; break;
      case 'CURSED_GOODS': mults.maxHp  += -0.15; break;
      case 'DIVINE_WRATH': mults.maxHp  += -0.20; break;
    }
    return mults;
  }, { damage: 1.0, maxHp: 1.0 });
}
```

#### `src/systems/SpawnSystem.js` — apply multipliers from `metaRef`

Add multiplier reads **after** the existing heirloom/region checks (lines 54–65):

```js
// After existing equippedItem and conqueredRegions checks, ADD:
if (team === 'player' && typeKey !== 'BARRICADE') {
  hp     *= (metaRef.current.activeDamageMult      ?? 1.0); // blessings damage → does not scale HP
  hp     *= (metaRef.current.activeMaxHpMult        ?? 1.0); // HP blessings/curses
  hp     *= (metaRef.current.activeCurseMaxHpMult   ?? 1.0);
  damage *= (metaRef.current.activeDamageMult        ?? 1.0);
  damage *= (metaRef.current.activeCurseDamageMult   ?? 1.0);
  // Note: attackSpeed and moveSpeed are applied in CombatSystem per-frame, not at spawn
}
```

**Do not touch** the enemy spawn path (lines 68–73) — blessing multipliers only affect player units.

#### `src/systems/CombatSystem.js` — apply speed multipliers per-frame

`CombatSystem.js:37` already does: `let uSpeed = s.warDrumsActive > 0 ? unit.speed * 1.5 : unit.speed;`

Extend this line to also read `metaRef`:

```js
// CombatSystem.js:37 — extend existing speed line
let uSpeed = unit.speed;
if (unit.team === 'player') {
  if (s.warDrumsActive > 0) uSpeed *= 1.5;
  uSpeed *= (metaRef.current.activeMoveSpeedMult ?? 1.0); // blessing: SWIFT_FEET, FOX_SPEED
}

// CombatSystem.js:39 — extend existing attackSpeed line
const atkSpeedMult = unit.team === 'player'
  ? (s.warDrumsActive > 0 ? 1.5 : 1.0) * (metaRef.current.activeAttackSpeedMult ?? 1.0) // WAR_DRUMS blessing
  : 1.0;
```

#### `src/systems/WaveSystem.js` — elite node wave configuration

`WaveSystem.js:11` contains `generateWave(waveNum)`. Add an optional `nodeContext` parameter:

```js
// Before: export function generateWave(waveNum)
// After:
export function generateWave(waveNum, nodeContext = null) {
  // nodeContext shape: { nodeType, nodeVariant, nodeThreat } from metaRef

  // Existing budget logic stays unchanged...
  let budget = 40 + (waveNum * 45) + Math.floor(Math.pow(waveNum, 1.3) * 5);

  // ELITE SCALING: if nodeContext.nodeType === 'elite', apply threat multiplier
  if (nodeContext?.nodeType === 'elite') {
    const threatBonus = 1 + ((nodeContext.nodeThreat - 3) * 0.25); // threat 4 = +25%, threat 5 = +50%
    budget = Math.floor(budget * threatBonus);
  }

  // BOSS SCALING: boss nodes use max budget
  if (nodeContext?.nodeType === 'boss') {
    budget = Math.floor(budget * 2.0);
  }

  // ... rest of existing generateWave logic unchanged ...
}
```

Update the call site in `tickWaveState` (line 57):

```js
// Before: s.squadsToSpawn = generateWave(s.wave);
// After:
s.squadsToSpawn = generateWave(s.wave, {
  nodeType:    metaRef.current.activeNodeType    ?? 'combat',
  nodeVariant: metaRef.current.activeNodeVariant ?? null,
  nodeThreat:  metaRef.current.activeNodeThreat  ?? 1,
});
```

#### Garrison auto-spawn at combat start

In `App.jsx` `startCombat()` (or wherever `createInitialState()` is called), after resetting game state:

```js
// After: state.current = createInitialState();
// ADD garrison auto-spawn:
const garrison = metaRef.current.pendingGarrison;
if (garrison) {
  const garrisonUnits = {
    small:  [{ type: 'HATAMOTO', count: 2 }],
    medium: [{ type: 'HATAMOTO', count: 2 }, { type: 'YUMI', count: 1 }],
    large:  [{ type: 'HATAMOTO', count: 2 }, { type: 'YUMI', count: 1 }, { type: 'CAVALRY', count: 1 }],
  }[garrison.size] ?? [];

  garrisonUnits.forEach(({ type, count }) => {
    for (let i = 0; i < count; i++) {
      spawnUnit(state.current, type, 'player', null, null, metaRef);
    }
  });

  // Clear garrison after use — it was one-time
  setMeta(prev => ({ ...prev, pendingGarrison: null }));
}
```

#### Decrement blessing durations after each combat

When `REGION_VICTORY` fires (end of a node's combat), decrement `combatsRemaining` on all `runState.blessings`:

```js
// In the REGION_VICTORY handler in App.jsx:
setRunState(prev => ({
  ...prev,
  blessings: prev.blessings
    .map(b => typeof b.combatsRemaining === 'number'
      ? { ...b, combatsRemaining: b.combatsRemaining - 1 }
      : b  // 'run' or 'next' duration handled separately
    )
    .filter(b => b.combatsRemaining !== 0),  // remove expired (0 remaining)
}));
```

### Elite Wave Special Abilities (Planned — Stub Only in This Step)

The design doc lists four elite abilities: `poison_ponds`, `red_thunder`, `exploding_bombers`, `necromancer_zombie`. These require new renderer and combat logic that goes beyond the scope of this integration step.

In this step, add **stubs only** in `WaveSystem.js`:

```js
// WaveSystem.js — add after budget calculation in generateWave():
// TODO: Step 10 — Elite wave special abilities
// if (nodeContext?.nodeVariant === 'onmyoji_ritual') applyPoisonPonds(s);
// if (nodeContext?.nodeVariant === 'tengu_master') applyRedThunder(s);
// if (nodeContext?.nodeVariant === 'shinobi_squad') applyExplodingBombers(s);
```

These are comments only — no implementation in Step 9.

### Hallucination Guard

- **DO NOT** modify `BarracksSystem.js` beyond what Step 1 already changed — it reads `equippedItem` and `bannerMult` correctly after Step 1
- **DO NOT** add a `runStateRef` parameter to `tickBarracks`, `tickUnits`, or `processDeaths` — they receive everything through `metaRef` which is updated by `setMeta` before combat starts
- **DO NOT** implement `poison_ponds`, `red_thunder`, or `exploding_bombers` in this step — stubs only
- The `activeDamageMult` multiplier stacks **multiplicatively** with existing heirloom multipliers in `SpawnSystem.js` (DEMON_MASK). Do not replace the existing multiplier — multiply on top of it
- `metaRef.current.activeNodeType` and related fields are **cleared** (set to null) when combat ends (`GAME_OVER` or `REGION_VICTORY`) to prevent stale values bleeding into the next node
- `pendingGarrison` units are spawned **before** the first wave timer starts — they appear before any enemy arrives

### Test for Step 9

1. Grant `WAR_DRUMS` blessing via `applyRestChoice` → enter combat → verify units visibly move faster
2. Grant `BLOODLUST` blessing → spawn a Hatamoto → verify its `maxHp` is 10% lower than normal
3. Apply `WEAKENED` curse → enter combat → verify damage floaters show ~85% of normal values
4. Set garrison to 'large' in rest node → enter combat → 4 player units exist before wave 1 starts
5. Enter an elite node (threat 4) → `generateWave` budget should be 25% higher than a same-wave combat node
6. After combat ends, `runState.blessings` with `combatsRemaining: 1` are removed; those with `combatsRemaining: 3` become `combatsRemaining: 2`

---

## Anti-Hallucination Rules (Global)

These rules apply to every step. The AI implementing any step must follow them.

### 1. Read Before Writing

Before editing any existing file, read its current contents. Do not work from memory.

### 2. One File Per Diff (Preferred)

When possible, implement one file at a time and state its purpose before writing it.

### 3. Never Invent APIs

Only call functions and import names that are explicitly defined in:
- This document
- The file currently being edited
- The existing codebase (check `SYSTEM_MAP.md` for what exists)

If a dependency does not exist yet, create it in the same step, or note that it will be created in a later step.

### 4. Immutable State Updates

All `runState` and `meta` mutations must use spread operator:
```js
// CORRECT
return { ...runState, blessings: [...runState.blessings, newBlessing] };

// WRONG — mutates state directly
runState.blessings.push(newBlessing);
return runState;
```

### 5. No Logic in Config Files

`src/config/*.js` files contain only plain objects and arrays. No functions, no imports, no conditionals.

### 6. Event Bus Direction

The existing rule from `ARCHITECTURE_PLAN.md` still applies:
> Game systems **emit only**. React components **listen only**. Never reverse this.

New conquest systems follow the same rule. `EventSystem.js` does not subscribe to the bus.

### 7. No External Runtime Dependencies

Do not install new npm packages for this feature. The seeded RNG is implemented inline (LCG in Step 4). No lodash, no uuid, no seedrandom.

### 8. Scope per Step

Do not implement functionality from Step N+1 when working on Step N. If you see a natural extension, add a `// TODO: Step X` comment and move on.

### 9. Test Confirmation

Do not mark a step as complete until the listed test for that step runs without errors.

---

## File Inventory

### New Files Created by This Plan

| File | Created In |
|------|-----------|
| `src/config/provisions.js` | Step 2 |
| `src/config/blessings.js` | Step 2 |
| `src/config/curses.js` | Step 2 |
| `src/config/nodes.js` | Step 2 |
| `src/hooks/useRunState.js` | Step 3 |
| `src/systems/MapGenerator.js` | Step 4 |
| `src/systems/EventSystem.js` | Step 5 |
| `src/systems/ShopSystem.js` | Step 5 |
| `src/systems/RestSystem.js` | Step 5 |
| `src/ui/screens/EventModal.jsx` | Step 7 |
| `src/ui/screens/ShopModal.jsx` | Step 7 |
| `src/ui/screens/RestModal.jsx` | Step 7 |

### Existing Files Modified by This Plan

| File | Modified In | Change Summary |
|------|------------|----------------|
| `src/config/progression.js` | Steps 2, 6 | Replace with provisions data; remove alias in Step 6 |
| `src/core/GameState.js` | Step 3 | Add `createRunState()` |
| `src/hooks/useMeta.js` | Steps 3 | Add `unlockedProvisions`, `equippedItem`, `totalRuns` |
| `src/ui/screens/HubTestScreen.jsx` | Steps 6, 7, 8 | Replace mock data; add interaction; visual polish |
| `App.jsx` | Steps 1, 6, 7, 9 | Rename koku; replace MapScreen; wire run routing; garrison + meta injection |
| `src/systems/SpawnSystem.js` | Steps 1, 9 | Rename `equippedHeirloom`; apply blessing HP/damage multipliers |
| `src/systems/BarracksSystem.js` | Step 1 | Rename `equippedHeirloom` → `equippedItem`; rename `unlockedTechs` → `unlockedProvisions` call site |
| `src/systems/RewardSystem.js` | Step 1 | Rename `equippedHeirloom` → `equippedItem` |
| `src/systems/CombatSystem.js` | Step 9 | Apply `activeMoveSpeedMult` and `activeAttackSpeedMult` from metaRef |
| `src/systems/WaveSystem.js` | Step 9 | Add `nodeContext` param to `generateWave`; elite/boss budget scaling; stubs for elite abilities |
| `src/core/utils.js` | Step 1 | Rename `equippedHeirloom` parameter in `getSquadCap` |
| `src/systems/EventSystem.js` | Step 9 | Add `computeBlessingMultipliers` and `computeCurseMultipliers` exports |
| All `src/**/*.js(x)` using koku | Step 1 | Rename koku → command |

### Deleted Files

| File | Deleted In |
|------|-----------|
| `src/ui/screens/MapScreen.jsx` | Step 6 (after tests pass) |

---

## What Is NOT in This Plan (Future Work)

These items are referenced in `conquest_map_design.md` but deferred:

| Feature | Reason Deferred |
|---------|----------------|
| Necromancer Power (Event 13) | "Planned Feature" in design doc |
| Boss multi-phase mechanics | Requires CombatSystem changes (separate plan) |
| Elite wave special abilities (poison ponds, red thunder, exploding bombers) | Stubbed in Step 9; full implementation needs renderer + new WaveSystem event types — Step 10 |
| Daily/weekly seeds | Needs backend or localStorage seeding source |
| Analytics + balance tracking | Needs analytics infrastructure |
| `core/Persistence.js` (localStorage) | Separate plan per ARCHITECTURE_PLAN.md |
| Map layout templates (A/B/C/D) | Post-MVP variation; base generator first |
| Achievement system | Low priority per design doc |
| Dynamic difficulty scaling (run 1-3 vs 11+) | Add to `createRunState` after balance testing |
