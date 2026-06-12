# Buffs, Curses & Shop — Integration Plan

> **Goal:** Make shop purchases, event blessings, and curses actually affect gameplay — incrementally, without breaking anything that currently works.
> **Audited against:** Actual source code, 2026-06-10
> **Status:** Phases A–E shipped ✅ — **all 11 shop items, all 9 blessings, all curses live; command economy unified; Arrow Tower built.** §4/§4b/FR-Q/T-Q all answered. §6 resolved (dev overlay shipped ✅, heavy unification declined). Remaining: Chapters (§7) — deferred.
> **Rule for this doc:** No code is written until the Open Questions are answered. Answers go **inline in this file** (look for `**Answer:**` placeholders).

---

## 0. How to read this doc

1. **Section 1** — what's actually wired today (the baseline, so we know what we must NOT break).
2. **Section 2** — the one mechanism everything flows through (the "bridge").
3. **Section 3** — the 5 root blockers that explain every gap.
4. **Section 4** — **Open Questions you must answer** before we touch code.
5. **Section 5** — the stepwise, low-risk-first implementation plan.
6. **Section 6** — how to make the system structurally better (optional, recommended).
7. **Section 7** — Chapters & difficulty ramp (separate workstream; deferred TODO + its own questions).
8. **Section 8** — explicitly out of scope.

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

- **Option A (Recommended):** Unify — combat starts from `runState.baseCommand`, and leftover command banks back to `baseCommand` at combat end. Makes `command_expansion` and all event command rewards meaningful in battle.ok 
- **Option B:** Keep them separate — `baseCommand` is purely a between-combat/shop wallet; combat keeps its own 150 pool. Then `command_expansion` must be repurposed (it can't affect combat).

**Answer:** _(pending)_ A

### Q2 — What is a "tower"? (for `quick_repairs`, `iron_fortifications`)

No tower entity exists. Options:

- **Option A:** Give barracks buildings HP (new mechanic — bigger change).
- **Option B:** Reinterpret "towers" as the boss cave/orb (only matters on boss nodes).
- **Option C (Recommended for now):** Repurpose these two items to existing, mappable effects (e.g. flat HP buff to all units, or a one-time heal of all living units) and drop the "tower" wording.

**Answer:** _(pending)_ towe is the new builld withc we can billd with relode time is huge shoot arrow for defence perpose 

### Q3 — Dragon Wave unlock

- **Option A (Recommended):** Lock Dragon Wave by default; `dragon_scroll` (and/or a meta unlock) enables it for the run. Gives the item purpose.
- **Option B:** Leave Dragon Wave always available; repurpose `dragon_scroll` to something else (e.g. +1 charge / reduced cost).

**Answer:** _(pending)_A

### Q4 — Defense mechanic for Stone Stance

There is no damage-reduction stat today (player units take raw `hp -= damage`).

- **Option A:** Add an incoming-damage-reduction multiplier for player units (new but small mechanic).
- **Option B (Recommended):** Convert Stone Stance to an existing mechanic (e.g. +max HP) so it works through the current bridge with zero new systems.
- **Option C:** Drop Stone Stance.

**Answer:** _(pending)_B

### Q5 — Curse durations

- **Option A (Recommended):** Implement expiry counters (per-combat for "3 combats", per-node for "5 nodes", `Infinity` for run) — mirrors how blessings already work, so curses become balanced trade-offs.A
- **Option B:** Make all curses last the whole run and simplify the config (drop duration fields).

**Answer:** _(pending)_

### Q6 — Necromancer system (Haunted, Necro's Wrath, Holy Protection)

There's already a `// TODO Necromancer event` stub in EventSystem.

- **Option A (Recommended):** Defer — keep out of scope for this pass; leave those 3 effects flagged as unimplemented.
- **Option B:** Build a minimal revive mechanic now.

**Answer:** _(pending)_A

### Q7 — Items that need a choice UI (`fresh_recruits`, `curse_removal`)

- **Option A:** Build small picker modals (choose which unit / which curse).
- **Option B (Recommended for speed):** Auto-resolve — `fresh_recruits` grants a fixed/best unit; `curse_removal` removes the oldest curse. Add pickers later.

**Answer:** _(pending)_A

### Q8 — Balance during wiring

When we connect an effect, do we keep config values as-authored (e.g. +25% fire, 2× barracks, +15% stats)?

- **Option A (Recommended):** Keep values as-is now; treat balancing as a separate later pass. Reduces risk of conflating "wired" with "tuned."
- **Option B:** Re-balance as we wire.

**Answer:** _(pending)_A

---

## 4b. Decisions locked (from your §4 answers — 2026-06-10)

| Q | Decision | Effect on plan |
|---|---|---|
| Q1 | **A — Unify command.** Combat seeds from `baseCommand`; winnings bank back. | Phase B is in. |
| Q2 | **New mechanic — Defensive Arrow Tower.** A buildable structure with HP + a long reload that auto-fires arrows for defense. `quick_repairs`/`iron_fortifications` act on it. | E2 becomes a new-building feature — see Tower sub-spec (T-Q1–T-Q3). |
| Q3 | **A — Lock Dragon Wave**; `dragon_scroll` unlocks it for the run. | E3 in. |
| Q4 | **B — Stone Stance → +max HP** (no new defense stat). | E1 trivial (reuse HP bridge). |
| Q5 | **A — Curse expiry counters** (per-combat / per-node / run). | Phase D1 in. |
| Q6 | **A — Defer necromancer** (Haunted / Necro's Wrath / Holy Protection stay unimplemented). | E4 dropped this pass. |
| Q7 | **A — Picker modals** for `fresh_recruits` (unit) and `curse_removal` (curse). | C3 builds small pick UIs. |
| Q8 | **A — Keep config values**; balance later. | No tuning this pass. |

### Tower sub-spec — still needs answers (T-Q1–T-Q3)

The Tower (Q2) is a *new building*, not a tweak — answered & built:

- **T-Q1 — Build & placement:** **Two fixed flank slots above the wall line** (`TOWER_SLOTS` in constants.js); built by **clicking the empty slot** (not the barracks panel, not free-placement); cheap — **50 command** (`TOWER_COST`). ✅
- **T-Q2 — Combat profile:** Recommended approved — **40 dmg / 600 range / 200 HP / ~5s reload**, stationary (speed 0), fires arrows like a Yumi (`ARROW_TOWER` in units.js). ✅
- **T-Q3 — Persistence:** **Rebuilt fresh each combat** (like all units; nothing carries between nodes). ✅

### `fresh_recruits` semantics — needs a decision (FR-Q)

`fresh_recruits` = "choose 1 unit type to add." What does *adding a unit type* do? **Answer:** A — implemented ✅
- **Option A (Recommended):** Unlock the chosen barracks for the **rest of the run** (build + auto-spawn it). Needs a run-scoped `shopBarracksUnlocks` list merged into `startCombat`'s barracks setup.
- **Option B:** One-time garrison — spawn a small squad of the chosen unit at the **start of the next combat only** (reuse the existing `pendingGarrison` path).
- **Option C:** Permanent unlock — adds to `meta.unlockedBarracks` forever (carries across runs).

---

## 5. Stepwise implementation plan (low-risk first)

Each phase is **independently shippable and verifiable**. Stop after any phase and the game still runs. Phases are ordered so earlier ones unblock later ones.

> Phases C–E depend on the Open Question answers; ranges/risks below assume the **Recommended** options.

### Phase A — Complete the partial wiring (Risk: **Very Low**) — ✅ DONE 2026-06-10
Pure additive reads/fixes; no new mechanics, no balance shift. Build verified (`vite build`, 85 modules, no errors).

| Step | Change | Files | Verify |
|---|---|---|---|
| A1 | Read `activeArcherRangeMult` where YUMI range is set (Eagle Eye starts working) | SpawnSystem.js (stat block) | YUMI range visibly larger with Eagle Eye active |
| A2 | Fix command-delta display bug: read `baseCommand` not `command` | [HubTestScreen.jsx:113-115](../src/ui/screens/HubTestScreen.jsx#L113-L115) | Event result screen shows correct ±Command |
| A3 | Add `LOOTING` to `computeBlessingMultipliers` + apply to reward | EventSystem.js, [RewardSystem.js:30-44](../src/systems/RewardSystem.js#L30-L44) | More command per kill with Looting active |

### Phase B — Unify the command economy (Risk: **Medium** — Q1=A) — ✅ DONE 2026-06-10
Build verified. Combat command and the run wallet are now one pool.

| Step | Change | Files | Verify |
|---|---|---|---|
| B1 | Combat seeds `command`/`totalCommand` from `runStateRef.current.baseCommand` (fallback 150 if no run) | `startCombat` [App.jsx](../src/App.jsx) | Combat starts with the run's actual command |
| B2 | Victory banks leftover `state.current.command` → `runState.baseCommand`; boss path ends run (no bank); loss path resets run | `handleRegionVictory` [App.jsx](../src/App.jsx) | Command carries between nodes; shop spend reduces next combat budget |

> ⚠️ **Balance watch (playtest):** fresh runs now start combat at `baseCommand` (default **100**, was a flat **150**) — leaner early game. Command now **compounds** across a run (good combats enrich you; shop spend costs army budget). Watch for a low-leftover **death spiral**. Easy knobs if it feels punishing (all deferred per Q8): per-combat stipend, a minimum seed floor, or banking only a fraction of leftover.

### Phase C — Shop→combat bridge (Risk: **Medium** — unblocks blocker #1) — ✅ MOSTLY DONE 2026-06-10
Implementation note: shop run-buffs are read once in `startCombat` and stored on `state.current` (not the meta channel) — cleaner here because spell cooldowns are set inside SpellSystem with no `metaRef`. Same "compute → inject → read" shape, build verified.

| Step | Change | Status |
|---|---|---|
| C1 | `computeShopModifiers(shopPurchases)` in ShopSystem; called in `startCombat`, stored on `state.current` (`shopUnitStatMult`, `shopArcherFireMult`, `shopBarracksTimeMult`, `shopSpellCooldownMult`) | ✅ |
| C2 | `elite_training`→SpawnSystem (+15% hp/dmg), `flaming_arrows_shop`→SpawnSystem (+25% archer dmg), `rapid_deployment`→BarracksSystem (timer ×0.5 = 2× faster), `spell_mastery`→SpellSystem (cooldowns ×0.8) | ✅ |
| C3a | `command_expansion` → +30 `baseCommand` in `purchaseItem` | ✅ |
| C3b | `curse_removal` → picker modal (Q7=A); ShopModal disables it ("No Curses") when none present | ✅ |
| C3c | `fresh_recruits` → unit picker (FR-Q=A): unlocks chosen barracks for the rest of the run via run-scoped `shopBarracksUnlocks`, merged in `startCombat`; ShopModal disables it ("All Unlocked") when none remain | ✅ |
| C3d | `scout_report` **repurposed** → `base_command_plus_25` ("Supply cache: +25 Command", immediate via `purchaseItem`); the original reveal was a no-op since the node map already shows all node info | ✅ |

### Phase D — Activate the dead curses (Risk: **Medium** — Q5=A) — ✅ DONE 2026-06-10
Build verified. Curses now carry time counters and the three free curses bite.

| Step | Change | Status |
|---|---|---|
| D1 | Curse entries get counters from their `removal` field (`time_3_combats`→`combatsRemaining`, `time_5_nodes`→`nodesRemaining`); `tickCurses` decrements + drops expired — combats tick in `handleRegionVictory`, nodes tick there + in `completeNode`. Removal-only curses (WEAKENED/DIVINE_WRATH/etc.) stay until a shop/rest/event clears them. | ✅ |
| D2a | `OUTLAW` −30% honor — combat honor in `handleRegionVictory` (`getCurseHonorMult`) + positive event honor in `applyEventChoice` | ✅ |
| D2b | `VILLAGE_WRATH` −50% to positive event command/honor in `applyEventChoice` (computed from pre-choice curses, so the granting event isn't penalised) | ✅ |
| D2c | `FOX_DEBT` −50% boss combat honor in `handleRegionVictory` | ✅ |

### Phase E — New mechanics / design-dependent (Risk: **High**)
Resolved from §4b:

| Step | Decision | Change | Status |
|---|---|---|---|
| E1 | Q4=B | Stone Stance → `m.maxHp += 0.25` in `computeBlessingMultipliers` (rides the existing maxHp bridge); dead `defense` key removed | ✅ DONE |
| E2 | Q2 | **Built the Defensive Arrow Tower** — `ARROW_TOWER` unit (stationary ranged, 200 HP, fires arrows); two flank build-slots above the wall, click-to-build for 50 command (`InputHandler`), procedural tower visual + empty-slot markers (`drawUnits`/`drawBackground`). `iron_fortifications` → +100% tower HP (`computeShopModifiers.towerHpMult` → `SpawnSystem`). | ✅ DONE |
| E2-note | — | `quick_repairs` **repurposed** → `tower_hp_plus_50` ("Arrow Towers +50% HP", run-duration, stacks with `iron_fortifications` via `computeShopModifiers.towerHpMult`); the original "repair" was incompatible with the per-combat model | ✅ |
| E3 | Q3=A | `computeShopModifiers` exposes `dragonUnlocked` (from `dragon_scroll`); stored on `state.current`; `triggerDragonWave` gated on it; SpellShrine shows a 🔒 until unlocked | ✅ DONE |
| E4 | Q6=A | **Deferred** — necromancer effects out of scope this pass | — |

---

## 6. How to make it better (recommended, optional)

These reduce the chance this class of bug ("computed but never read") ever recurs:

1. **One unified modifier function.** Replace the three separate paths (blessings, curses, and the new shop modifiers) with a single `computeRunModifiers(runState)` returning all combat multipliers + flags. One bridge, one place to test, no orphaned outputs.
2. **Data-driven effects.** Let each blessing/curse/shop item declare its effect as data (`{ stat, op, value, scope, duration }`) and have one generic applier consume it — this deletes the giant `switch` statements in EventSystem and makes "defined but unwired" structurally impossible.
3. **Unify duration handling.** Blessings and curses should share one countdown mechanism (combats / nodes / run) instead of blessings having `combatsRemaining` and curses having nothing.
4. **Dev modifier overlay.** A small debug readout (active blessings/curses/shop flags + resolved multipliers) shown in combat. This is how we'd have caught Eagle Eye and Stone Stance being silently dropped.

> These are improvements, not prerequisites. We can ship Phases A–D on the current structure and refactor toward #1/#2 afterward, or do #1 first as the foundation for Phase C. **Preference?**
>
> **Answer:** Wire first, refactor after. Ship Phases A–D on the current structure; the unified `computeRunModifiers` / data-driven refactor (#1, #2) happens as a follow-up pass once effects are proven working.

### §6 refactor — breakage / gameplay assessment (2026-06-11)

**Finding: the heavy unification (#1, one `computeRunModifiers`) is NOT recommended — low value, real regression risk.** Reason: there are **two legitimate injection points at two different times**, so a single function would still be consumed in two places writing to two targets:

| Source | Computed in | Written to | Read by |
|---|---|---|---|
| Blessings + curses | `handlePlayNode` (node start) | `meta.active*Mult` | SpawnSystem, CombatSystem (`metaRef`) |
| Shop buffs | `startCombat` (combat start) | `state.current.shop*` | SpawnSystem, BarracksSystem, SpellSystem (`s`) |
| Curse honor + expiry | `handleRegionVictory` / `completeNode` | `runState` / `meta` | — |

Collapsing these gains only cosmetic tidiness while touching the **spine every shipped feature depends on** (App.jsx ×3 sites, EventSystem ×3 fns, ShopSystem, + every read site) — behavior-preserving but easy to get subtly wrong, for ~0 gameplay benefit. **Recommend: skip.**

**Safe, high-value alternative (zero gameplay risk):** add a **dev modifier overlay** (#4) — a read-only combat readout of active blessings/curses/shop flags + resolved multipliers. This is the actual safety net that would have caught the original "computed but never read" bugs (Eagle Eye, Stone Stance). Additive, no logic change.

**Verdict:** keep the current structure; optionally add the dev overlay. Defer/skip the unification unless the modifier set grows much larger.

**Decision (2026-06-11): dev overlay shipped ✅, heavy unification declined.** Added `DevModifierOverlay` (`src/ui/panels/DevModifierOverlay.jsx`) — a DEV-only (`import.meta.env.DEV`), read-only combat panel (top-left, collapsible) showing active blessings/curses/shop purchases + the resolved multipliers combat is using (`meta.active*Mult`, `state.current.shop*`). No-op in production builds, zero gameplay effect. The unification (#1/#2) is deliberately not done — two-injection-point architecture makes it cosmetic-only.

---

## 7. Chapters & difficulty ramp (separate workstream)

> From the design discussion 2026-06-10. Its own workstream — ships independently of §5 — but a rising difficulty curve is what makes the buff/curse/shop upgrades matter. **Marked DEFERRED — we do this later.**

### Concept
- Each **run = one chapter**; **5 chapters** total; ~30 min each.
- Runs already auto-generate: `generateMap(seed, runNumber)`, and `runNumber` increments on every boss kill ([App.jsx:285-288](../src/App.jsx#L285-L288)).
- **Recommendation: bind chapter ↔ region.** `CAMPAIGN_MAP` already defines 5 regions (Riverlands → The Abyss) with ascending threat (1, 2, 3, 3, 5) and a permanent reward each, ending in "Campaign Victory" ([campaign.js:1-7](../src/config/campaign.js#L1-L7)). Reuse it as the 5 chapters rather than inventing a 3rd progression system.

### Current-state findings (the gaps)
| Finding | Detail | Where |
|---|---|---|
| Chapter-over-chapter difficulty does NOT exist | `runNumber` drives map layout only — nothing reads it for scaling | MapGenerator.js:132-134 |
| Per-enemy threat scaling is DEAD in run mode | `CAMPAIGN_MAP[s.currentRegion]` is `undefined` (currentRegion is a node ID) → threatMult always 1 | SpawnSystem.js:77 |
| Node threat scales composition only | `nodeThreat` feeds `generateWave` (enemy *types*), not enemy *stats* | WaveSystem.js:72-76 |
| runState resets each run | blessings/curses/baseCommand/shopPurchases wiped by `createRunState`; only `meta` (conqueredRegions) persists | GameState.js:55-78 |

### The difficulty tweak (small, same bridge pattern)
Inject an `activeChapterThreat` into meta (from region `threatLevel` or a `1 + chapter×N%` curve) and have SpawnSystem's enemy multiplier read it — same mechanism as `activeNodeThreat`/`activeNodeWaves`. Isolated, low-risk.

### Front-end is already prototyped
`HomeMock` (mock id `home`, [src/mocks/screens/HomeMock.jsx](../src/mocks/screens/HomeMock.jsx)) already mocks the chapter hub: title + PLAY (Continue) + CHAPTER SELECT list with completed / current / locked states (Ch I "The Awakening", Ch II "Siege of Kyoto" — current, Ch III "Descent into Yomi" — locked).

### TODO — DEFERRED (do later)
- [ ] **Promote `HomeMock` into the real home screen as the chapter hub.** Home screen holds the 5 chapters and shows progress (completed / current / locked) so the player can gauge progress and continue/select a chapter. Wire it to real `meta` (conqueredRegions + current chapter) instead of mock data.
- [ ] Wire the per-chapter difficulty ramp (`activeChapterThreat` → SpawnSystem).
- [ ] Bind each generated run to its chapter's region (theme + threat + clear-reward).

### Open Questions (answer inline, like §4)
- **C-Q1 — Chapter ↔ region binding:** reuse CAMPAIGN_MAP's 5 regions as the 5 chapters (Recommended), or a separate chapter list? **Answer:** _(pending)_
- **C-Q2 — Difficulty curve:** drive scaling off region `threatLevel` (1,2,3,3,5) or a smooth `1 + chapter×N%` ramp (what N)? **Answer:** _(pending)_
- **C-Q3 — Reset boundary:** do blessings/curses/shop reset each chapter (Recommended; only chapter-clear rewards persist) or carry across? **Answer:** _(pending)_
- **C-Q4 — Chapter length:** keep ~13-node maps, or scale node/tier/wave counts up per chapter (later chapters longer + harder)? **Answer:** _(pending)_
- **C-Q5 — Names:** keep HomeMock names (The Awakening / Siege of Kyoto / Descent into Yomi …) or use region names (Riverlands …)? **Answer:** _(pending)_

---

## 8. Out of scope (this pass)

- Combat balance tuning (see Q8).
- Necromancer system unless Q6 = Option B.
- New shop items or new events.
- The orphaned `CURSED_GOODS` curse (works but ungranted) — leave until an event needs it.
