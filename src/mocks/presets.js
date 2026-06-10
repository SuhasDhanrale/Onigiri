// A preset is a named bundle of GAME-STATE-SHAPED data fed to mocks. Each
// `create()` returns `{ meta, combat }`:
//   - `meta`   matches the shape from `src/hooks/useMeta.js` (the persistent
//              player profile — honor, unlocks, equipped item, ...)
//   - `combat` matches `createInitialState()` from `src/core/GameState.js`
//              (the per-battle state — units, cave/orb, barracks, wave, ...)
// Mocks read `combat`/`meta` directly, or pass `meta` to a `metaRef`-style
// ref for renderers that expect `metaRef.current`.
import { createInitialState } from '../core/GameState.js';

const baseMeta = () => ({
  honor: 0,
  unlockedProvisions: [],
  equippedItem: null,
  conqueredRegions: [],
  totalRuns: 0,
  unlockedBarracks: ['HATAMOTO', 'YUMI'],
  focusMult: 1.2,
});

export const metaPresets = [
  {
    id: 'starter',
    label: 'Starter',
    note: 'Fresh dynasty — minimal unlocks, empty battlefield.',
    create: () => ({
      meta: baseMeta(),
      combat: createInitialState(),
    }),
  },
  {
    id: 'veteran',
    label: 'Veteran',
    note: 'All barracks + provisions unlocked, conquered regions — for late-game flows.',
    create: () => ({
      meta: {
        ...baseMeta(),
        honor: 4200,
        unlockedProvisions: ['COMMANDERS_SEAL', 'WAR_CHEST', 'SHOGUNS_DECREE'],
        unlockedBarracks: ['HATAMOTO', 'YUMI', 'CAVALRY', 'HOROKU'],
        conqueredRegions: ['TENGU_PEAKS', 'IRON_MINES'],
        totalRuns: 6,
      },
      combat: createInitialState(),
    }),
  },
];

export const getPreset = (presets, id) =>
  presets.find((preset) => preset.id === id) || presets[0];
