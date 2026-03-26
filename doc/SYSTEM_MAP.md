# Shogun Tower Defense — System Map

This is a comprehensive map of all files and their responsibilities within the project.

## 📁 `src/config/` (Static Data)
- `barracks.js`: Layout (X/Y/W/H) and definitions (spawn rate, costs).
- `campaign.js`: Map regions, wave counts, enemy spawn costs, and rewards.
- `colors.js`: Centralized Ukiyo-e theme hex codes.
- `constants.js`: Engine constants (V_WIDTH, V_HEIGHT, WALL_Y).
- `progression.js`: Definitions for permanent techs and heirlooms.
- `units.js`: Unit stats (HP, Damage, Speed, Range, Stance).

## 📁 `src/core/` (Foundational Logic)
- `EventBus.js`: Global singleton for cross-system communication (using `mitt`).
- `GameState.js`: Initial state object factory and guard recalculation.
- `utils.js`: Math helpers (line-circle collision) and ID generation.

## 📁 `src/systems/` (Game Engine Brain)
- `BarracksSystem.js`: Training timers, auto-spawn logic, and building squash anims.
- `CombatSystem.js`: The main loop for unit target-finding and combat engagement.
- `CombatSystem.js`: Main loop for combat.
- `SpawnSystem.js`: Handles creating unit objects and adding them to world state.
- `MovementSystem.js`: Separation physics and unit pathing logic.
- `ProjectileSystem.js`: Ticks arrows and lobbed projectiles.
- `WaveSystem.js`: Manages wave phases (Preparing -> Spawning -> Cleanup).
- `SpellSystem.js`: Logic for Fox Fires, Dragon Waves, and Thunder Strikes.
- `RewardSystem.js`: Processes unit deaths, grants Koku, and draws blood splats.
- `ParticleSystem.js`: Ink drips and floating text movement.
- `GuardSystem.js`: Recalculates unit formation slots.

## 📁 `src/renderer/` (Drawing Logic)
- `GameRenderer.js`: Main entry point for the drawing cycle.
- `drawBackground.js`: Renders static world elements (Wall, Gate, Barracks).
- `drawUnits.js`: Detailed unit rendering (Top-down circles + weapons).
- `drawEffects.js`: Renders projectiles, waves, lightning, and particles.

## 📁 `src/ui/` (Presentation Layer)
- `screens/CombatScreen.jsx`: The main game UI wrapper.
- `screens/MapScreen.jsx`: The strategic war map overlay.
- `screens/ResultScreens.jsx`: Victory and Defeat UI.
- `panels/CommandPanel.jsx`: Sidebar container for recruitment and spells.
- `panels/BarracksCard.jsx`: Individual building UI card.
- `panels/EconomyHeader.jsx`: Sticky treasury and army size HUD.
- `panels/TacticalCommand.jsx`: Buff buttons (War Drums, Harvest).
- `panels/SpellShrine.jsx`: Hero and Spell unlock buttons.

## 📁 `src/hooks/` (Lifecycle & Integration)
- `useGameLoop.js`: Orchestrates the requestAnimationFrame heartbeat and system updates.
- `useMeta.js`: Manages permanent progression state (Honor, Heirlooms).

## 📁 `src/input/` (Interaction)
- `InputHandler.js`: Coordinate mapping and pointer interaction logic.

## 📁 `src/styles/` (Theming)
- `base.css`: Global typography and theme variables.
- `combat.css`: Structural layout for the combat canvas.
- `panels.css`: Sidebar and UI card styling.
