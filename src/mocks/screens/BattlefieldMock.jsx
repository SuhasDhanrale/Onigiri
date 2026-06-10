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

// --- STATIC MOCK ENVIRONMENT DATA ---
// Generate cliff geometry ONCE so it remains static (no jitter on re-render).
const CLIFF_DATA = { layers: [], strokes: [], dots: [] };

function generateCliffs() {
  CLIFF_DATA.layers = [];
  CLIFF_DATA.strokes = [];
  CLIFF_DATA.dots = [];

  const createLayer = (isLeft, edgeX, color, lineW) => {
    const points = [];
    const outX = isLeft ? -2000 : V_WIDTH + 2000;
    
    points.push({ x: outX, y: -2000 });
    points.push({ x: edgeX, y: -2000 });
    
    let y = -2000;
    while (y < V_HEIGHT + 2000) {
      y += 40 + Math.random() * 80; // Craggy jagged steps
      const x = edgeX + (Math.random() * 50 - 25);
      points.push({ x, y });
    }
    
    points.push({ x: outX, y: V_HEIGHT + 2000 });
    CLIFF_DATA.layers.push({ points, color, lineW, isLeft });
  };

  // Safe bounds: Left < 110, Right > 1090
  createLayer(true, 50, COLORS.inkLight, 2);
  createLayer(true, 110, COLORS.parchment, 4);

  createLayer(false, V_WIDTH - 50, COLORS.inkLight, 2);
  createLayer(false, V_WIDTH - 110, COLORS.parchment, 4);

  // Sumi-e vertical hatch marks for shading (focused near the edges)
  const addStrokes = (isLeft, edgeX) => {
    for (let i = 0; i < 40; i++) {
      // Spawn strokes near the rock edge (within 100px of the edge)
      const sx = isLeft 
        ? edgeX - Math.random() * 100 
        : edgeX + Math.random() * 100;
      const sy = -500 + Math.random() * (V_HEIGHT + 1000);
      const len = 30 + Math.random() * 80;
      const cx = sx + (Math.random() * 10 - 5);
      const cy = sy + len / 2;
      const ex = sx + (Math.random() * 20 - 10);
      const ey = sy + len;
      CLIFF_DATA.strokes.push({ sx, sy, cx, cy, ex, ey });
    }
  };
  addStrokes(true, 110);
  addStrokes(false, V_WIDTH - 110);

  // Little ink splatter dots (pebbles/texture) focused near the edges
  for (let i = 0; i < 60; i++) {
    const isLeft = Math.random() > 0.5;
    const edgeX = isLeft ? 110 : V_WIDTH - 110;
    const dx = isLeft 
      ? edgeX - Math.random() * 100 
      : edgeX + Math.random() * 100;
    const dy = -500 + Math.random() * (V_HEIGHT + 1000);
    CLIFF_DATA.dots.push({ x: dx, y: dy, r: 0.5 + Math.random() * 2 });
  }
}
generateCliffs();

// Sumi-e style cliffs strictly for visual framing in the mock environment.
const drawMockCliffs = (ctx) => {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Draw Rock Layers
  CLIFF_DATA.layers.forEach(layer => {
    ctx.fillStyle = layer.color;
    ctx.strokeStyle = COLORS.inkDark;
    ctx.lineWidth = layer.lineW;

    ctx.beginPath();
    layer.points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Draw Hatch Shading
  ctx.strokeStyle = COLORS.inkDark;
  ctx.lineWidth = 1.5;
  CLIFF_DATA.strokes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.sx, s.sy);
    ctx.quadraticCurveTo(s.cx, s.cy, s.ex, s.ey);
    ctx.stroke();
  });

  // Draw Dots
  ctx.fillStyle = COLORS.inkDark;
  CLIFF_DATA.dots.forEach(d => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
};

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
      
      // Draw the mock environment overlays (cliffs)
      drawMockCliffs(ctx);
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
