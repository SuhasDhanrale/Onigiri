# Buffs, Curses & Shop — Integration Plan

> **Goal:** Make shop purchases, event blessings, and curses actually affect gameplay — incrementally, without breaking anything that currently works.
> **Audited against:** Actual source code, 2026-06-10
> **Status:** Planning — _awaiting answers to the Open Questions section before implementation_
> **Rule for this doc:** No code is written until the Open Questions are answered. Answers go **inline in this file** (look for `**Answer:**` placeholders).

---

## 0. How to read this doc

1. **Section 1** — what's actually wired today (the baseline, so we know what we must NOT break).
2. **Section 2** — the one mechanism everything flows through (the "bridge").
3. **Section 3** — the 5 root blockers that explain every gap.
4. **Section 4** — **Open Questions you must answer** before we touch code.
5. **Section 5** — the stepwise, low-risk-first implementation plan.
6. **Section 6** — how to make the system structurally better (optional, recommended).
7. **Section 7** — explicitly out of scope.

---

## 1. Baseline — what works today (do not break)

These already function end-to-end. Any change must keep them green.

| Source | Effect | Status |
|---|---|---|
| Blessing | Ancestor's Fury (+25% dmg), Bloodlust (+30% dmg / −10% HP), Iron Will (+25% HP) | ✅ works |
| Blessing | War Drums (+20% atk speed) | ✅ works |
| Blessing | Swift Feet / Fox's Speed (+20% move speed) | ✅ works |
| Curse | Weakened (−15% dmg), Divine Wrath (−20% HP) | ✅ works (but never expire — see blocker #4) |
| Event | Honor reward/cost → `meta.honor` | ✅ persists |
| Rest | Remove curse / add blessing / set garrison | ✅ all work (garrison consumed in combat) |

**What is dead (the work this plan addresses):**

- **Shop:** 0 of 11 items do anything beyond spending command.
- **Blessings:** Stone Stance (defense), Eagle Eye (archer range), Looting (command drops), Holy Protection (necro) — no effect.
- **Curses:** Outlaw (−honor), Village Wrath (worse events), Fox's Debt (−boss rewards) — collectable but **free** (no downside). Haunted / Necro's Wrath — unimplemented. Cursed Goods — works but no event grants it.
- **Command:** event/shop command never reaches combat (combat is hardcoded).

---

## 2. The architecture & the single bridge

Three state layers:

| Layer | Lifetime | Holds | Read by |
|---|---|---|---|
| `state.current` (`useRef`) | one combat | `command`, `units`, `timers`, spell cooldowns | combat systems, directly |
| `runState` (`useRunState`) | one conquest run | `blessings`, `curses`, `baseCommand`, `shopPurchases` | UI modals; the bridge |
| `meta` (`metaRef`) | dynasty + **injection channel** | `active*Mult`, `activeNode*`, unlocks | combat systems via `metaRef.current.*` |

**The one bridge:** `handlePlayNode` at [App.jsx:324-364](../src/App.jsx#L324-L364):

```
runState.blessings/curses
   → computeBlessingMultipliers / computeCurseMultipliers   (EventSystem.js:584-620)
   → meta.active*Mult                                        (App.jsx:333-340)
   → metaRef.current.active*Mult read in combat              (SpawnSystem.js:69-72, CombatSystem.js:41/45)
```

**Every fix in this plan is one of two shapes:**
- **(a)** publish a value across this bridge that isn't published yet, or
- **(b)** read a value the bridge already publishes but nothing consumes.

Keeping to this pattern is what makes the work low-risk — we are extending a proven path, not inventing new ones.

---

## 3. Root blockers (each explains several downstream gaps)

| # | Blocker | Consequence | Where |
|---|---|---|---|
| 1 | **No shop→combat bridge.** `purchaseItem` only records the sale. | All 7 mappable shop items dead at once. | [ShopSystem.js:111](../src/systems/ShopSystem.js#L111) |
| 2 | **"Towers" don't exist** in combat state. | `quick_repairs`, `iron_fortifications` target nothing. | combat is barracks + units + boss cave/orb |
| 3 | **`baseCommand` never seeds combat.** Combat hardcodes `command: 150`; winnings never bank back. | Event/shop command only changes shop budget, never battle economy. | [App.jsx:177](../src/App.jsx#L177), [App.jsx:296-309](../src/App.jsx#L296-L309) |
| 4 | **Curses have no expiry.** Stored as bare `{id}`; only blessings count down. | All curse durations unenforced; working curses are permanent. | [EventSystem.js:47](../src/systems/EventSystem.js#L47), decrement at [App.jsx:302-308](../src/App.jsx#L302-L308) |
| 5 | **Dragon Wave is already unlocked** (gated only by command/cooldown). | `dragon_scroll` has nothing to flip. | [SpellShrine.jsx:59-61](../src/ui/panels/SpellShrine.jsx#L59-L61) |

---

## 4. OPEN QUESTIONS — please answer inline

> These decisions change what we build. Write your answer under each. If you don't have a preference, say "you decide" and I'll use the **Recommended** option.

### Q1 — Command economy: unify or keep separate?

Today `baseCommand` (shop/event currency, starts 100) and combat `command` (starts 150, earned from kills) are **two disconnected pools sharing a name**.

- **Option A (Recommended):** Unify — combat starts from `runState.baseCommand`, and leftover command banks back to `baseCommand` at combat end. Makes `command_expansion` and all event command rewards meaningful in battle.
- **Option B:** Keep them separate — `baseCommand` is purely a between-combat/shop wallet; combat keeps its own 150 pool. Then `command_expansion` must be repurposed (it can't affect combat).

**Answer:** _(pending)_

### Q2 — What is a "tower"? (for `quick_repairs`, `iron_fortifications`)

No tower entity exists. Options:

- **Option A:** Give barracks buildings HP (new mechanic — bigger change).
- **Option B:** Reinterpret "towers" as the boss cave/orb (only matters on boss nodes).
- **Option C (Recommended for now):** Repurpose these two items to existing, mappable effects (e.g. flat HP buff to all units, or a one-time heal of all living units) and drop the "tower" wording.

**Answer:** _(pending)_

### Q3 — Dragon Wave unlock

- **Option A (Recommended):** Lock Dragon Wave by default; `dragon_scroll` (and/or a meta unlock) enables it for the run. Gives the item purpose.
- **Option B:** Leave Dragon Wave always available; repurpose `dragon_scroll` to something else (e.g. +1 charge / reduced cost).

**Answer:** _(pending)_

### Q4 — Defense mechanic for Stone Stance

There is no damage-reduction stat today (player units take raw `hp -= damage`).

- **Option A:** Add an incoming-damage-reduction multiplier for player units (new but small mechanic).
- **Option B (Recommended):** Convert Stone Stance to an existing mechanic (e.g. +max HP) so it works through the current bridge with zero new systems.
- **Option C:** Drop Stone Stance.

**Answer:** _(pending)_

### Q5 — Curse durations

- **Option A (Recommended):** Implement expiry counters (per-combat for "3 combats", per-node for "5 nodes", `Infinity` for run) — mirrors how blessings already work, so curses become balanced trade-offs.
- **Option B:** Make all curses last the whole run and simplify the config (drop duration fields).

**Answer:** _(pending)_

### Q6 — Necromancer system (Haunted, Necro's Wrath, Holy Protection)

There's already a `// TODO Necromancer event` stub in EventSystem.

- **Option A (Recommended):** Defer — keep out of scope for this pass; leave those 3 effects flagged as unimplemented.
- **Option B:** Build a minimal revive mechanic now.

**Answer:** _(pending)_

### Q7 — Items that need a choice UI (`fresh_recruits`, `curse_removal`)

- **Option A:** Build small picker modals (choose which unit / which curse).
- **Option B (Recommended for speed):** Auto-resolve — `fresh_recruits` grants a fixed/best unit; `curse_removal` removes the oldest curse. Add pickers later.

**Answer:** _(pending)_

### Q8 — Balance during wiring

When we connect an effect, do we keep config values as-authored (e.g. +25% fire, 2× barracks, +15% stats)?

- **Option A (Recommended):** Keep values as-is now; treat balancing as a separate later pass. Reduces risk of conflating "wired" with "tuned."
- **Option B:** Re-balance as we wire.

**Answer:** _(pending)_

---

## 5. Stepwise implementation plan (low-risk first)

Each phase is **independently shippable and verifiable**. Stop after any phase and the game still runs. Phases are ordered so earlier ones unblock later ones.

> Phases C–E depend on the Open Question answers; ranges/risks below assume the **Recommended** options.

### Phase A — Complete the partial wiring (Risk: **Very Low**)
Pure additive reads/fixes; no new mechanics, no balance shift.

| Step | Change | Files | Verify |
|---|---|---|---|
| A1 | Read `activeArcherRangeMult` where YUMI range is set (Eagle Eye starts working) | SpawnSystem.js (stat block) | YUMI range visibly larger with Eagle Eye active |
| A2 | Fix command-delta display bug: read `baseCommand` not `command` | [HubTestScreen.jsx:113-115](../src/ui/screens/HubTestScreen.jsx#L113-L115) | Event result screen shows correct ±Command |
| A3 | Add `LOOTING` to `computeBlessingMultipliers` + apply to reward | EventSystem.js, [RewardSystem.js:30-44](../src/systems/RewardSystem.js#L30-L44) | More command per kill with Looting active |

### Phase B — Unify the command economy (Risk: **Medium** — depends on **Q1**)
Only if Q1 = Option A.

| Step | Change | Files | Verify |
|---|---|---|---|
| B1 | Seed combat `command` from `runState.baseCommand` instead of `150` | [App.jsx:177](../src/App.jsx#L177) | Combat starts with the run's actual command |
| B2 | Bank leftover/earned command back to `baseCommand` at combat end | [App.jsx:296-309](../src/App.jsx#L296-L309) | Command carries between nodes |

> ⚠️ This is the highest-impact-on-balance change in the plan. Ship it alone so its effect is isolated.

### Phase C — Shop→combat bridge (Risk: **Medium** — unblocks blocker #1)

| Step | Change | Files | Verify |
|---|---|---|---|
| C1 | Add `computeShopModifiers(shopPurchases)` (parallel to blessing fn) + publish to meta in `handlePlayNode` | ShopSystem.js, [App.jsx:330-348](../src/App.jsx#L330-L348) | Dev overlay shows shop flags during combat |
| C2 | Wire run-duration items to their read sites: `flaming_arrows_shop`→SpawnSystem, `rapid_deployment`→[BarracksSystem.js:22](../src/systems/BarracksSystem.js#L22), `spell_mastery`→[SpellSystem.js:56-90](../src/systems/SpellSystem.js#L56-L90), `elite_training`→SpawnSystem | each system | each effect observable in combat |
| C3 | Immediate items: `curse_removal` + `command_expansion` handled inside `purchaseItem`; `scout_report` reveals next tier in map; `fresh_recruits` per **Q7** | ShopSystem.js, HubTestScreen.jsx, MapGenerator.js | purchase produces the stated effect |

### Phase D — Activate the dead curses (Risk: **Medium** — depends on **Q5**)

| Step | Change | Files | Verify |
|---|---|---|---|
| D1 | Curse expiry tracking (mirror blessing countdown) | EventSystem.js (curse entry shape), App.jsx (decrement) | curses expire on schedule |
| D2 | `OUTLAW` (−honor), `FOX_DEBT` (−boss reward), `VILLAGE_WRATH` (worse events) | RewardSystem.js, EventSystem.js (`applyEventChoice`) | penalties measurable |

### Phase E — New mechanics / design-dependent (Risk: **High** — gated on Q2/Q3/Q4/Q6)
Only the options you pick get built.

| Step | Depends on | Change |
|---|---|---|
| E1 | Q4 | Stone Stance (defense mechanic or HP conversion) |
| E2 | Q2 | "Tower" items (`quick_repairs`, `iron_fortifications`) |
| E3 | Q3 | Dragon Wave unlock gate (`dragon_scroll`) |
| E4 | Q6 | Necromancer effects (Haunted, Necro's Wrath, Holy Protection) |

---

## 6. How to make it better (recommended, optional)

These reduce the chance this class of bug ("computed but never read") ever recurs:

1. **One unified modifier function.** Replace the three separate paths (blessings, curses, and the new shop modifiers) with a single `computeRunModifiers(runState)` returning all combat multipliers + flags. One bridge, one place to test, no orphaned outputs.
2. **Data-driven effects.** Let each blessing/curse/shop item declare its effect as data (`{ stat, op, value, scope, duration }`) and have one generic applier consume it — this deletes the giant `switch` statements in EventSystem and makes "defined but unwired" structurally impossible.
3. **Unify duration handling.** Blessings and curses should share one countdown mechanism (combats / nodes / run) instead of blessings having `combatsRemaining` and curses having nothing.
4. **Dev modifier overlay.** A small debug readout (active blessings/curses/shop flags + resolved multipliers) shown in combat. This is how we'd have caught Eagle Eye and Stone Stance being silently dropped.

> These are improvements, not prerequisites. We can ship Phases A–D on the current structure and refactor toward #1/#2 afterward, or do #1 first as the foundation for Phase C. **Preference?**
>
> **Answer:** _(pending)_

---

## 7. Out of scope (this pass)

- Combat balance tuning (see Q8).
- Necromancer system unless Q6 = Option B.
- New shop items or new events.
- The orphaned `CURSED_GOODS` curse (works but ungranted) — leave until an event needs it.
