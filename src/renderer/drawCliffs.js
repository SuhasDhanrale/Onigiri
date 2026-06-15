import { V_WIDTH, V_HEIGHT } from '../config/constants.js';
import { COLORS } from '../config/colors.js';

// Inner edges of the side cliffs. Kept at the play boundary so the rock walls fill
// the letterboxed side margins without covering the combat strip (units live in [50, 1150]).
const LEFT_EDGE = 20;
const RIGHT_EDGE = V_WIDTH - 20;

// Built once at module load so the rock geometry stays static (no per-frame jitter).
const CLIFF = buildCliffs();

function buildCliffs() {
  const data = { layers: [], strokes: [], sparseLines: [], cracks: [], dots: [] };

  const createLayer = (isLeft, edgeX, color, lineW, strokeColor) => {
    const points = [];
    const outX = isLeft ? -2000 : V_WIDTH + 2000;
    points.push({ x: outX, y: -2000 });
    points.push({ x: edgeX, y: -2000 });
    let y = -2000;
    while (y < V_HEIGHT + 2000) {
      y += 30 + Math.random() * 80; // craggy jagged steps
      points.push({ x: edgeX + (Math.random() * 50 - 25), y });
    }
    points.push({ x: outX, y: V_HEIGHT + 2000 });
    data.layers.push({ points, color, lineW, strokeColor });
  };

  // Widest (base) to deepest; the 0.15 washes stack into a Sumi-e gradient toward the screen edge.
  createLayer(true, LEFT_EDGE,        'rgba(122, 115, 109, 0.15)', 3, COLORS.inkDark);
  createLayer(true, LEFT_EDGE - 80,   'rgba(122, 115, 109, 0.15)', 2, COLORS.ink);
  createLayer(true, LEFT_EDGE - 160,  'rgba(122, 115, 109, 0.15)', 2, COLORS.inkLight);
  createLayer(true, LEFT_EDGE - 240,  'rgba(122, 115, 109, 0.15)', 1, 'rgba(122, 115, 109, 0.5)');
  createLayer(false, RIGHT_EDGE,       'rgba(122, 115, 109, 0.15)', 3, COLORS.inkDark);
  createLayer(false, RIGHT_EDGE + 80,  'rgba(122, 115, 109, 0.15)', 2, COLORS.ink);
  createLayer(false, RIGHT_EDGE + 160, 'rgba(122, 115, 109, 0.15)', 2, COLORS.inkLight);
  createLayer(false, RIGHT_EDGE + 240, 'rgba(122, 115, 109, 0.15)', 1, 'rgba(122, 115, 109, 0.5)');

  const addStrokes = (isLeft, edgeX, count, depth) => {
    for (let i = 0; i < count; i++) {
      const sx = isLeft ? edgeX - Math.random() * depth : edgeX + Math.random() * depth;
      const sy = -500 + Math.random() * (V_HEIGHT + 1000);
      const len = 30 + Math.random() * 80;
      data.strokes.push({ sx, sy, cx: sx + (Math.random() * 10 - 5), cy: sy + len / 2, ex: sx + (Math.random() * 20 - 10), ey: sy + len });
    }
  };
  addStrokes(true, LEFT_EDGE, 60, 250);
  addStrokes(false, RIGHT_EDGE, 60, 250);

  const addSparse = (isLeft, edgeX, count) => {
    const maxDist = 2000;
    for (let i = 0; i < count; i++) {
      const dist = 200 + Math.pow(Math.random(), 1.2) * (maxDist - 200); // faint texture, far outward
      const sx = isLeft ? edgeX - dist : edgeX + dist;
      const sy = -500 + Math.random() * (V_HEIGHT + 1000);
      const len = 10 + Math.random() * 25;
      data.sparseLines.push({ sx, sy, cx: sx + (Math.random() * 6 - 3), cy: sy + len / 2, ex: sx + (Math.random() * 8 - 4), ey: sy + len });
    }
  };
  addSparse(true, LEFT_EDGE, 150);
  addSparse(false, RIGHT_EDGE, 150);

  const addCracks = (isLeft, edgeX, count, depth) => {
    for (let i = 0; i < count; i++) {
      let cx = isLeft ? edgeX - Math.random() * depth : edgeX + Math.random() * depth;
      let cy = -500 + Math.random() * (V_HEIGHT + 1000);
      const pts = [{ x: cx, y: cy }];
      const segs = 3 + Math.floor(Math.random() * 5);
      for (let j = 0; j < segs; j++) {
        cx += Math.random() * 40 - 20;
        cy += 20 + Math.random() * 40;
        pts.push({ x: cx, y: cy });
      }
      data.cracks.push({ points: pts, lineW: 1 + Math.random() * 2 });
    }
  };
  addCracks(true, LEFT_EDGE, 15, 250);
  addCracks(false, RIGHT_EDGE, 15, 250);

  for (let i = 0; i < 70; i++) {
    const isLeft = Math.random() > 0.5;
    const edgeX = isLeft ? LEFT_EDGE : RIGHT_EDGE;
    const dx = isLeft ? edgeX - Math.random() * 250 : edgeX + Math.random() * 250;
    const dy = -500 + Math.random() * (V_HEIGHT + 1000);
    data.dots.push({ x: dx, y: dy, r: 0.5 + Math.random() * 2.5 });
  }

  return data;
}

// Distant Sumi-e rock walls that frame the arena. Call this in the background layer
// (behind units, wall and the wave ink-line) so nothing on the battlefield gets hidden.
export function drawCliffs(ctx) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  CLIFF.layers.forEach(layer => {
    ctx.fillStyle = layer.color;
    ctx.strokeStyle = layer.strokeColor;
    ctx.lineWidth = layer.lineW;
    ctx.beginPath();
    layer.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  ctx.strokeStyle = COLORS.inkDark;
  ctx.lineWidth = 1.5;
  CLIFF.strokes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.sx, s.sy);
    ctx.quadraticCurveTo(s.cx, s.cy, s.ex, s.ey);
    ctx.stroke();
  });

  ctx.strokeStyle = COLORS.inkLight;
  ctx.lineWidth = 1.0;
  CLIFF.sparseLines.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.sx, s.sy);
    ctx.quadraticCurveTo(s.cx, s.cy, s.ex, s.ey);
    ctx.stroke();
  });

  ctx.strokeStyle = COLORS.ink;
  CLIFF.cracks.forEach(c => {
    ctx.lineWidth = c.lineW;
    ctx.beginPath();
    c.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  });

  ctx.fillStyle = COLORS.inkDark;
  CLIFF.dots.forEach(d => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
