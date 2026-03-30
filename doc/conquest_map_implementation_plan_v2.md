# Conquest Map — Implementation Plan v2

> **Supersedes:** `doc/conquest_map_implementation_plan.md` (v1)
> **Architecture ref:** `ARCHITECTURE_PLAN.md`
> **Audited against:** Actual source code, March 30 2026
> **Status:** Ready for implementation

---

## What Changed From v1 (Gap Analysis Summary)

The v1 plan was audited against the actual codebase. The following **real bugs and gaps** were found and corrected in this version:

| # | Gap Found | Where v1 Failed | Fix in v2 |
|---|-----------|-----------------|-----------|
| 1 | `App.jsx` does **not** import or use `createInitialState()` — state is initialised inline twice | v1 said to rename in `GameState.js` only | Both inline initialisations in `App.jsx` (lines 43-66 and 93-114) must also be renamed |
| 2 | `events.js` `KOKU_CHANGED` + `useGameEvents.js` subscription | v1 rename list omitted these two files | Add to Step 1 rename list |
| 3 | `SpellSystem.js` checks `s.koku` and emits `KOKU_CHANGED` in **6 functions** | v1 listed SpellSystem but gave no details | List all 6 function sites explicitly |
| 4 | `App.jsx:238` `changeQuota` uses `metaRef.current.equippedHeirloom` | v1 missed this call site | Add to Step 1 rename list |
| 5 | `App.jsx:260` `maxTroops` uses `meta.equippedHeirloom` | v1 missed this call site | Add to Step 1 rename list |
| 6 | `App.jsx` has `unlockHeirloom`, `equipHeirloom`, `unlockTech` callbacks using old field names | v1 only said "App.jsx — state and prop passing" | Rename all three callbacks in Step 1 |
| 7 | `FLAMING_ARROWS` in `PERMANENT_TECHS` is absent from the `PROVISIONS` data object | v1 PROVISIONS data omitted it | Add `FLAMING_ARROWS` to PROVISIONS as `type: 'tower_upgrade'` in Step 2 |
| 8 | `unlockedTechs` used in `SpawnSystem.js:85` for `TAKEDA_CHARGE` only — but `FLAMING_ARROWS` and `SPIKED_CALTROPS` have no reading call site | v1 assumed more uses existed | Document which techs have real check sites; add `FLAMING_ARROWS` combat check in Step 2 guard |
| 9 | `WaveSystem.js:90` checks `CAMPAIGN_MAP[s.currentRegion]?.waves` — in conquest mode `s.currentRegion` is a node ID, so `regionDef` is `undefined` and combat **never ends** | v1 never addressed this critical breakage | Step 9 adds `activeNodeWaves` to metaRef; WaveSystem uses it as fallback |
| 10 | `App.jsx` routing uses `s.gameState` (mutable ref field), not a React `appScreen` state | v1 Step 6 showed `if (appScreen === 'MAP_SCREEN')` as if it were React state | Fix routing code to use `s.gameState` pattern matching existing architecture |
| 11 | `SpawnSystem.js` Step 9 plan contains a bug: multiplies `hp` by `activeDamageMult` with comment "does not scale HP" | v1 code and comment contradict each other | Remove `activeDamageMult` from the `hp` line — only `activeMaxHpMult` and `activeCurseMaxHpMult` affect HP |
| 12 | `HubTestScreen` currently takes **zero props** (`<HubTestScreen />` in App.jsx:264) — wiring it to real data requires prop plumbing through the showTestHub dev path and eventually the MAP_SCREEN path | v1 glossed over this transition | Step 6 explicitly shows both code paths |
| 13 | `BarracksSystem.js:23` calls `getSquadCap(key, level, metaRef.current.equippedHeirloom, ...)` — a second call site for the rename (v1 only listed line 15) | v1 listed this in the table but the step instruction text didn't mention it | Explicit mention in Step 1 |
| 14 | `App.jsx` `resetDynasty` updates `meta.honor` with `s.earnedHonor` but with conquest map `runState.honorEarned` is the source of truth | v1 never connected `earnedHonor` flow to runState | Step 9 explicitly handles honor accumulation bridge |

---

## Confirmed Architecture Decisions (unchanged from v1)

| Decision | Answer |
|----------|--------|
| HubTestScreen vs MapScreen | HubTestScreen **replaces** MapScreen. App.jsx routes `s.gameState === 'MAP_SCREEN'` to HubTestScreen |
| Currency naming | **Global rename: Koku → Command** |
| Progression structure | **Merge into PROVISIONS**: PERMANENT_TECHS + HEIRLOOMS + new Starting Bonuses + Tower Upgrades |
| State pattern | Keep existing `useRef` mutable game state + `useState` meta. Add `useRunState` hook for run layer. No new libraries |

---

## Step Overview

| Step | Name | Category | Risk |
|------|------|----------|------|
| 1 | Global Rename: Koku → Command + Field Renames | Refactor | Low |
| 2 | Config Layer: Provisions, Blessings, Curses, Nodes | Data | Very Low |
| 3 | Run State + useMeta Expansion | State | Low |
| 4 | Map Generator System | Logic | Medium |
| 5 | Event, Shop, Rest Systems | Logic | Medium |
| 6 | HubTestScreen → MapScreen Integration | UI | Low |
| 7 | Node Interaction + Play Button Wiring | UI + Routing | Medium |
| 8 | Tooltip Upgrade + Visual Polish | UI | Low |
| 9 | Combat Systems Bridge: RunState → Combat | Systems | High |

---

## Step 1 — Global Rename: Koku → Command + Field Renames

### Goal

Align all identifiers with the design document: `koku`→`command`, `equippedHeirloom`→`equippedItem`, `unlockedHeirlooms`→`unlockedProvisions`, `unlockedTechs`→`unlockedProvisions`.

### Complete Rename Map

```
koku             → command
Koku             → Command
KOKU             → COMMAND
kokuRef          → commandRef        (if it exists)
setKoku          → setCommand        (if it exists)
onKokuChange     → onCommandChange   (if it exists)
KOKU_CHANGED     → COMMAND_CHANGED   (EventBus event name)
equippedHeirloom → equippedItem
unlockedHeirlooms→ unlockedProvisions
unlockedTechs    → unlockedProvisions  (merged — same array after Step 2)
```

### Full File List With Exact Sites

#### `src/core/events.js`
- Line 4: `KOKU_CHANGED: 'KOKU_CHANGED'` → `COMMAND_CHANGED: 'COMMAND_CHANGED'`

#### `src/hooks/useGameEvents.js`
- Line 11: `bus.on(EVENTS.KOKU_CHANGED, tick)` → `bus.on(EVENTS.COMMAND_CHANGED, tick)`
- Line 19: `bus.off(EVENTS.KOKU_CHANGED, tick)` → `bus.off(EVENTS.COMMAND_CHANGED, tick)`

#### `src/hooks/useMeta.js`
- Line 6: `unlockedHeirlooms: []` → `unlockedProvisions: []`
- Line 7: `equippedHeirloom: null` → `equippedItem: null`
- Remove `unlockedTechs: []` (Step 2 adds this field; for now set initial value to `[]` and keep as `unlockedProvisions`)

> **Note:** `useMeta.js` currently has `unlockedHeirlooms`, `equippedHeirloom`, AND `unlockedTechs` as separate fields. After this step, `unlockedProvisions` is the single unified array. Old `unlockedTechs` field is removed from initial state.

#### `src/core/GameState.js`
- Line 8: `koku: 0, totalKoku: 0` → `command: 0, totalCommand: 0`

#### `src/App.jsx` — inline state (line 44, `state = useRef({...})`)
- `koku: 0, totalKoku: 0` → `command: 0, totalCommand: 0`
- This initialisation is **separate from** `createInitialState()` — it must also be updated

#### `src/App.jsx` — `startCombat` (line 95-96)
- `koku: 150, totalKoku: 150` → `command: 150, totalCommand: 150`

#### `src/App.jsx` — callbacks
- `buildBarracks` (line 146): `if (s.koku >= cost` → `if (s.command >= cost`; `s.koku -= cost` → `s.command -= cost`
- `upgradeTroopLevel` (line 156): same koku→command rename
- `upgradeBarracksCap` (line 164): same
- `hireDrill` (line 173): same
- `unlockHero` (line 183): same
- `unlockHeirloom` callback (line 190-198): rename to `unlockProvision`; `unlockedHeirlooms` → `unlockedProvisions`
- `equipHeirloom` callback (line 200-205): rename to `equipProvision`; `equippedHeirloom` → `equippedItem`
- `unlockTech` callback (line 207-215): merge into `unlockProvision` (same function body, `unlockedTechs` → `unlockedProvisions`)
- `changeQuota` (line 237): `metaRef.current.equippedHeirloom` → `metaRef.current.equippedItem`
- Line 260: `meta.equippedHeirloom` → `meta.equippedItem`

#### `src/systems/SpellSystem.js` — all 6 trigger functions
Every trigger function checks `s.koku` and emits `EVENTS.KOKU_CHANGED`:
- `triggerThunder` (lines 57, 58, 59): `s.koku >= 150` → `s.command >= 150`; `s.koku -= 150` → `s.command -= 150`; `EVENTS.KOKU_CHANGED` → `EVENTS.COMMAND_CHANGED`
- `triggerFoxFire` (lines 73, 74, 75): same pattern (250 cost)
- `triggerDragonWave` (lines 82, 83, 84): same pattern (600 cost)
- `triggerWarDrums` (lines 93, 94, 95): same pattern (200 cost)
- `triggerHarvest` (lines 100, 101, 102): same pattern (300 cost)
- `triggerResolve` (lines 109, 110, 111): same pattern (150 cost)

#### `src/systems/BarracksSystem.js`
- Line 15: `equippedHeirloom === 'IMPERIAL_BANNER'` → `equippedItem === 'IMPERIAL_BANNER'`
- Line 23: `getSquadCap(key, level, metaRef.current.equippedHeirloom, ...)` → `metaRef.current.equippedItem`

#### `src/systems/SpawnSystem.js`
- Line 62: `equippedHeirloom === 'DEMON_MASK'` → `equippedItem === 'DEMON_MASK'`
- Line 85: `unlockedTechs.includes('TAKEDA_CHARGE')` → `unlockedProvisions.includes('TAKEDA_CHARGE')`

#### `src/systems/RewardSystem.js`
- Line 25: `equippedHeirloom === 'BLOOD_KATANA'` → `equippedItem === 'BLOOD_KATANA'`
- Lines 34, 36, 44, 46: `EVENTS.KOKU_CHANGED` → `EVENTS.COMMAND_CHANGED`
- Lines 33, 45: `s.koku += reward; s.totalKoku += reward` → `s.command += reward; s.totalCommand += reward`

#### `src/core/utils.js`
- Line 23: `getSquadCap(key, level, equippedHeirloom, conqueredRegions)` → parameter name `equippedItem`
- Line 32: `if (equippedHeirloom === 'IMPERIAL_BANNER')` → `if (equippedItem === 'IMPERIAL_BANNER')`

#### `src/ui/panels/EconomyHeader.jsx`
- Read this file first. Rename any `koku` prop, display label, or event listener.

#### `src/ui/panels/CommandPanel.jsx`
- Read this file first. Rename any `koku` prop passed down or referenced.

#### `src/ui/screens/HubTestScreen.jsx`
- Line 45: `desc: 'Taps grant extreme Koku'` → `'Taps grant extreme Command'` (mock data string)
- Line 58: `reward: '10 KOKU'` → `reward: '10 COMMAND'`

#### `src/config/campaign.js`
- Read and rename any `koku` string references in reward descriptions or comments.

#### `src/config/progression.js`
- Line 10: `desc: 'No passive Koku. Taps grant extreme Koku.'` → `'No passive Command. Taps grant extreme Command.'`

### Hallucination Guard

- **DO NOT** rename CSS classes or HTML that says "koku" unless they exist (they don't — verify first)
- **DO NOT** rename the provision ID string values (`'DEMON_MASK'`, `'BLOOD_KATANA'`, `'IMPERIAL_BANNER'`, `'TAKEDA_CHARGE'`) — only field names change
- `unlockedHeirlooms` and `unlockedTechs` both become `unlockedProvisions` — they are the **same field** after this step; callers using `unlockedHeirlooms` and callers using `unlockedTechs` must all switch to `unlockedProvisions`
- `MapScreen.jsx` and `WarCampPanel.jsx` likely pass `equippedHeirloom` as a prop — read and rename those too before closing Step 1

### Test for Step 1

1. `npm run dev` — game loads, no console errors
2. Play one wave — Command counter in EconomyHeader updates
3. Trigger a spell — command balance decrements correctly
4. `grep -ri "koku" src/` — zero results (excluding this doc)
5. `grep -ri "equippedHeirloom" src/` — zero results
6. `grep -ri "unlockedHeirlooms\|unlockedTechs" src/` — zero results

---

## Step 2 — Config Layer: Provisions, Blessings, Curses, Nodes

### Goal

Create all static data files. No logic, no React, no inter-file imports. Pure data objects.

### Files to Create

#### `src/config/provisions.js`

```js
// PROVISIONS — unified meta-progression items
// Replaces PERMANENT_TECHS + HEIRLOOMS from progression.js

export const PROVISIONS = {
  // --- ITEMS (equip one per run — affect unit stats) ---
  DEMON_MASK:      { id: 'DEMON_MASK',      type: 'item',          name: 'Demon Mask',             cost: 150, desc: '+25% damage, -10% max HP', icon: '👹' },
  IMPERIAL_BANNER: { id: 'IMPERIAL_BANNER', type: 'item',          name: 'Imperial Banner',        cost: 200, desc: '+20% unit attack speed',   icon: '🎌' },
  BLOOD_KATANA:    { id: 'BLOOD_KATANA',    type: 'item',          name: 'Blood Katana',           cost: 175, desc: '+15% crit chance',          icon: '🗡️' },
  SPIKED_CALTROPS: { id: 'SPIKED_CALTROPS', type: 'item',          name: 'Spiked Caltrops',        cost: 125, desc: 'Enemies take damage when attacking barricades', icon: '⚙️' },
  // --- STARTING BONUSES (passive, always active) ---
  COMMANDERS_SEAL: { id: 'COMMANDERS_SEAL', type: 'starting_bonus', name: "Commander's Seal",      cost: 100, desc: '+15 Starting Command per run', icon: '📜' },
  WAR_CHEST:       { id: 'WAR_CHEST',       type: 'starting_bonus', name: 'War Chest',             cost: 150, desc: '+25 Starting Command per run', icon: '🪙' },
  SHOGUNS_DECREE:  { id: 'SHOGUNS_DECREE',  type: 'starting_bonus', name: "Shogun's Decree",       cost: 250, desc: '+40 Starting Command per run', icon: '👑' },
  // --- TOWER UPGRADES (apply to all starting towers) ---
  REINFORCED_FOUNDATIONS: { id: 'REINFORCED_FOUNDATIONS', type: 'tower_upgrade', name: 'Reinforced Foundations', cost: 175, desc: 'Starting towers have +20% HP',    icon: '🏯' },
  VETERAN_ENGINEERS:      { id: 'VETERAN_ENGINEERS',      type: 'tower_upgrade', name: 'Veteran Engineers',      cost: 200, desc: 'Starting towers deal +10% damage', icon: '⚒️' },
  FORTIFIED_POSITIONS:    { id: 'FORTIFIED_POSITIONS',    type: 'tower_upgrade', name: 'Fortified Positions',    cost: 225, desc: 'Starting towers have +15% range',  icon: '🏹' },
  // --- TECHNIQUES (passive combat abilities — from old PERMANENT_TECHS) ---
  TAKEDA_CHARGE:   { id: 'TAKEDA_CHARGE',   type: 'technique', name: 'Takeda Charge',   cost: 120, desc: 'Cavalry spawn with a 2s massive speed & knockback boost', icon: '🐎' },
  FLAMING_ARROWS:  { id: 'FLAMING_ARROWS',  type: 'technique', name: 'Flaming Arrows',  cost: 100, desc: 'Archers have 25% chance to ignite enemies',               icon: '🏹' },
};

// Backward-compat aliases — remove in Step 6
export const PERMANENT_TECHS = {
  SPIKED_CALTROPS: PROVISIONS.SPIKED_CALTROPS,
  FLAMING_ARROWS:  PROVISIONS.FLAMING_ARROWS,
  TAKEDA_CHARGE:   PROVISIONS.TAKEDA_CHARGE,
};
export const HEIRLOOMS = {
  DEMON_MASK:      PROVISIONS.DEMON_MASK,
  IMPERIAL_BANNER: PROVISIONS.IMPERIAL_BANNER,
  BLOOD_KATANA:    PROVISIONS.BLOOD_KATANA,
};
```

> **Why `FLAMING_ARROWS` and `TAKEDA_CHARGE` are here:** They were in `PERMANENT_TECHS` and `SpawnSystem.js:85` already gates `TAKEDA_CHARGE` on `unlockedProvisions`. `FLAMING_ARROWS` has no current check site — add the combat check in Step 9 when linting for unlocked provisions.

#### `src/config/blessings.js`

```js
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
```

#### `src/config/curses.js`

```js
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
```

#### `src/config/nodes.js`

```js
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

// NODE_POOL — which types appear per tier during map generation
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
```

### Files to Edit

| File | Change |
|------|--------|
| `src/config/progression.js` | Replace entire content with `provisions.js` data + alias exports. Do not delete yet. |
| `src/hooks/useMeta.js` | Add `unlockedProvisions: []` (was already done in Step 1). No `unlockedHeirlooms` or `unlockedTechs` remain. |

### Guard: Check for `FLAMING_ARROWS` check sites

After this step, `grep -r "FLAMING_ARROWS" src/systems/` should return zero results (no system currently reads it). That is acceptable — the check will be added in Step 9 when implementing blessing multipliers.

### Hallucination Guard

- **DO NOT** write any logic in config files — pure data objects only
- **DO NOT** import between config files
- `FLAMING_ARROWS` in PROVISIONS is `type: 'technique'` (not `'item'`) — it is always active once unlocked, not equipped per-run
- Boss node waves constant is always handled by `WaveSystem`'s boss-scaling branch (Step 9), so the boss variant does not need a `waves` field

### Test for Step 2

1. `import { PROVISIONS } from './src/config/provisions.js'` — logs correctly in browser console
2. `PROVISIONS.FLAMING_ARROWS.type === 'technique'` — true
3. `npm run dev` — no import errors

---

## Step 3 — Run State + useMeta Expansion

### Goal

Add the run-persistent state layer. Entirely additive — nothing existing is removed or broken.

### `src/hooks/useMeta.js` — add `totalRuns`

```js
// Updated initial state shape:
{
  honor: 0,
  unlockedProvisions: [],    // unified array (all provision IDs)
  equippedItem: null,        // single item slot (provision type 'item' only)
  conqueredRegions: [],      // campaign legacy; also used for regional bonuses
  totalRuns: 0,              // for dynamic difficulty scaling
}
```

### `src/core/GameState.js` — add `createRunState()`

Add this function after the existing `createInitialState()`. **Do not modify** `createInitialState()`.

```js
export function createRunState(meta) {
  const startingCommandBonus =
    (meta.unlockedProvisions.includes('COMMANDERS_SEAL') ? 15 : 0) +
    (meta.unlockedProvisions.includes('WAR_CHEST')       ? 25 : 0) +
    (meta.unlockedProvisions.includes('SHOGUNS_DECREE')  ? 40 : 0);

  return {
    baseCommand: 100 + startingCommandBonus,
    honorEarned: 0,
    blessings: [],    // [{ id, combatsRemaining }]
    curses: [],       // [{ id }]
    currentNodeId: 'START',
    completedNodeIds: [],
    mapSeed: Date.now(),
    pendingGarrison: null,   // { size: 'small'|'medium'|'large' } | null
    shopPurchases: {},
    runNumber: (meta.totalRuns || 0) + 1,
    activeItem: meta.equippedItem,
    currentNodeType: null,    // set when a node is entered (for WaveSystem)
    currentNodeVariant: null,
    currentNodeThreat: 1,
    currentNodeWaves: 3,      // default wave count — overridden by node variant
  };
}
```

> **Critical addition vs v1:** `currentNodeWaves` is tracked on `runState` (and later merged into `metaRef` in Step 9). This is the fix for Gap #9 — `WaveSystem.js` currently reads `CAMPAIGN_MAP[s.currentRegion]?.waves` to decide when combat ends. With conquest nodes, `s.currentRegion` is a node ID and `CAMPAIGN_MAP` will return `undefined`. `currentNodeWaves` replaces this.

### `src/hooks/useRunState.js` — new file

```js
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

- **DO NOT** modify `createInitialState()` — combat mutable state depends on it
- `runState` stays in the React/UI layer — it is **never passed** to the canvas game loop directly
- `baseCommand` in `runState` ≠ `command` in game state. `baseCommand` = starting budget per node. `command` = in-combat spending currency
- `currentNodeWaves` defaults to `3` — this prevents infinite combat if conquest routing is bypassed

### Test for Step 3

1. `startRun({ unlockedProvisions: ['COMMANDERS_SEAL'], equippedItem: null, totalRuns: 2 })` → `runState.baseCommand === 115`, `runState.runNumber === 3`
2. `runState` is `null` before `startRun` — confirm in React DevTools
3. `createRunState` does not throw when called with minimal meta `{}`

---

## Step 4 — Map Generator System

### Goal

Pure function: same seed → same map. No React, no side effects.

### File to Create: `src/systems/MapGenerator.js`

**Output contract (node object shape):**

```js
{
  id: 'START',          // unique string ID
  tierId: 0,            // 0–5
  type: 'event',        // from NODE_TYPES
  variant: 'ronin_encounter',  // specific variant id
  name: 'Stronghold Gates',
  threat: 0,
  reward: 'DEPART',     // human-readable preview
  waves: 0,             // 0 for non-combat nodes
  x: 8,                 // % position for rendering
  y: 50,
  next: ['1A', '1B', '1C'],
  status: 'available',  // 'available' | 'locked' | 'completed' | 'active' | 'boss'
}
```

> **Why `waves` is in the node object:** It allows `startCombat()` in Step 9 to read `node.waves` and write `runState.currentNodeWaves` before entering combat. This is the fix for the `WaveSystem.js` bug (Gap #9).

**Seeded RNG (use exactly this):**

```js
function createRNG(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}
```

**Internal algorithm:**

```
1. Seed LCG with run seed
2. For each tier 0–5:
   a. Node counts: tier 0 → 1, tiers 1-3 → 3, tier 4 → 2, tier 5 → 1 (boss)
   b. Shuffle NODE_POOL[TIER_N] with seeded RNG; take first N items as node types
   c. Y positions: [50] for 1 node, [30, 70] for 2 nodes, [15, 50, 85] for 3 nodes
   d. X = tier * (90 / 5) + 8
3. Build connections:
   a. Each node in tier N connects to 1–2 nodes in tier N+1
   b. Every tier N+1 node must have at least 1 incoming connection
   c. Boss always receives connections from ALL tier-4 nodes
4. Initial status: START = 'available', all others = 'locked', boss = 'boss'
5. For each node, pick variant using seeded RNG:
   combat → random from COMBAT_VARIANTS
   elite  → random from ELITE_VARIANTS
   event  → random from EVENT_IDS
   boss   → 'the_shogun' (always)
   shop/rest → no variant (null)
6. Copy variant.waves into the node object (default 3 for event/shop/rest, boss variant's own count)
7. Return flat array
```

**Also export:**

```js
export function applyNodeCompletion(mapNodes, completedNodeId) {
  // Returns new array (immutable):
  // - completedNodeId.status = 'completed'
  // - nodes in completedNode.next[] where all their predecessors are completed → 'available'
  // Build predecessor map first, then check
}
```

### Hallucination Guard

- **DO NOT** import React or any hook
- **DO NOT** generate enemy wave data — WaveSystem handles that at combat time
- Generator is a pure function: same seed + runNumber → identical output
- `applyNodeCompletion` must return a **new array** — do not mutate the input

### Test for Step 4

```js
import { generateMap } from './src/systems/MapGenerator.js';
const map = generateMap(12345, 1);
console.log(map.length);             // 13–15 nodes
console.log(map[0].id);              // 'START'
console.log(map[map.length-1].type); // 'boss'
// Determinism check:
const map2 = generateMap(12345, 1);
console.log(JSON.stringify(map) === JSON.stringify(map2)); // true
// Wave count present:
const combatNode = map.find(n => n.type === 'combat');
console.log(typeof combatNode.waves === 'number'); // true
```

---

## Step 5 — Event, Shop, Rest Node Systems

### Goal

Three pure logic files. All take `runState`, return new `runState` (immutable). No React, no canvas.

### `src/systems/EventSystem.js`

```js
// Exports:
getEvent(variantId)  → { id, name, text, choices: [{ id, label, cost, effect, risk }] }
applyEventChoice(runState, eventId, choiceId)  → newRunState

// Also exports (added in Step 9 but stub here):
export function computeBlessingMultipliers(blessings) { /* TODO: Step 9 */ return {}; }
export function computeCurseMultipliers(curses) { /* TODO: Step 9 */ return {}; }
```

**Events to implement (minimum 12):**

```
ronin_encounter, shrine_maiden, abandoned_cache, deserting_soldier,
peasant_village, cursed_ground, traveling_merchant, fox_spirit,
hidden_dojo, wounded_scout, gambling_den, ancestral_shrine
```

**Effect types for `applyEventChoice`:**
- `{ type: 'command', value: N }` — add/remove command from `runState.baseCommand`
- `{ type: 'honor', value: N }` — add to `runState.honorEarned`
- `{ type: 'blessing', blessingId }` — push to `runState.blessings`
- `{ type: 'curse', curseId }` — push to `runState.curses`
- `{ type: 'remove_curse', curseId }` — filter from `runState.curses`
- `{ type: 'combat', variant }` — return `{ ...newRunState, pendingCombat: { variant } }`

**All honor** goes into `runState.honorEarned` — never directly to `meta.honor`.

### `src/systems/ShopSystem.js`

```js
generateShopInventory(runState, nodeId) → [shopItemId, shopItemId, shopItemId]
purchaseItem(runState, itemId) → newRunState  // deducts command, records purchase
```

Rules: max 1 item per tier per visit; 20% chance 30% sale (seeded from `mapSeed + nodeId`).

### `src/systems/RestSystem.js`

```js
getRestOptions(runState) → [REST_OPTION, ...]  // REMOVE_CURSE locked if no curses
applyRestChoice(runState, optionId, payload) → newRunState
```

### Hallucination Guard

- `applyEventChoice` returns `{ ...runState, ... }` — never mutates
- Event choices that trigger combat return the special flag: `{ ...newRunState, pendingCombat: { variant } }`. The UI reads this and routes to CombatScreen.
- Do **NOT** implement Necromancer Power event (Event 13) — mark as `// TODO: Planned feature`

### Test for Step 5

```js
import { getEvent, applyEventChoice } from './src/systems/EventSystem.js';
import { createRunState } from './src/core/GameState.js';
const run = createRunState({ unlockedProvisions: [], equippedItem: null, totalRuns: 0 });
const event = getEvent('abandoned_cache');
console.log(event.choices.length >= 2); // true
const result = applyEventChoice(run, 'abandoned_cache', 'take_all');
console.log(result.baseCommand > run.baseCommand); // true (got some command)
console.log(run.baseCommand === 100);              // true (original unchanged — immutable)
```

---

## Step 6 — HubTestScreen → MapScreen Integration

### Goal

Wire HubTestScreen to real data. Replace mock data. Connect to the live routing. Delete MapScreen.jsx.

### `App.jsx` — add `useRunState` and plumb props

```jsx
// In App.jsx, add import:
import { useRunState } from './hooks/useRunState.js';

// In App() body:
const { runState, setRunState, runStateRef, startRun, endRun } = useRunState();
```

### `App.jsx` — routing update

The existing architecture renders both `MapScreen` and `CombatScreen` simultaneously (they use z-index to overlay). The HubTestScreen must follow the same pattern via `s.gameState`:

```jsx
// Replace the current showTestHub dev-toggle section:
// BEFORE (lines 263-316 in App.jsx):
// return (
//   <div ...>
//     {showTestHub && <HubTestScreen />}
//     {!showTestHub && (
//       <>
//         <MapScreen ... />
//         <CombatScreen ... />
//         <CommandPanel ... />
//       </>
//     )}
//   </div>
// );

// AFTER:
return (
  <div className="flex h-screen w-full bg-[#1b1918] text-[#1b1918] font-serif overflow-hidden select-none relative">
    {/* MAP / HUB SCREEN */}
    {s.gameState === 'MAP_SCREEN' && (
      <HubTestScreen
        meta={meta}
        setMeta={setMeta}
        runState={runState}
        startRun={startRun}
        onPlayNode={handlePlayNode}
      />
    )}

    {/* COMBAT LAYER — always mounted so canvas context persists */}
    <CombatScreen
      s={s}
      meta={meta}
      setMeta={setMeta}
      armedSpell={armedSpell}
      bgCanvasRef={bgCanvasRef}
      fgCanvasRef={fgCanvasRef}
      handlePointerDown={handlePointerDown}
      handlePointerMove={handlePointerMove}
      handlePointerUp={handlePointerUp}
      initRun={initRun}
      handleRegionVictory={handleRegionVictory}
    />

    {/* RIGHT: COMMAND DASHBOARD (combat only) */}
    {s.gameState !== 'MAP_SCREEN' && (
      <CommandPanel ... />
    )}
  </div>
);
```

**Add `handlePlayNode` callback to App.jsx:**

```js
const handlePlayNode = useCallback((nodeId, nodeData) => {
  // nodeData = the full node object from mapNodes array
  startRun(meta);
  setRunState(prev => ({
    ...prev,
    currentNodeId: nodeId,
    currentNodeType: nodeData.type,
    currentNodeVariant: nodeData.variant,
    currentNodeThreat: nodeData.threat,
    currentNodeWaves: nodeData.waves || 3,
  }));
  startCombat(nodeId);  // existing function — sets s.gameState = 'COMBAT'
}, [meta, startCombat, startRun, setRunState]);
```

### `HubTestScreen.jsx` — replace mock data

| Mock → Real |
|-------------|
| `const spireNodes = [...]` | `mapNodes` state: `useState(() => runState ? ... : generateMap(Date.now(), 0))` |
| `honor: 1,250` | `meta.honor` |
| `const techs = {...}` | `Object.values(PROVISIONS)` + `meta.unlockedProvisions` |
| `const heirlooms = [...]` | `PROVISIONS` filtered by `type === 'item'` |

HubTestScreen now receives props: `{ meta, setMeta, runState, startRun, onPlayNode }`.

### Delete `src/ui/screens/MapScreen.jsx`

Only after tests pass. Keep in git history via commit.

### Remove alias exports from `src/config/progression.js`

Delete the `PERMANENT_TECHS` and `HEIRLOOMS` alias exports. Update any remaining imports to use `provisions.js` directly.

### Hallucination Guard

- **DO NOT** rewrite HubTestScreen's CSS or layout — only replace data sources and add props
- **DO NOT** mount `CombatScreen` conditionally — it must always be mounted for the canvas `useRef` to survive navigation. Only show the CommandPanel conditionally.
- `MapScreen.jsx` is **currently imported** in App.jsx on line 12 — that import must be removed when MapScreen is deleted. If you remove the import but not the file, the app will still build. Remove both.
- If `runState === null`, HubTestScreen renders a **preview map** with `generateMap(Date.now(), 0)` — this is only visual

### Test for Step 6

1. App shows HubTestScreen when `s.gameState === 'MAP_SCREEN'`
2. Honor value in header = `meta.honor` (not hardcoded 1,250)
3. Dojo tab shows PROVISIONS grouped by type
4. Conquest map shows procedurally generated nodes (different seed each load)
5. `npm run dev` — no import errors, console clean

---

## Step 7 — Node Interaction + Play Button Wiring

### Goal

Make the map interactive. Clicking selects a node. "Play Selected Area" routes to the right destination per node type.

### `HubTestScreen.jsx` — add selection state

```js
const [selectedNodeId, setSelectedNodeId] = useState(null);
const [mapNodes, setMapNodes] = useState(null); // generated in useEffect
```

**Node click rules:**
- Only `status === 'available'` nodes are clickable
- Clicking selects (highlights) the node
- Play button is enabled only when a node is selected

### Node Completion Helper (already in `MapGenerator.js` from Step 4)

```js
// applyNodeCompletion(mapNodes, nodeId) → newMapNodes
// Marks node completed, unlocks successors
```

### Event Node Flow — `EventModal`

New file: `src/ui/screens/EventModal.jsx`

```jsx
// Props: { event, runState, onChoice(choiceId), onClose }
// Layout: overlay on HubTestScreen
// After choice → calls onChoice → HubTestScreen updates runState + marks node complete
```

If `applyEventChoice` returns `pendingCombat`:
```js
if (result.pendingCombat) {
  setRunState(result);
  onPlayNode(nodeId, { ...nodeData, type: 'combat', variant: result.pendingCombat.variant, waves: 3 });
}
```

### Shop Node Flow — `ShopModal`

New file: `src/ui/screens/ShopModal.jsx`
Props: `{ inventory, runState, onPurchase(itemId), onLeave }`

### Rest Node Flow — `RestModal`

New file: `src/ui/screens/RestModal.jsx`
Props: `{ options, runState, onChoice(optionId, payload), onLeave }`

### Node Completion → Boss End Run

When boss node is completed:

```js
// In HubTestScreen after boss battle returns victory:
setMeta(prev => ({
  ...prev,
  honor: prev.honor + runState.honorEarned,
  totalRuns: prev.totalRuns + 1,
}));
endRun();
// Navigate back to MAP_SCREEN (already at MAP_SCREEN since combat screen will set gameState)
```

### Hallucination Guard

- Modals are overlays **on HubTestScreen** — no navigation away
- Only event choices with `pendingCombat` flag navigate to CombatScreen
- `applyNodeCompletion` returns a new array — do not mutate `mapNodes`
- Boss completion triggers `endRun()` + meta honor update

### Test for Step 7

1. Click an available node — highlight border appears
2. "Play Selected Area" on combat node → navigates to CombatScreen
3. "Play Selected Area" on event node → EventModal overlay appears
4. Choose an event option → modal closes, node marked completed, next node unlocked
5. Completing boss node increments `meta.honor` by `runState.honorEarned`

---

## Step 8 — Tooltip Upgrade + Visual Polish

### Goal

Replace mock tooltip data with real node data. Apply design doc visual hierarchy.

### Tooltip Panel — real data

| Element | Current | New |
|---------|---------|-----|
| Type label | string literal | keep but add `'available'` status case |
| Threat display | `'💀'.repeat(threat)` | cap at 6; threat 1-2: muted white, 4-5: red, 6: gold |
| Enemy Waves | `'UNKNOWN'` | `COMBAT_VARIANTS[node.variant]?.waves ?? node.waves` |
| Potential Reward | `node.reward` | structured: command range + honor range from variant |
| Status badge | static | `'available'` shows with green tint |

### Node Visual Hierarchy (Section 7.1)

| Type | Border Color | Tailwind Size |
|------|-------------|---------------|
| `combat` | `#b84235` (vermilion) | `w-16 h-16` |
| `elite` | `#8b1420` (dark red) | `w-20 h-20` |
| `event` | `#d4af37` (gold) | `w-16 h-16` |
| `shop` | `#4a5d23` (jade) | `w-16 h-16` |
| `rest` | `#2b3d60` (navy) | `w-14 h-14` |
| `boss` | `#dfd4ba` (parchment) | `w-24 h-24` |
| `available` | type color + glow | type size + `shadow-[0_0_20px_rgba(255,255,255,0.15)]` |

### Connection Line Color Logic (Section 7.3)

Update `getSvgLines()`:

```js
// completed: gold (#d4af37), solid, strokeWidth 4
// active from-node: vermilion (#b84235), solid, strokeWidth 4
// available: muted (#8b8574), dashed, strokeWidth 2
// locked: #8b8574 @ 40% opacity, dotted, strokeWidth 1
```

### Dojo Tab — Provisions Grid

Three sections: items, starting_bonuses, tower_upgrades. Each is a grid of provision cards. On hover, detail panel shows. Unlocked provisions have full opacity; locked show cost in Honor.

### Hallucination Guard

- **DO NOT** change drag-to-scroll logic
- **DO NOT** change overall layout (left sidebar + right map + bottom tooltip)
- Node size changes are CSS only — do not change position logic
- CSS colors must use values from `src/config/colors.js` CSS variables where they map

### Test for Step 8

1. Hover combat node → tooltip shows wave count and command range
2. Elite nodes are visually larger than combat nodes
3. Boss node has the largest circle
4. Completed path lines are gold; locked paths are dotted and dim
5. Available nodes have the white glow

---

## Step 9 — Combat Systems Bridge: RunState → Combat

### Goal

Wire `runState` blessings, curses, node context, and garrison into the combat systems. Fix the wave-count-for-conquest-nodes bug.

### Why High Risk

Three live combat files read `metaRef.current` with hardcoded field assumptions. The bridge must inject modifiers without breaking existing meta-based logic.

### Fix: `WaveSystem.js` — conquest node wave count (Gap #9 fix)

**Current broken code (line 89-90):**
```js
const regionDef = CAMPAIGN_MAP[s.currentRegion];
if (regionDef && s.wave >= regionDef.waves) {
```

**The problem:** In conquest mode, `s.currentRegion` is a node ID like `'1A'`. `CAMPAIGN_MAP['1A']` returns `undefined`. `regionDef?.waves` is `undefined`. `s.wave >= undefined` is `false`. **Combat never ends.**

**Fix — add fallback to `metaRef`:**

```js
// WaveSystem.js — replace lines 89-91:
const regionDef = CAMPAIGN_MAP[s.currentRegion];
const maxWaves = regionDef?.waves ?? (metaRef.current.activeNodeWaves ?? 3);
if (s.wave >= maxWaves) {
  s.gameState = 'REGION_VICTORY';
  bus.emit(EVENTS.GAME_STATE_CHANGED, { state: s.gameState });
} else {
```

This preserves backward compatibility: campaign mode still uses `CAMPAIGN_MAP.waves`; conquest mode falls through to `metaRef.current.activeNodeWaves`.

### `App.jsx` — `handlePlayNode` — inject runState into metaRef

```js
const handlePlayNode = useCallback((nodeId, nodeData) => {
  // 1. Compute blessing/curse multipliers
  const blessingMults = computeBlessingMultipliers(runStateRef.current?.blessings ?? []);
  const curseMults    = computeCurseMultipliers(runStateRef.current?.curses ?? []);

  // 2. Inject into metaRef via setMeta so combat systems see it
  setMeta(prev => ({
    ...prev,
    equippedItem: prev.equippedItem,
    conqueredRegions: prev.conqueredRegions,
    // Blessing multipliers (start at 1.0 from computeBlessingMultipliers)
    activeDamageMult:      blessingMults.damage,
    activeAttackSpeedMult: blessingMults.attackSpeed,
    activeMaxHpMult:       blessingMults.maxHp,
    activeArcherRangeMult: blessingMults.archerRange,
    activeMoveSpeedMult:   blessingMults.moveSpeed,
    // Curse multipliers
    activeCurseDamageMult: curseMults.damage,
    activeCurseMaxHpMult:  curseMults.maxHp,
    // Node context — used by WaveSystem and SpawnSystem
    activeNodeType:    nodeData.type,
    activeNodeVariant: nodeData.variant ?? null,
    activeNodeThreat:  nodeData.threat ?? 1,
    activeNodeWaves:   nodeData.waves ?? 3,    // ← fixes WaveSystem bug
    // Garrison
    pendingGarrison: runStateRef.current?.pendingGarrison ?? null,
  }));

  // 3. Update runState with current node
  setRunState(prev => ({
    ...prev,
    currentNodeId: nodeId,
    currentNodeType: nodeData.type,
    currentNodeVariant: nodeData.variant,
    currentNodeThreat: nodeData.threat,
    currentNodeWaves: nodeData.waves ?? 3,
  }));

  // 4. Reset combat state and start
  startCombat(nodeId);
}, [meta, runStateRef, setMeta, setRunState, startCombat]);
```

### `computeBlessingMultipliers` and `computeCurseMultipliers` — add to `EventSystem.js`

(Replace the stubs added in Step 5):

```js
export function computeBlessingMultipliers(blessings) {
  return blessings.reduce((m, b) => {
    if (b.combatsRemaining === 0) return m;
    switch (b.id) {
      case 'WAR_DRUMS':     m.attackSpeed += 0.20; break;
      case 'BLOODLUST':     m.damage += 0.30; m.maxHp -= 0.10; break;
      case 'STONE_STANCE':  m.defense += 0.25; break;
      case 'EAGLE_EYE':     m.archerRange += 0.30; break;
      case 'SWIFT_FEET':    m.moveSpeed += 0.20; break;
      case 'ANCESTOR_FURY': m.damage += 0.25; break;
      case 'IRON_WILL':     m.maxHp += 0.25; break;
      case 'FOX_SPEED':     m.moveSpeed += 0.20; break;
    }
    return m;
  }, { damage: 1.0, attackSpeed: 1.0, maxHp: 1.0, archerRange: 1.0, moveSpeed: 1.0, defense: 1.0 });
}

export function computeCurseMultipliers(curses) {
  return curses.reduce((m, c) => {
    switch (c.id) {
      case 'WEAKENED':     m.damage += -0.15; break;
      case 'CURSED_GOODS': m.maxHp  += -0.15; break;
      case 'DIVINE_WRATH': m.maxHp  += -0.20; break;
    }
    return m;
  }, { damage: 1.0, maxHp: 1.0 });
}
```

### `SpawnSystem.js` — apply multipliers (corrected)

Add **after** the existing heirloom/region checks (after line 65):

```js
if (team === 'player' && typeKey !== 'BARRICADE') {
  // HP multipliers — only maxHp blessings and curses apply here
  hp     *= (metaRef.current.activeMaxHpMult      ?? 1.0);
  hp     *= (metaRef.current.activeCurseMaxHpMult  ?? 1.0);
  // Damage multipliers — stack multiplicatively with heirloom
  damage *= (metaRef.current.activeDamageMult      ?? 1.0);
  damage *= (metaRef.current.activeCurseDamageMult ?? 1.0);
  // Note: attackSpeedMult and moveSpeedMult are applied per-frame in CombatSystem
}
```

> **v1 bug fixed:** `activeDamageMult` is NOT applied to `hp`. Only `activeMaxHpMult` and `activeCurseMaxHpMult` affect HP.

### `CombatSystem.js` — apply speed multipliers per-frame

Replace lines 37-39:

```js
// Before:
// let uSpeed = (unit.team === 'player' && s.warDrumsActive > 0) ? unit.speed * 1.5 : unit.speed;
// if (unit.chargeTimer > 0) uSpeed *= 2.0;
// const atkSpeedMult = (unit.team === 'player' && s.warDrumsActive > 0) ? 1.5 : 1.0;

// After:
let uSpeed = unit.speed;
if (unit.team === 'player') {
  if (s.warDrumsActive > 0) uSpeed *= 1.5;
  uSpeed *= (metaRef.current.activeMoveSpeedMult ?? 1.0);  // SWIFT_FEET, FOX_SPEED blessing
}
if (unit.chargeTimer > 0) uSpeed *= 2.0;

const atkSpeedMult = unit.team === 'player'
  ? (s.warDrumsActive > 0 ? 1.5 : 1.0) * (metaRef.current.activeAttackSpeedMult ?? 1.0)  // WAR_DRUMS blessing
  : 1.0;
```

### `WaveSystem.js` — elite/boss budget scaling

Replace `generateWave(waveNum)` signature and add budget scaling:

```js
export function generateWave(waveNum, nodeContext = null) {
  let budget = 40 + (waveNum * 45) + Math.floor(Math.pow(waveNum, 1.3) * 5);

  if (nodeContext?.nodeType === 'elite') {
    const threatBonus = 1 + ((nodeContext.nodeThreat - 3) * 0.25);
    budget = Math.floor(budget * Math.max(1.0, threatBonus));
  }
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

### Garrison auto-spawn

In `App.jsx` `startCombat()`, after the state reset, add:

```js
// After state.current = { ...state.current, koku: 150, ... }
const garrison = metaRef.current.pendingGarrison;
if (garrison) {
  const garrisonUnits = {
    small:  [{ type: 'HATAMOTO', count: 2 }],
    medium: [{ type: 'HATAMOTO', count: 2 }, { type: 'YUMI', count: 1 }],
    large:  [{ type: 'HATAMOTO', count: 2 }, { type: 'YUMI', count: 1 }, { type: 'CAVALRY', count: 1 }],
  }[garrison.size] ?? [];

  garrisonUnits.forEach(({ type, count }) => {
    for (let i = 0; i < count; i++) {
      _spawnUnit(state.current, type, 'player', null, null, metaRef);
    }
  });
  setMeta(prev => ({ ...prev, pendingGarrison: null }));
}
```

### Decrement blessing durations after combat

In `handleRegionVictory` in App.jsx:

```js
// After existing conquest region logic, add:
if (runStateRef.current) {
  setRunState(prev => ({
    ...prev,
    honorEarned: (prev.honorEarned || 0) + (state.current.earnedHonor || 0),
    blessings: prev.blessings
      .map(b => typeof b.combatsRemaining === 'number'
        ? { ...b, combatsRemaining: b.combatsRemaining - 1 }
        : b  // 'run' or 'next' duration handled separately
      )
      .filter(b => b.combatsRemaining !== 0),
  }));
}
// Clear stale metaRef node context after combat
setMeta(prev => ({
  ...prev,
  activeNodeType: null, activeNodeVariant: null, activeNodeThreat: 1, activeNodeWaves: 3,
  activeDamageMult: 1.0, activeAttackSpeedMult: 1.0, activeMaxHpMult: 1.0,
  activeArcherRangeMult: 1.0, activeMoveSpeedMult: 1.0,
  activeCurseDamageMult: 1.0, activeCurseMaxHpMult: 1.0,
}));
```

### Elite Wave Stubs Only

```js
// WaveSystem.js — add after budget calculation:
// TODO: Step 10 — Elite wave special abilities
// if (nodeContext?.nodeVariant === 'onmyoji_ritual') applyPoisonPonds(s);
// if (nodeContext?.nodeVariant === 'tengu_master')    applyRedThunder(s);
// if (nodeContext?.nodeVariant === 'shinobi_squad')   applyExplodingBombers(s);
```

### Hallucination Guard

- **DO NOT** add `runStateRef` as a parameter to `tickBarracks`, `tickUnits`, or `processDeaths` — they receive everything through `metaRef`
- `activeDamageMult` affects **damage only** — NOT `hp` (this was a bug in v1)
- `metaRef.current.activeNodeWaves` provides the wave count fallback for conquest nodes — this is the critical fix
- Clear the `activeNode*` fields on `metaRef` when combat ends (both `REGION_VICTORY` and `GAMEOVER` paths)
- `activeDamageMult` stacks **multiplicatively** with existing DEMON_MASK multiplier in `SpawnSystem.js` — do not replace it

### Test for Step 9

1. Grant `WAR_DRUMS` blessing → enter a node → units visibly move faster
2. Grant `BLOODLUST` blessing → spawn Hatamoto → `maxHp` is ~10% lower than normal
3. Apply `WEAKENED` curse → damage floaters show ~85% of normal values
4. Set garrison 'large' in rest node → enter combat → 4 player units appear before wave 1
5. Enter an elite node (threat 4) → wave budget is 25% higher than a same-wave combat node
6. Combat on a node with `waves: 3` ends after 3 waves (REGION_VICTORY fires)
7. `runState.blessings` with `combatsRemaining: 1` are removed after combat; those with `3` become `2`

---

## Anti-Hallucination Rules (Global — same as v1, with additions)

1. **Read Before Writing** — read every file before editing it
2. **One File Per Diff** — state the file's purpose before writing
3. **Never Invent APIs** — only call functions defined in this document, the file being edited, or verified existing code
4. **Immutable runState** — always `return { ...runState, ... }`, never mutate
5. **No Logic in Config Files** — pure data only
6. **EventBus Direction** — systems emit only, React listens only
7. **No External Runtime Dependencies** — no npm installs
8. **Scope per Step** — if you see an extension, add a `// TODO: Step X` comment
9. **Test Confirmation** — do not mark a step complete until the listed test passes
10. **Check `activeDamageMult` ≠ `activeMaxHpMult`** — these are different multipliers; the damage one does NOT affect HP

---

## File Inventory

### New Files

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

### Existing Files Modified

| File | Steps | Change Summary |
|------|-------|----------------|
| `src/core/events.js` | 1 | `KOKU_CHANGED` → `COMMAND_CHANGED` |
| `src/hooks/useGameEvents.js` | 1 | Subscribe to `COMMAND_CHANGED` |
| `src/hooks/useMeta.js` | 1, 3 | Rename fields; add `totalRuns` |
| `src/core/GameState.js` | 1, 3 | Rename `koku`; add `createRunState()` |
| `src/App.jsx` | 1, 6, 7, 9 | Rename koku + field names; add useRunState; routing; garrison + meta injection |
| `src/systems/SpellSystem.js` | 1 | Rename all 6 koku checks + KOKU_CHANGED events |
| `src/systems/BarracksSystem.js` | 1 | Rename `equippedHeirloom` (2 sites) |
| `src/systems/SpawnSystem.js` | 1, 9 | Rename fields; apply HP/damage multipliers |
| `src/systems/RewardSystem.js` | 1 | Rename `equippedHeirloom`; rename `koku` + event |
| `src/systems/CombatSystem.js` | 9 | Apply `activeMoveSpeedMult` + `activeAttackSpeedMult` |
| `src/systems/WaveSystem.js` | 9 | `nodeContext` param; elite/boss budget; conquest wave count fix |
| `src/systems/EventSystem.js` | 9 | Add `computeBlessingMultipliers` + `computeCurseMultipliers` |
| `src/core/utils.js` | 1 | Rename `equippedHeirloom` param in `getSquadCap` |
| `src/ui/panels/EconomyHeader.jsx` | 1 | Rename koku display |
| `src/ui/panels/CommandPanel.jsx` | 1 | Rename koku prop |
| `src/ui/screens/HubTestScreen.jsx` | 1, 6, 7, 8 | Rename mock strings; add props; real data; interaction; polish |
| `src/config/progression.js` | 2, 6 | Replace with provisions; remove aliases in Step 6 |
| `src/ui/map/WarCampPanel.jsx` | 1 | Rename `equippedHeirloom` prop |
| `src/ui/map/MapArea.jsx` | 6 | No longer used after MapScreen deletion; can stay if referenced elsewhere |

### Deleted Files

| File | Deleted In |
|------|-----------|
| `src/ui/screens/MapScreen.jsx` | Step 6 |

---

## What Is NOT in This Plan (Deferred)

| Feature | Reason |
|---------|--------|
| Necromancer Power (Event 13) | Planned feature, marked TODO |
| Boss multi-phase mechanics | Separate plan |
| Elite special abilities (poison ponds, red thunder, exploding bombers) | Step 10 |
| Daily/weekly map seeds | Needs backend |
| Analytics + balance tracking | Infra not in place |
| `core/Persistence.js` (localStorage) | Separate plan per ARCHITECTURE_PLAN.md |
| Map layout templates (A/B/C/D) | Post-MVP |
| Achievement system | Low priority |
| Dynamic difficulty scaling | Add to `createRunState` after balance testing |
| FLAMING_ARROWS combat check | Add in Step 9 pass-2 once PROVISIONS are wired — currently zero active check sites in combat systems |
