import { useEffect, useRef } from 'react';
import { useCardCanvas } from '../useCardCanvas.js';
import { drawGame } from '../../renderer/GameRenderer.js';
import { spawnUnit } from '../../systems/SpawnSystem.js';
import { V_WIDTH, V_HEIGHT, WALL_Y } from '../../config/constants.js';
import { COLORS } from '../../config/colors.js';
import { metaPresets, getPreset } from '../presets.js';

// Fidelity demo: draws a static roster through the game's REAL renderer
// (drawGame), in its REAL logical coords (V_WIDTH x V_HEIGHT), using units
// built by the REAL spawnUnit(). Toggle "BOSS CAVE" to see drawCave() too.
const PLAYER_ROSTER = ['HATAMOTO', 'YUMI', 'CAVALRY', 'HOROKU', 'CHAMPION'];
const ENEMY_ROSTER = ['REBEL', 'TENGU', 'ONMYOJI', 'SHINOBI', 'ONI'];
const LANE_X = [150, 370, 590, 810, 1030];

export const BattlefieldMock = ({ presetId, resetToken, state }) => {
  const stateRef = useRef(null);
  const metaRef = useRef(null);
  const mode = state?.mode ?? 'skirmish';

  useEffect(() => {
    const preset = getPreset(metaPresets, presetId);
    const { meta, combat } = preset.create();
    metaRef.current = meta;

    if (mode === 'skirmish') {
      combat.cave = null;
      combat.orb = null;
    }

    PLAYER_ROSTER.forEach((type, i) => {
      spawnUnit(combat, type, 'player', LANE_X[i], WALL_Y - 60, metaRef);
    });
    ENEMY_ROSTER.forEach((type, i) => {
      spawnUnit(combat, type, 'enemy', LANE_X[i], 260, metaRef);
    });

    stateRef.current = combat;
  }, [presetId, resetToken, mode]);

  const canvasRef = useCardCanvas(
    (ctx, t, dtFrames) => {
      const s = stateRef.current;
      if (!s) return;
      drawGame(ctx, s, dtFrames, performance.now(), metaRef);
    },
    { logicalW: V_WIDTH, logicalH: V_HEIGHT },
  );

  return <canvas ref={canvasRef} className="block h-full w-full" style={{ background: COLORS.parchment }} />;
};

export const BattlefieldControls = ({ state, setState, reset }) => {
  const mode = state?.mode ?? 'skirmish';
  return (
    <div className="flex rounded-lg bg-white/10 p-1">
      {[
        { id: 'skirmish', label: 'SKIRMISH' },
        { id: 'boss', label: 'BOSS CAVE' },
      ].map(({ id, label }) => (
        <button
          key={id}
          onClick={() => { setState((prev) => ({ ...prev, mode: id })); reset(); }}
          className={`rounded-md px-3 py-1.5 text-[10px] font-black tracking-widest ${
            mode === id ? 'bg-[#feca57] text-zinc-800' : 'text-white/60 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
