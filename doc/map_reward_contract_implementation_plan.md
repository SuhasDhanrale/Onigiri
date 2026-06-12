# Map Reward Contract Implementation Plan

**Date:** June 12, 2026  
**Goal:** Make randomly generated map node rewards trustworthy by using one reward contract for preview, victory payout, and result feedback.

---

## Step 1: Canonical Reward Resolver

**Status:** Implemented.

Add a dedicated reward system that reads the generated node and its variant config, then produces:

- preview reward lines for the hub card,
- deterministic victory reward rolls,
- run-state reward application,
- result-screen resource/impact summaries.

This keeps random map generation intact. The map still chooses random node opportunities, but each generated node now has a stable reward contract.

Implemented in:

- `src/systems/NodeRewardSystem.js`

---

## Step 2: Hub Preview Uses The Contract

**Status:** Implemented.

The hub card should not manually reconstruct combat and elite reward text from config. It should ask the reward resolver what the generated node promises.

Implemented in:

- `src/ui/screens/HubTestScreen.jsx`

---

## Step 3: Victory Grants The Same Contract

**Status:** Implemented.

When combat is won, the game now resolves the current node reward from `runState.currentNode*` and applies it alongside combat spoils.

Implemented reward effects:

- combat node command ranges,
- combat node honor ranges,
- elite honor guarantees,
- elite squad-cap bonuses for the run,
- elite blessing rewards as deterministic run blessings.

Implemented in:

- `src/App.jsx`
- `src/core/GameState.js`
- `src/core/utils.js`

---

## Step 4: Result Screen Confirms The Reward

**Status:** Implemented.

The battle result context now includes victory reward resources and elite reward impacts, so the player sees confirmation after the fight.

Implemented in:

- `src/App.jsx`

---

## Step 5: Follow-Up Balance Pass

**Status:** Pending.

After the contract is stable, tune values in `src/config/nodes.js`.

Recommended checks:

- combat node command should not inflate shop economy too quickly,
- combat node honor should stay lower than elite honor,
- elite squad-cap and blessing rewards should be rare but build-defining,
- boss/chapter rewards should stay separate from ordinary node payouts.

---

## Step 6: Optional UX Upgrade

**Status:** Pending.

Later, add a true post-combat blessing-choice modal for `blessing_choice` rewards. Until that exists, the resolver grants a deterministic blessing and the hub card says `Gain 1 Blessing`, not `Choose 1 Blessing`.
