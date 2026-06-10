# Mock Lab — agent recipe

> **Audience:** the AI agent building or promoting a mock in THIS game's `src/mocks/`.
> **Fill the `<FILL: …>` slots once** (the game's first Mock Lab task); after that,
> this file tells any future agent exactly what to do without re-deriving the system.

## What the Mock Lab is for

A dev-only sandbox to prototype a screen/system/flow in isolation, review it at a
real device viewport, then **promote it into the real game**. You build here on the
designer's instruction; the designer reviews; you iterate; you promote.

## The one rule

**Additive, never mutating.** Each experiment is its OWN new file under `screens/`.
Do not edit an existing experiment to make a different one — copy it or start a new
file. The designer curates which experiments survive.

## Fidelity is the point (read before building)

A mock must "know the game." Build every experiment from the game's **real building
blocks** — only the *composition* is new. That is what makes promotion a move, not
a rewrite.

This game's real building blocks (Onigiri):

- **Renderers / draw fns:** `src/renderer/*` — `drawGame` (`GameRenderer.js`, the
  full per-frame entry that the combat canvas loop calls), plus its pieces
  `drawBackground` (`drawBackground.js`), `drawCave` (`drawCave.js`),
  `drawUnitTopDown` (`drawUnits.js`), `drawBackgroundEffects` /
  `drawForegroundEffects` (`drawEffects.js`). These are the SAME fns
  `useGameLoop` drives in the live game — call them directly with a
  game-state-shaped object for fidelity.
- **Reusable UI components:** `src/ui/*` —
  `ui/panels/` (CommandPanel, EconomyHeader, BarracksCard, SpellShrine,
  TacticalCommand — combat HUD chrome), `ui/screens/` (CombatScreen,
  HubTestScreen, SumiResultScreen, ResultScreens, EventModal, RestModal,
  ShopModal — full-screen flows), `ui/map/` (MapArea, WarCampPanel — the
  conquest map hub), `ui/components/` (DemonCave — boss encounter visuals).
- **Theme tokens:** `src/config/colors.js` — `COLORS` (the Ukiyo-e palette:
  `parchment`, `inkDark`, `ink`, `inkLight`, `vermilion`, `navy`, `khaki`,
  `jade`, `spirit`, `gold`). Tailwind classes in this game mostly use raw hex
  via arbitrary values (e.g. `bg-[#1b1918]`) drawn from this palette — match it.
- **State shape + factory:** combat/run-loop state via `createInitialState()`
  in `src/core/GameState.js` (units, projectiles, cave, orb, barracks, troop
  levels, wave/fever state, etc.); persistent player profile ("meta") shape
  lives in `src/hooks/useMeta.js` (`honor`, `unlockedProvisions`,
  `equippedItem`, `conqueredRegions`, `totalRuns`, `unlockedBarracks`,
  `focusMult`); per-run state via `createRunState(meta)` (also in
  `GameState.js`: `baseCommand`, `honorEarned`, `blessings`, `curses`,
  `currentNodeId`, etc.).
- **Logical coordinate space:** `V_WIDTH x V_HEIGHT` = `1200 x 1600`
  (`src/config/constants.js`), portrait. Also exports `WALL_Y` and
  `BATTLE_LINE_Y`, used by `drawBackground`/`drawCave` for layout.
- **Event bus + relevant events:** `src/core/EventBus.js` exports `bus` (a
  `mitt()` instance — game systems EMIT, React UI LISTENS). Event names in
  `src/core/events.js` → `EVENTS`: `GAME_STATE_CHANGED`, `WAVE_CHANGED`,
  `COMMAND_CHANGED`, `HONOR_EARNED`, `UNIT_DIED`, `ELITE_KILLED`,
  `SCREEN_SHAKE`, `UNIT_SPAWNED`.

## Recipe — add a new experiment

1. **New file:** `screens/<Name>Mock.jsx`. Export one plain React component:
   ```jsx
   export const <Name>Mock = ({ presetId, resetToken, state, setState }) => { … };
   ```
   - `presetId` — selected preset id. `resetToken` — changes on Reset / screen switch;
     key off it (or `useEffect` on it) to restart the experiment.
   - `state` / `setState` — per-screen toolbar state (only if you declare `controls`).
2. **Render from real parts.** For canvas screens, use `useCardCanvas(draw, { logicalW, logicalH })`
   and draw with this game's **real renderers** in its **real logical coords**. For DOM
   screens, use the game's real components + theme tokens. Do not reinvent art/styles
   that already exist in the game.
3. **Get data.** Read a preset (game-state-shaped) from `presets.js`. If the screen
   needs LIVE behavior, use `useMockBridge(bus, () => preset.create(), handlers)` and
   write `handlers` that mirror what the real systems do on those events.
4. **Register.** Append ONE entry to `registry.jsx`:
   ```js
   { id, title, description, component: <Name>Mock, defaultPresetId: 'starter' }
   ```
   Add `initialState` + `controls` only if the screen needs its own toolbar chrome.
5. **Run** `npm run dev:mocks`, open the screen, hand it to the designer.

## Recipe — promote an experiment into the game

When the designer signs off:

1. **Move the rendering**, not the plumbing. The screen body already speaks the
   real game's language (real renderers/components/state shape), so it drops into the
   real screen location: full-screen flows go in `src/ui/screens/`, HUD chrome in
   `src/ui/panels/`, map/hub pieces in `src/ui/map/`.
2. **Swap the data source:** replace the `preset` / `useMockBridge` data with the
   real live state/props the real screen receives.
3. **Drop lab-only props:** `presetId`, `resetToken`, the toolbar `state`/`setState`,
   and the `useCardCanvas` rig if the real game already has its own loop/canvas.
4. **Delete or keep the mock?** Leave the experiment file in `screens/` unless the
   designer says otherwise — it stays as a sandbox for future iteration.
5. **Wire it** into the real game's screen routing / system order: `src/App.jsx`
   drives a `gameState` state machine (`MAP_SCREEN`, `COMBAT`, `REGION_VICTORY`,
   `GAMEOVER`, `CAMPAIGN_OVER`, …) that decides which top-level screen renders;
   HUD panels are mounted alongside `CombatScreen` whenever `gameState !== 'MAP_SCREEN'`.

## Never

- Never edit `MockWorkbench.jsx` to add a screen (use the registry) or screen-specific
  chrome (use the entry's `controls` slot).
- Never import Mock Lab files from production code — it is dev-only.
- Never ship `mocks.html` / `main.jsx` in a production build.
