# Shogun Tower Defense — Architecture Refactor Plan
> Stack: Vite + React + Plain JS + Raw Canvas | No game engine | Target: Web now, React Native later

---

## Stack Decisions (Locked)

| Decision | Choice | Reason |
|---|---|---|
| Build tool | Vite | Fast dev server, zero config, industry standard |
| UI framework | React | Stays for mobile conversion via React Native |
| Game loop | Raw `requestAnimationFrame` | Already working, no engine overhead |
| Renderer | HTML5 Canvas API | Already working, portable |
| Event bus | `mitt` | 200 bytes, zero deps, clean pub/sub |
| Game engine | **None** | Adding Phaser/Pixi would mean rewriting everything and blocking React Native |

The canvas is just a `<canvas>` element inside a React component. React owns the UI panels. The canvas owns the game world. They talk through the event bus. That is the whole architecture.

---

## The Core Problem

Right now everything lives in one ~1000 line `App.jsx`:
- Game configs hardcoded inside the component
- Canvas drawing mixed with React JSX
- Game logic runs inside a `useEffect`
- No separation between "what the game knows" and "what the screen shows"
- Adding one new unit type means touching 8 different places in the file

This plan fixes all of that in 5 phases. Each phase ends with a working game.

---

## Event Bus Decision

**Use `mitt`** — install with `npm install mitt`

It is 200 bytes, zero dependencies, and used by major game studios. The alternative (custom pub/sub) would take 3x longer to build and test. Here is the full API you will ever need:

```js
import mitt from 'mitt'
export const bus = mitt()

// Anywhere in game systems:
bus.emit('UNIT_DIED', { unit, reward })
bus.emit('KOKU_CHANGED', { amount: 50 })

// In React UI:
bus.on('KOKU_CHANGED', ({ amount }) => setKoku(k => k + amount))
```

One rule: **game systems only emit, React only listens.** Never the reverse. This is what keeps the game loop clean and React Native-ready.

---

## Final File Structure

```
src/
│
├── config/                        ← Pure data. No logic, no imports.
│   ├── colors.js                  ← COLORS object
│   ├── units.js                   ← UNIT_TYPES object
│   ├── barracks.js                ← BARRACKS_DEFS + BARRACKS_LAYOUT
│   ├── campaign.js                ← CAMPAIGN_MAP + ENEMY_COSTS
│   ├── progression.js             ← PERMANENT_TECHS + HEIRLOOMS
│   └── constants.js               ← V_WIDTH, V_HEIGHT, WALL_Y, BATTLE_LINE_Y, SLOT_OFFSETS
│
├── core/
│   ├── EventBus.js                ← mitt instance, exported as singleton
│   ├── GameState.js               ← createInitialState() factory function
│   └── utils.js                   ← generateId, getCost, getSquadCap, lineCircleCollide
│
├── systems/                       ← Pure JS. No React. No canvas. Just logic.
│   ├── BarracksSystem.js          ← Training timers, auto-unlock, focus bonus
│   ├── SpawnSystem.js             ← spawnUnit(), addParticle()
│   ├── WaveSystem.js              ← generateWave(), wave state machine
│   ├── MovementSystem.js          ← All unit velocity + separation logic
│   ├── CombatSystem.js            ← Target finding, attack, melee, ranged, siege
│   ├── ProjectileSystem.js        ← Projectile movement + hit detection
│   ├── SpellSystem.js             ← thunder, foxFire, dragonWave, warDrums, harvest
│   ├── GuardSystem.js             ← recalculateGuards(), slot assignment
│   ├── ParticleSystem.js          ← particle + floatingText + explosion tick
│   └── RewardSystem.js            ← koku drops, honor earning, death cleanup
│
├── renderer/
│   ├── drawUnits.js               ← drawUnitTopDown() - all unit shapes
│   ├── drawEffects.js             ← lightning, dragonWave, foxFire, explosions, particles
│   ├── drawBackground.js          ← inkLine, wall, gate, barricade structures, battle line
│   └── GameRenderer.js            ← drawGame() - orchestrates all draw calls + blood canvas
│
├── input/
│   └── InputHandler.js            ← getCanvasPos, handlePointerDown/Move/Up
│
├── hooks/
│   ├── useGameLoop.js             ← rAF setup, dt calc, calls update + draw
│   └── useMeta.js                 ← meta state (honor, heirlooms, techs, regions)
│
├── ui/
│   ├── screens/
│   │   ├── MapScreen.jsx          ← Full map hub with war camp panel
│   │   ├── CombatScreen.jsx       ← Canvas wrapper + wave HUD overlay
│   │   └── ResultScreens.jsx      ← GAMEOVER, REGION_VICTORY, CAMPAIGN_OVER overlays
│   ├── panels/
│   │   ├── CommandPanel.jsx       ← Right sidebar wrapper
│   │   ├── EconomyHeader.jsx      ← Sticky koku + army size bar
│   │   ├── BarracksCard.jsx       ← Single barracks row (collapsed + expanded)
│   │   ├── TacticalCommand.jsx    ← War drums, harvest, resolve buttons
│   │   └── SpellShrine.jsx        ← Thunder, fox fire, dragon wave + hero unlock
│   └── map/
│       ├── WarCampPanel.jsx       ← Left panel: honor, heirlooms, techs, reset
│       └── MapArea.jsx            ← SVG connections + region nodes
│
├── styles/
│   ├── base.css                   ← body, fonts, * reset, scrollbar utility
│   ├── map.css                    ← MapScreen specific styles
│   ├── combat.css                 ← CombatScreen canvas wrapper
│   ├── panels.css                 ← CommandPanel, BarracksCard, buttons
│   └── animations.css             ← Tailwind @keyframes overrides, ping, spin
│
├── App.jsx                        ← Only routing between game states. ~50 lines.
└── main.jsx                       ← Vite entry point

public/
└── assets/                        ← Static files. Vite serves these as-is.
    ├── sprites/                   ← Unit images / spritesheets (future)
    │   ├── player/                ← hatamoto.png, yumi.png, cavalry.png, horoku.png, champion.png
    │   └── enemy/                 ← rebel.png, oni.png, tengu.png, shinobi.png, onmyoji.png
    ├── sfx/                       ← Sound effect files (.ogg preferred, .mp3 fallback)
    │   ├── combat/                ← sword_clash.ogg, arrow_fire.ogg, explosion.ogg, burn.ogg
    │   ├── ui/                    ← button_click.ogg, unlock.ogg, wave_start.ogg, gameover.ogg
    │   └── ambient/               ← battlefield_loop.ogg, rain.ogg
    ├── music/                     ← bgm_map.ogg, bgm_combat.ogg, bgm_boss.ogg
    ├── ui/                        ← logo.png, map_texture.jpg, parchment_tile.jpg
    └── fonts/                     ← Any custom .woff2 font files
```

**Why `public/assets/` and not `src/assets/`?**
Vite processes files in `src/` (hashes names, runs through bundler). Files in `public/` are copied as-is with their exact filenames. For game assets this is better — you can reference `/assets/sfx/combat/sword_clash.ogg` directly in `AudioSystem.js` without importing, and swapping a file is as simple as replacing it on disk. No rebuild needed for asset-only changes.

**Current state:** The folder exists but is empty. All drawing is done in canvas code. Assets are added folder by folder as systems are built in future work.

---

## Phase 1 — Foundation (Config + Event Bus)
**Goal:** Extract all data. Install mitt. Game still runs from App.jsx untouched.

### Files to create:
- `src/config/constants.js` — V_WIDTH, V_HEIGHT, WALL_Y, BATTLE_LINE_Y, SLOT_OFFSETS
- `src/config/colors.js` — COLORS object
- `src/config/units.js` — UNIT_TYPES
- `src/config/barracks.js` — BARRACKS_DEFS, BARRACKS_LAYOUT
- `src/config/campaign.js` — CAMPAIGN_MAP, ENEMY_COSTS
- `src/config/progression.js` — PERMANENT_TECHS, HEIRLOOMS
- `src/core/EventBus.js` — mitt singleton
- `src/core/utils.js` — generateId, getCost, getSquadCap, lineCircleCollide
- `src/core/GameState.js` — createInitialState() that returns the full state object

### What changes in App.jsx:
Replace all the constant declarations at the top with imports. Nothing else.

### What you test:
Open the game. Play a wave. Everything should work identically. If something breaks, it is an import path error, not a logic error.

### Assets step:
Create the empty folder structure in `public/assets/` now so it is ready. Add a `.gitkeep` file inside each empty subfolder so git tracks them. No files go in here yet — the canvas renderer still draws everything in code.

```
public/assets/sprites/player/.gitkeep
public/assets/sprites/enemy/.gitkeep
public/assets/sfx/combat/.gitkeep
public/assets/sfx/ui/.gitkeep
public/assets/sfx/ambient/.gitkeep
public/assets/music/.gitkeep
public/assets/ui/.gitkeep
public/assets/fonts/.gitkeep
```
Create `src/styles/base.css`. Move the `custom-scrollbar` style out of the `<style>` dangerouslySetInnerHTML tag at the bottom of App.jsx and into this file. Import it in `main.jsx`.

---

## Phase 2 — Systems Extraction
**Goal:** Move all game logic out of the useEffect into system files.

### Files to create (one at a time, test after each):

**`src/systems/SpawnSystem.js`**
```js
// exports: spawnUnit(s, typeKey, team, x, y, metaRef)
// exports: addParticle(s, x, y, color, count, speed)
```

**`src/systems/GuardSystem.js`**
```js
// exports: recalculateGuards(s, bKey)
```

**`src/systems/WaveSystem.js`**
```js
// exports: generateWave(waveNum)
// exports: tickWaveState(s, dt, spawnUnit, setUiTick)
```

**`src/systems/BarracksSystem.js`**
```js
// exports: tickBarracks(s, dt, metaRef, spawnUnit)
```

**`src/systems/CombatSystem.js`**
```js
// exports: findTarget(unit, targetList)
// exports: performAttack(unit, target, s, metaRef)
```

**`src/systems/MovementSystem.js`**
```js
// exports: calculateVelocity(unit, target, closestSq, engageDist, s, now)
// exports: applySeparation(unit, allies, newX, newY, dt)
```

**`src/systems/ProjectileSystem.js`**
```js
// exports: tickProjectiles(s, dt)
```

**`src/systems/SpellSystem.js`**
```js
// exports: tickFoxFires(s, dt)
// exports: tickDragonWaves(s, dt)
// exports: triggerThunder(s)
// exports: triggerFoxFire(s)
// exports: triggerDragonWave(s)
// exports: triggerWarDrums(s)
// exports: triggerHarvest(s)
// exports: triggerResolve(s)
```

**`src/systems/RewardSystem.js`**
```js
// exports: processUnitDeath(u, s, bgCtx, metaRef)
```

**`src/systems/ParticleSystem.js`**
```js
// exports: tickParticles(s, dt)
// exports: tickInkLine(s, dt)
```

### How to migrate safely:
For each system file, copy the function out of App.jsx, paste it into the new file, add the export, then in App.jsx replace the inline code with a call to the imported function. Test immediately after each one.

### Event bus wiring (do this at the END of Phase 2):
After all systems are extracted, wire up the bus emissions:

| Event | Emitted from | Listened in |
|---|---|---|
| `GAME_STATE_CHANGED` | WaveSystem, RewardSystem | App.jsx (triggers setUiTick) |
| `KOKU_CHANGED` | RewardSystem, SpellSystem, BarracksSystem | EconomyHeader |
| `UNIT_DIED` | RewardSystem | ResultScreens (honor counter) |
| `WAVE_CHANGED` | WaveSystem | WaveHUD |
| `SCREEN_SHAKE` | CombatSystem, SpellSystem | GameRenderer |

---

## Phase 3 — Renderer Extraction
**Goal:** Move all canvas drawing out of the useEffect into renderer files.

### Files to create:

**`src/renderer/drawUnits.js`**
```js
// exports: drawUnitTopDown(ctx, unit, now)
```
This is the big one (~200 lines). Move the entire drawUnitTopDown function here verbatim. No changes needed, just move it.

**`src/renderer/drawBackground.js`**
```js
// exports: drawBackground(ctx, s, now)
// Contains: inkLine, wall, gate, barracks buildings, battle line dashes
```

**`src/renderer/drawEffects.js`**
```js
// exports: drawEffects(ctx, s)
// Contains: lightning, dragonWaves, explosions, projectiles, slashTrails, particles, floatingTexts
```

**`src/renderer/GameRenderer.js`**
```js
// exports: drawGame(fgCtx, bgCtx, s, dt, now, metaRef)
// Orchestrates: foxFire overlay, screenShake, drawBackground, drawEffects, drawUnits
```

### Key rule:
The renderer files receive `ctx` and `s` (state) as parameters. They never import `state.current` directly. This is what makes them portable to React Native later — you swap the canvas API for a different drawing API, the logic stays identical.

---

## Phase 4 — UI Component Splitting
**Goal:** Break the JSX blob into proper React components.

### Order to split (bottom-up, easiest first):

1. **`src/ui/panels/EconomyHeader.jsx`** — The sticky top bar with koku and army count. Receives `koku`, `activeTroops`, `maxTroops` as props.

2. **`src/ui/panels/SpellShrine.jsx`** — The 3 spell buttons + hero unlock. Receives `s`, `meta`, spell trigger callbacks.

3. **`src/ui/panels/TacticalCommand.jsx`** — War drums, harvest, resolve buttons.

4. **`src/ui/panels/BarracksCard.jsx`** — Single barracks row. Receives `bKey`, `s`, `meta`, `changeQuota`, `onBuild`, etc. Handles its own collapsed/expanded state.

5. **`src/ui/panels/CommandPanel.jsx`** — Assembles EconomyHeader + all BarracksCards + TacticalCommand + SpellShrine.

6. **`src/ui/screens/ResultScreens.jsx`** — GAMEOVER, REGION_VICTORY, CAMPAIGN_OVER overlays. Pure display, receives state + callbacks.

7. **`src/ui/screens/CombatScreen.jsx`** — Canvas wrapper + wave HUD + ResultScreens. Manages pointer events.

8. **`src/ui/map/WarCampPanel.jsx`** — Left panel on map screen.

9. **`src/ui/map/MapArea.jsx`** — SVG lines + region node buttons.

10. **`src/ui/screens/MapScreen.jsx`** — Assembles WarCampPanel + MapArea.

### After splitting:
App.jsx becomes a pure router:
```jsx
export default function App() {
  const { meta, setMeta } = useMeta()
  const gameState = ...

  if (gameState === 'MAP_SCREEN') return <MapScreen meta={meta} setMeta={setMeta} />
  return <CombatScreen meta={meta} setMeta={setMeta} />
}
```

---

## Phase 5 — Hooks, CSS, Mobile Prep
**Goal:** Clean up the loop. Separate all CSS. Add mobile viewport.

### `src/hooks/useGameLoop.js`
Extract the entire rAF loop out of the useEffect in App.jsx:
```js
export function useGameLoop(state, fgCanvasRef, bgCanvasRef, metaRef, deps) {
  useEffect(() => {
    let animationFrameId
    const loop = (time) => {
      // dt calc
      // updateGame(dt, s, now)
      // drawGame(fgCtx, bgCtx, s, dt, now, metaRef)
      animationFrameId = requestAnimationFrame(loop)
    }
    animationFrameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animationFrameId)
  }, deps)
}
```

### `src/hooks/useMeta.js`
Extract the meta state + metaRef pattern:
```js
export function useMeta() {
  const [meta, setMeta] = useState({ honor: 0, ... })
  const metaRef = useRef(meta)
  useEffect(() => { metaRef.current = meta }, [meta])
  return { meta, setMeta, metaRef }
}
```

### `src/input/InputHandler.js`
Extract getCanvasPos, handlePointerDown, handlePointerMove, handlePointerUp into a class or plain functions. The handlers receive `(e, state, metaRef, spawnUnit, armedSpell, setArmedSpell)`.

### CSS Separation:
Move Tailwind's arbitrary values that repeat into CSS variables in `base.css`:
```css
/* src/styles/base.css */
:root {
  --color-parchment: #dfd4ba;
  --color-ink: #1b1918;
  --color-vermilion: #b84235;
  --color-navy: #2b3d60;
  --color-khaki: #8b8574;
  --color-jade: #4a5d23;
  --color-gold: #d4af37;
}
```

**CSS files and what goes in each:**
- `base.css` — CSS variables, body, font-face, scrollbar styles
- `map.css` — MapScreen layout, node animations, connection lines
- `combat.css` — Canvas wrapper, wave HUD position
- `panels.css` — CommandPanel, button states, barracks card
- `animations.css` — Custom keyframes not covered by Tailwind

### Mobile viewport (index.html):
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
```

### Mobile layout prep in CombatScreen:
The current layout is `flex-row` (canvas left, panel right). For mobile, this needs to become `flex-col` (canvas top, panel bottom as a drawer). Add a `data-layout` attribute so you can target it in CSS later:
```jsx
<div className="combat-layout" data-mobile={isMobile}>
```
No need to fully implement mobile layout now. Just set up the CSS class structure so it is ready.

---

## Phase-by-Phase Summary

| Phase | What moves | Risk | Game broken? |
|---|---|---|---|
| 1 — Config | Constants, data objects, utils | Very low | No |
| 2 — Systems | All game logic (updateGame) | Medium | Only if import wrong |
| 3 — Renderer | All canvas drawing (drawGame) | Low | Only if ctx reference breaks |
| 4 — UI | All JSX components | Low | Only if prop drilling breaks |
| 5 — Polish | Hooks, CSS, mobile prep | Very low | No |

---

## Rules For Each Prompt Session

Since this cannot be done in one session, follow this discipline:

1. **One phase per session** — do not mix phases
2. **Always start a session by reading the current App.jsx** — do not work from memory
3. **Move code, do not rewrite it** — copy the exact logic, change only imports/exports
4. **Test after every file** — if Phase 2 breaks on SpawnSystem, fix it before moving to CombatSystem
5. **Keep the old code commented out in App.jsx** until the new file is confirmed working, then delete it

---

## Things NOT in this Plan (Future Work)

- **Sound system** — `AudioSystem.js` in `systems/`, plays files from `public/assets/sfx/` and `public/assets/music/`
- **Sprite system** — `SpriteSystem.js` in `systems/`, loads spritesheets from `public/assets/sprites/`. The renderer swaps from canvas-drawn shapes to image draws. The rest of the code does not change.
- **Animations** — per-unit animation data lives in `config/units.js` as frame indices. `SpriteSystem.js` reads them.
- **Save/load to localStorage** — will go in `core/Persistence.js`
- **React Native conversion** — Phase 3 (renderer) is the preparation. When the time comes, `GameRenderer.js` and `drawUnits.js` get a React Native Canvas equivalent. Systems and configs are untouched.
- **TypeScript migration** — possible after all 5 phases are done; add JSDoc types as a middle step
