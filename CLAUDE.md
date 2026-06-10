# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repo.

## What this is

**Onigiri** (a.k.a. "Shogun Tower Defense") — a browser tower-defense / auto-battler
with an Ukiyo-e aesthetic, built on **React 18 + HTML5 Canvas**. React owns the UI
chrome and screen routing; a hand-rolled game loop drives combat on `<canvas>`.

Stack: **Vite 6**, **React 18** (JSX, no TypeScript), **Tailwind 3**, **mitt** (event
bus), **lucide-react** (icons). ESM throughout (`"type": "module"`).

## Commands

```bash
npm run dev        # dev server at http://localhost:3001 (HMR)
npm run dev:mocks  # open the Mock Lab sandbox (mocks.html) — see src/mocks/AGENTS.md
npm run build      # production build → dist/ (see "Platform builds" below)
npm run preview    # preview the production build
npm run lint       # ESLint (flat config, eslint.config.js)
npm run lint:fix   # ESLint with autofix
```

There is **no test suite**. Verify changes by running the app (`npm run dev`) or the
Mock Lab (`npm run dev:mocks`).

## Architecture — the four things to internalize

1. **Combat state is a mutable ref, not React state.** The live game/combat world
   lives in a single big object held in a `useRef` in [src/App.jsx](src/App.jsx)
   (`state.current`: `units`, `projectiles`, `particles`, `barracks`, `wave`,
   `cave`, `gameState`, …). Systems **mutate it in place** every frame for
   performance — do **not** convert this to `setState`. The factories
   `createInitialState()` / `createRunState(meta)` live in
   [src/core/GameState.js](src/core/GameState.js). UI re-renders are triggered
   manually by bumping `uiTick` and via the event bus.

2. **Systems are plain functions, not classes.** Each file in
   [src/systems/](src/systems/) exports `tick*` / action functions that take the
   state object as their first arg, e.g. `tickUnits(s, dt, now, metaRef)`,
   `spawnUnit(s, …)`. The frame order is orchestrated in
   [src/hooks/useGameLoop.js](src/hooks/useGameLoop.js) (the `requestAnimationFrame`
   heartbeat): update systems → `processDeaths` → tick effects → `drawGame`.

3. **Rendering is canvas, split bg/fg.** [src/renderer/](src/renderer/) draws to two
   canvases (`bgCanvasRef`, `fgCanvasRef` in App.jsx).
   [GameRenderer.js](src/renderer/GameRenderer.js) (`drawGame`) is the per-frame
   entry; pieces are `drawBackground`, `drawCave`, `drawUnits`, `drawEffects`.
   The logical coordinate space is **`V_WIDTH × V_HEIGHT = 1200 × 1600` (portrait)**,
   from [src/config/constants.js](src/config/constants.js) (also `WALL_Y`,
   `BATTLE_LINE_Y`). Always work in logical coords; scaling is handled at draw time.

4. **Event bus: systems emit, React listens.** [src/core/EventBus.js](src/core/EventBus.js)
   exports `bus` (a `mitt()` singleton); event names are in
   [src/core/events.js](src/core/events.js) (`EVENTS`: `GAME_STATE_CHANGED`,
   `WAVE_CHANGED`, `COMMAND_CHANGED`, `HONOR_EARNED`, `UNIT_DIED`, `ELITE_KILLED`,
   `SCREEN_SHAKE`, `UNIT_SPAWNED`). Game systems `bus.emit(...)`; React UI subscribes
   via [src/hooks/useGameEvents.js](src/hooks/useGameEvents.js). Use this for
   system→UI signals instead of threading callbacks.

## Layout

- `src/config/` — **static data only** (no logic): `units`, `barracks`, `campaign`,
  `colors`, `constants`, `blessings`, `curses`, `provisions`, `nodes`, `cave`,
  `progression`.
- `src/core/` — foundational: `EventBus`, `events`, `GameState`, `utils`.
- `src/systems/` — the game engine (function modules, see above).
- `src/renderer/` — canvas drawing.
- `src/ui/` — React presentation: `screens/` (full-screen flows), `panels/` (combat
  HUD chrome), `map/` (conquest map hub), `components/`.
- `src/hooks/` — `useGameLoop`, `useMeta` (persistent profile), `useRunState`
  (per-run), `useGameEvents`.
- `src/mocks/` — **dev-only** Mock Lab sandbox. Read
  [src/mocks/AGENTS.md](src/mocks/AGENTS.md) before touching it; never import mock
  files from production code.
- `ads/`, `analytics/`, `src/@ads/`, `src/@analytics/` — pluggable platform adapters
  (with no-op variants); they reference SDK globals injected by external scripts.

## Screen routing (App.jsx state machine)

`state.current.gameState` drives which top-level screen renders:
`MAP_SCREEN` (the conquest hub, `HubTestScreen`) → `COMBAT` (`CombatScreen` + HUD
panels) → `REGION_VICTORY` / `GAMEOVER` / `CAMPAIGN_OVER`. HUD panels mount alongside
`CombatScreen` whenever `gameState !== 'MAP_SCREEN'`.

## Conventions

- **No TypeScript.** Components are **named exports** (`export const Foo = …`); only
  `App` is a default export.
- **Tailwind uses arbitrary hex values** drawn from the `COLORS` palette in
  [src/config/colors.js](src/config/colors.js) (e.g. `bg-[#1b1918]`). Match existing
  classes rather than introducing a new color system.
- Keep new game logic in `systems/` as state-mutating functions; keep `config/` pure
  data; keep React components for chrome/flow, not per-frame simulation.

## Platform builds

[vite.config.js](vite.config.js) supports multiple distribution targets via the build
`mode` / `VITE_*` env (`web`, `crazygames`, `poki`, `gamedistribution`, `playgama`,
`mobile`), each with its own `dist-*` output dir, and toggles for Firebase / ads /
analytics. The default `dev`/`build` target is `development` → `dist/`.

## More docs

- [doc/DEVELOPER_GUIDE.md](doc/DEVELOPER_GUIDE.md) — architecture & state deep dive.
- [doc/SYSTEM_MAP.md](doc/SYSTEM_MAP.md) — per-file responsibilities.
- [doc/GETTING_STARTED.md](doc/GETTING_STARTED.md) — setup.
