# Shogun Tower Defense — Developer Guide

Welcome to the Shogun Tower Defense codebase. This document is a high-level technical overview of the game's architecture, state management, and core systems.

## 1. High-Level Architecture
The game is built using **Vite + React** for the UI and **HTML5 Canvas** for the real-time game world.

- **Frontend**: React handles the UI overlays, sidebar, and map screens.
- **Engine**: The core simulation runs in a high-frequency `requestAnimationFrame` loop.
- **Systems**: Game logic is decoupled into specialized "System" modules (e.g., `CombatSystem`, `SpawnSystem`).

### Directory Structure
- `src/config/`: Static data (unit stats, costs, layout constants).
- `src/core/`: Central state initialization and core utilities.
- `src/systems/`: The game's brain. Physics, combat, and logic ticks.
- `src/renderer/`: The drawing logic. Multi-layered canvas rendering.
- `src/ui/`: React components for menus, HUD, and panels.
- `src/hooks/`: Custom React hooks (e.g., `useGameLoop`, `useMeta`).

---

## 2. State Management Philosophy
We use a hybrid state approach to balance UI reactivity with engine performance.

### A. The Engine State (`useRef`)
The primary game state lives in a React `useRef` (e.g., `state.current`). This allows the game loop to modify the state Object 60+ times per second without triggering slow React re-renders.
**Key objects inside state:**
- `units`: Array of all active entities (player, enemy, hero).
- `projectiles`: List of active arrows, lobbed shots, etc.
- `particles`: Visual flair (ink drips, blood splats, death effects).
- `timers`: Barracks training countdowns.

### B. The UI State (`useState`)
React's `useState` is used for high-level UI triggers (e.g., `uiTick`). Most sidebar UI components listen to the `EventBus` for high-frequency updates (like Koku changes) to stay decoupled from the core render cycle.

---

## 3. Core Systems (The Brain)
Every frame, the game loop calls several ticking systems:
1. **CombatSystem**: Target finding, damage calculation, and unit engagement.
2. **MovementSystem**: Unit separation physics (anti-clumping) and movement logic.
3. **BarracksSystem**: Handles auto-training timers and building "squash" visuals.
4. **RewardSystem**: Processes dead units, grants Koku/Honor, and draws permanent effects to the **Background Canvas**.

---

## 4. The Rendering Pipeline
We use a **Dual-Canvas** approach:
1. **Background Canvas**: For permanent or slow-changing visuals (Wall, Buildings, Blood Splats, Ink Line wash).
2. **Foreground Canvas**: For units, projectiles, and high-frequency effects.

**Rendering Order:**
1. Clear Foreground.
2. Screenshake / Fever overlays.
3. Ink Line / Wall (Background).
4. Units (Sorted by type/Y-pos).
5. Effects (Dragon Waves, Lightnings, Particles).

---

## 5. Communication (Event Bus)
We use `mitt` as a global event bus (`src/core/EventBus.js`). 
**Examples of use:**
- `KOKU_CHANGED`: Triggered when an enemy dies; the HUD UI updates its display.
- `UNIT_DIED`: Triggered for cleanup or achievement processing.
- `SCREEN_SHAKE`: Triggered by boss stomps or cavalry charges.

---

## 6. How to Extend the Game

### Adding a New Unit
1. Define the unit stats in `src/config/units.js`.
2. Update `src/renderer/drawUnits.js` to add a unique drawing routine or sprite mapping.
3. (Optional) Define a recruitment cost in `src/config/barracks.js`.

### Adding a New Map Region
1. Update `src/config/campaign.js` with the new region's name, waves, and rewards.
2. Update the node coordinates in `src/ui/map/MapArea.jsx`.

---

## Tips for Developers
- **Avoid React State in the Loop**: If you need to track something that changes every frame, put it in `state.current` (Ref), not `useState`.
- **Z-Index**: Units are sorted by flying status then Y-coordinate. Ground units are drawn first, flying units last.
- **Delta Time (dt)**: Always use `dt` for physics/timer updates to ensure the game runs at the same speed regardless of frame rate.

Happy Coding, Shogun!
