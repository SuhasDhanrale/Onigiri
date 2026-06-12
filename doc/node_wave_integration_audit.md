# Node And Wave Integration Audit

**Date:** June 12, 2026  
**Scope:** How generated map nodes affect combat waves, rewards, and result reporting.

---

## Summary

The node system and wave system were partially integrated.

The good part: when a player starts a generated combat, `App.jsx` pushes node context into `meta`:

- node type,
- node variant,
- node threat,
- node wave count,
- chapter difficulty multiplier.

`WaveSystem.js` then reads this context when spawning waves.

The weak part: the old wave generator mostly ignored node variant and special identity. Early waves returned fixed squads before node threat could matter, so many different map nodes produced nearly identical combat. The result screen also under-reported waves because `combatStats.conqueredWaves` was initialized but never updated.

---

## Coding Issues Found

### 1. Early Waves Bypassed Node Difficulty

Old behavior:

- wave 1 always spawned 4 rebels,
- wave 2 always spawned 12 rebels,
- wave 3 always spawned 12 rebels and 2 shinobi.

This happened even on elite or boss nodes because the function returned before node threat and boss scaling could change the squad.

**Status:** Fixed.

Early waves now scale by node type/threat.

### 2. Node Variant Was Mostly Ignored

`activeNodeVariant` was passed into `WaveSystem`, but only appeared in TODO comments.

**Status:** Partially fixed.

Basic enemy identity is now added for supported variants:

- `swarm` adds more rebels,
- `tengu_master` adds Tengu,
- `shinobi_squad` adds Shinobi,
- `onmyoji_ritual` adds Onmyoji,
- `oni_warlord` adds pressure and a final Oni,
- `yamabushi` adds Onmyoji,
- `ronin_duel` adds a final Shinobi stand-in.

This is not the final design for special abilities. It is a first integration pass so node identity affects actual waves.

### 3. Final Wave Could End With Enemies Alive

The old cleanup rule advanced the wave when only 20% of enemies remained. That is fine for pacing between waves, but it also applied to the final wave. This could award node victory while enemies were still alive.

**Status:** Fixed.

Non-final waves can still advance at the cleanup threshold, but final wave victory now requires all enemies to be cleared.

### 4. Result Screen Wave Count Was Wrong

`combatStats.conqueredWaves` was never updated, and total waves used `s.wave - 1`.

**Status:** Fixed.

Wave completion now updates `combatStats.conqueredWaves`, and the result screen uses the node's configured wave count.

---

## Remaining Design Gaps

### 1. Specials Are Not Fully Implemented

The config has special labels like:

- `low_visibility`,
- `timed_bonus`,
- `enemies_behind_barricades`,
- `dodge_50_arrows`,
- `self_heal`,
- `target_buildings`.

Most of these need real combat mechanics, UI telegraphs, or enemy behaviors. They should not be treated as complete just because the variant now affects squad composition.

### 2. Wave RNG Is Not Seeded

The map is seeded, but wave composition and spawn positions still use `Math.random()`.

Design choice:

- If we want reproducible roguelite planning, seed waves from `mapSeed + nodeId + wave`.
- If we want combat chaos, keep live RNG.

Recommended middle ground: seed enemy composition, keep spawn scatter/particles live-random.

### 3. Some Elite Fantasy Needs New Units

`ronin_duel` and `yamabushi` do not have dedicated enemy units. They currently use existing stand-ins.

Recommended later:

- add a Ronin enemy for duel nodes,
- add a Yamabushi monk enemy,
- give Onmyoji ritual behavior a proper summon loop.

### 4. Reward And Difficulty Need Balance Pass

Now that rewards are real and wave identity is more real, values in `nodes.js` need balancing together:

- reward amount,
- wave count,
- node threat,
- enemy identity,
- expected command drops from kills.

This should be tuned as one economy/difficulty pass, not separately.

---

## Current Design Model

Recommended mental model:

```text
Map generation chooses the opportunity.
Node config defines reward, waves, threat, and identity.
Wave system turns that identity into enemy pressure.
Reward system pays the promised victory reward.
Result screen confirms the outcome.
```

That loop is now structurally connected. The next work should focus on balancing and making special labels into actual gameplay.
