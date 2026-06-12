# Chapters / Difficulty Ramp Implementation Plan

> Goal: make Onigiri's run loop read as a 5-chapter campaign, with each run bound to one chapter/region and a clear chapter-over-chapter difficulty ramp.
>
> Status: Phases A-C implemented. Campaign chapter helpers exist, run state binds each run to a chapter, and the real chapter home screen now sits in front of the generated map hub.
>
> Source context: `doc/buff_curse_shop_integration_plan.md` section 7, plus the current `CAMPAIGN_MAP`, generated map flow, run state, and combat modifier bridge.

---

## 1. Concept

- Each run is one chapter.
- There are 5 chapters total.
- Each chapter keeps the existing generated conquest map shape: `generateMap(seed, runNumber)`, currently about 13 nodes.
- The 5 chapters are the existing 5 campaign regions in `src/config/campaign.js`:
  1. Sakura Riverlands
  2. Kyoto Outskirts
  3. Tengu Peaks
  4. Kurogane Mines
  5. Yomi Abyss
- The chapter home screen should show player progress, allow continuing the current chapter, and show completed/locked chapter states.
- The existing map hub remains the actual per-run node map. The new chapter home sits in front of it instead of replacing it.

---

## 2. Locked Decisions

These decisions are already answered for this workstream.

| Question | Decision |
|---|---|
| C-Q1 - Chapter/region binding | Use `CAMPAIGN_MAP`'s 5 regions as the 5 chapters. |
| C-Q2 - Difficulty curve | Drive enemy stat scaling from each region's `threatLevel`; keep this tweakable in config. |
| C-Q3 - Reset boundary | Blessings, curses, shop purchases, and base command reset each chapter/run. Only chapter-clear rewards persist. |
| C-Q4 - Chapter length | Keep the current generated map length for now. No node-count scaling in this pass. |
| C-Q5 - Names | Use region names. The `HomeMock` names were placeholder/mock copy. |
| Name flavor | Use Japanese/manga-familiar display names while keeping stable region IDs for rewards/save logic. |
| Completed chapter behavior | Completed chapters are read-only in v1. Replays are deferred. |

---

## 3. Current Gaps

1. Chapter-over-chapter difficulty does not exist yet.
   - `runNumber` only changes generated map layout.
   - Combat does not read chapter number or campaign region for scaling.

2. Existing enemy threat lookup is dead in generated-run mode.
   - `SpawnSystem` reads `CAMPAIGN_MAP[s.currentRegion]?.threatLevel`.
   - In the generated map, `s.currentRegion` is a node id such as `2A` or `BOSS`, not a campaign region id.
   - The lookup falls back to threat `1`, so region threat does not affect enemy stats.

3. Node threat currently affects composition/budget only.
   - `WaveSystem` reads `activeNodeThreat` and passes it into `generateWave`.
   - This should remain unchanged.
   - Chapter threat should be the enemy stat ramp.

4. Run state resets per run.
   - This is now desired behavior for chapters.
   - Permanent chapter rewards continue to live in `meta.conqueredRegions`.

---

## 4. Implementation Plan

Each phase should be independently verified with `npm run build` and `npm run lint` before moving to the next.

### Phase A - Campaign Chapter Helpers

Add small helpers to `src/config/campaign.js` or a neighboring campaign utility module.

Status: implemented in `src/config/campaign.js`.

Required behavior:
- Export ordered chapter ids:
  - `RIVERLANDS`
  - `OUTSKIRTS`
  - `TENGU_PEAKS`
  - `IRON_MINES`
  - `THE_ABYSS`
- Provide a helper to get chapter definition by id.
- Provide a helper to get chapter number/index.
- Provide a helper to get the current unlocked chapter from `meta.conqueredRegions`.
- Provide a helper to return the full chapter list with number, status, and enemy stat multiplier.
- Provide a tweakable enemy stat multiplier function based on region threat.
- Use display names:
  - Sakura Riverlands
  - Kyoto Outskirts
  - Tengu Peaks
  - Kurogane Mines
  - Yomi Abyss

Default multiplier:

```js
enemyStatMult = 1 + ((threatLevel - 1) * 0.25)
```

This preserves the existing pattern from `SpawnSystem`, but moves it to a valid chapter/region source.

### Phase B - Bind Run State To Chapter

Extend run creation so every run knows its chapter.

Status: implemented in `src/core/GameState.js` and `src/hooks/useRunState.js`.

Required behavior:
- `createRunState(meta, chapterId)` stores:
  - `chapterId`
  - `chapterNumber`
  - existing `runNumber`
- `startRun(meta, chapterId)` passes the selected/current chapter id through.
- If no chapter id is passed, default to the current unlocked chapter from `meta.conqueredRegions`.
- Existing run-scoped values still reset:
  - `baseCommand`
  - `blessings`
  - `curses`
  - `shopPurchases`
  - `shopBarracksUnlocks`

### Phase C - Chapter Home Screen

Promote the `HomeMock` idea into a real screen, but wire it to real campaign state.

Status: implemented in `src/ui/screens/HomeScreen.jsx` and wired in `src/App.jsx`.

Required behavior:
- Add a production home/chapter screen using `public/assets/oni_bg.png`.
- The main `PLAY` action continues the current unlocked chapter.
- Chapter Select lists all 5 region chapters.
- Completed chapters are visible and read-only.
- The current chapter can be selected and starts/continues that chapter's generated map.
- Locked chapters are disabled.
- Use region names and region reward/threat data from `CAMPAIGN_MAP`.

Important integration note:
- Do not replace `HubTestScreen` in this pass.
- `HubTestScreen` remains the real map/run hub after the player chooses the current chapter from Home.

### Phase D - Map And Boss Completion Flow

Fix the distinction between generated node ids and campaign chapter ids.

Required behavior:
- Keep `state.current.currentRegion` as the current map node id for compatibility.
- Store active chapter id separately in meta/run state.
- On non-boss node victory:
  - mark the generated node complete
  - return to the map hub
  - do not add the node id to `meta.conqueredRegions`
- On boss victory:
  - add the active `chapterId` to `meta.conqueredRegions`
  - increment `meta.totalRuns`
  - end the current run
  - generate the next chapter map if another chapter remains
  - return to the chapter home/map flow
- On The Abyss boss victory:
  - enter campaign victory state
  - do not generate a sixth chapter

### Phase E - Enemy Stat Difficulty Ramp

Use the existing meta bridge pattern.

Required behavior:
- In `handlePlayNode`, inject:
  - `activeChapterId`
  - `activeChapterThreat`
  - `activeChapterEnemyStatMult`
- In `SpawnSystem`, replace the dead campaign lookup:

```js
CAMPAIGN_MAP[s.currentRegion]?.threatLevel
```

with:

```js
metaRef.current.activeChapterEnemyStatMult ?? 1
```

Enemy scaling should become:

```js
waveMult * chapterEnemyStatMult
```

Node threat remains separate and continues to affect wave generation/composition.

### Phase F - Dev Verification Overlay

Extend the existing dev-only modifier overlay.

Required behavior:
- Show active chapter id/name.
- Show chapter threat level.
- Show resolved chapter enemy stat multiplier.
- Keep it read-only and dev-only.

---

## 5. Test And Verification Plan

Run both gates after each implementation phase:

```powershell
npm run build
npm run lint
```

Manual checks:

1. Fresh game state
   - Home shows Riverlands as current.
   - Outskirts through The Abyss are locked.
   - Completed chapters list is empty.

2. Enter current chapter
   - `PLAY` opens the existing generated map flow.
   - START node and generated map progression still work.
   - Event, shop, rest, combat, elite, and boss nodes still route correctly.

3. Chapter 1 combat
   - Dev overlay shows Riverlands.
   - Threat is `1`.
   - Enemy stat multiplier is `1.00`.

4. Non-boss node victory
   - Generated node is marked completed.
   - No generated node id is added to `meta.conqueredRegions`.
   - Player returns to the generated map.

5. Boss victory
   - Active chapter region id is added to `meta.conqueredRegions`.
   - Run-scoped state resets.
   - Next chapter becomes current.
   - Previous completed chapter is read-only in Chapter Select.

6. Later chapter combat
   - Outskirts uses threat `2`.
   - Tengu Peaks and Iron Mines use threat `3`.
   - The Abyss uses threat `5`.
   - Enemy HP/damage ramp is visible in the dev overlay.

7. Campaign victory
   - Clearing The Abyss boss enters campaign victory.
   - No sixth generated chapter is created.

---

## 6. Assumptions And Out Of Scope

Assumptions:
- `meta.conqueredRegions` remains the source of permanent chapter rewards.
- `meta.totalRuns` can continue to count completed runs/chapters.
- The existing generated map shape is good enough for this pass.
- The current node map hub remains production UI for run traversal.

Out of scope:
- Replayable completed chapters.
- Chapter-specific map themes/art.
- Rebalancing enemy costs, wave budgets, node pools, or rewards.
- Changing the number of nodes per chapter.
- Persisting mid-chapter progress across browser refreshes.
- Refactoring the full modifier system.

---

## 7. Implementation Order Summary

1. Add campaign chapter helpers.
2. Add chapter fields to run state.
3. Add chapter home screen and top-level navigation.
4. Fix boss completion to award chapter regions instead of generated node ids.
5. Inject active chapter threat through the existing meta bridge.
6. Read active chapter threat in enemy spawn scaling.
7. Extend the dev overlay.
8. Build and manually verify each phase.
