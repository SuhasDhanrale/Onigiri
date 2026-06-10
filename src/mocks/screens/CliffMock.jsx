import { useEffect, useRef } from 'react';
import { useCardCanvas } from '../useCardCanvas.js';
import { V_WIDTH, V_HEIGHT } from '../../config/constants.js';
import { COLORS } from '../../config/colors.js';
import { BARRACKS_LAYOUT } from '../../config/barracks.js';

export const CliffControls = ({ state, setState }) => {
  const setLeft = (e) => setState({ ...state, leftEdge: Number(e.target.value) });
  const setRight = (e) => setState({ ...state, rightEdge: Number(e.target.value) });

  return (
    <div className="flex gap-4 items-center">
      <label className="text-xs font-bold text-white/70">
        Left Edge: {state.leftEdge || 60}
        <input type="range" min="0" max="300" value={state.leftEdge || 60} onChange={setLeft} className="ml-2" />
      </label>
      <label className="text-xs font-bold text-white/70">
        Right Edge: {state.rightEdge || 1140}
        <input type="range" min="900" max="1200" value={state.rightEdge || 1140} onChange={setRight} className="ml-2" />
      </label>
    </div>
  );
};

export const CliffMock = ({ state }) => {
  const cliffDataRef = useRef({ layers: [], strokes: [], dots: [] });

  const leftEdge = state.leftEdge ?? 60;
  const rightEdge = state.rightEdge ?? 1140;

  useEffect(() => {
    // Generate cliffs when edges change
    const data = { layers: [], strokes: [], dots: [], cracks: [], sparseLines: [] };
    
    const createLayer = (isLeft, edgeX, color, lineW, strokeColor) => {
      const points = [];
      const outX = isLeft ? -2000 : V_WIDTH + 2000;
      
      points.push({ x: outX, y: -2000 });
      points.push({ x: edgeX, y: -2000 });
      
      let y = -2000;
      while (y < V_HEIGHT + 2000) {
        y += 30 + Math.random() * 80;
        const x = edgeX + (Math.random() * 50 - 25);
        points.push({ x, y });
      }
      
      points.push({ x: outX, y: V_HEIGHT + 2000 });
      data.layers.push({ points, color, lineW, isLeft, strokeColor });
    };

    // Draw from WIDEST (base) to NARROWEST (deepest) so they stack.
    // The opacity stacks as we draw inward, creating a beautiful natural Sumi-e wash gradient!
    
    // Left layers
    createLayer(true, leftEdge, 'rgba(122, 115, 109, 0.15)', 3, COLORS.inkDark);
    createLayer(true, leftEdge - 80, 'rgba(122, 115, 109, 0.15)', 2, COLORS.ink);
    createLayer(true, leftEdge - 160, 'rgba(122, 115, 109, 0.15)', 2, COLORS.inkLight);
    createLayer(true, leftEdge - 240, 'rgba(122, 115, 109, 0.15)', 1, 'rgba(122, 115, 109, 0.5)');

    // Right layers
    createLayer(false, rightEdge, 'rgba(122, 115, 109, 0.15)', 3, COLORS.inkDark);
    createLayer(false, rightEdge + 80, 'rgba(122, 115, 109, 0.15)', 2, COLORS.ink);
    createLayer(false, rightEdge + 160, 'rgba(122, 115, 109, 0.15)', 2, COLORS.inkLight);
    createLayer(false, rightEdge + 240, 'rgba(122, 115, 109, 0.15)', 1, 'rgba(122, 115, 109, 0.5)');

    const addStrokes = (isLeft, baseEdgeX, depth) => {
      for (let i = 0; i < 80; i++) {
        const sx = isLeft ? baseEdgeX - Math.random() * depth : baseEdgeX + Math.random() * depth;
        const sy = -500 + Math.random() * (V_HEIGHT + 1000);
        const len = 30 + Math.random() * 80;
        const cx = sx + (Math.random() * 10 - 5);
        const cy = sy + len / 2;
        const ex = sx + (Math.random() * 20 - 10);
        const ey = sy + len;
        data.strokes.push({ sx, sy, cx, cy, ex, ey });
      }
    };
    addStrokes(true, leftEdge, 250);
    addStrokes(false, rightEdge, 250);

    const addCracks = (isLeft, baseEdgeX, depth) => {
      for (let i = 0; i < 20; i++) {
        const startX = isLeft ? baseEdgeX - Math.random() * depth : baseEdgeX + Math.random() * depth;
        const startY = -500 + Math.random() * (V_HEIGHT + 1000);
        const crack = [];
        let cx = startX;
        let cy = startY;
        crack.push({x: cx, y: cy});
        const segments = 3 + Math.floor(Math.random() * 5);
        for(let j=0; j<segments; j++) {
           cx += (Math.random() * 40 - 20);
           cy += 20 + Math.random() * 40;
           crack.push({x: cx, y: cy});
        }
        data.cracks.push({ points: crack, lineW: 1 + Math.random() * 2 });
      }
    };
    addCracks(true, leftEdge, 250);
    addCracks(false, rightEdge, 250);

    const addSparseLines = (isLeft, baseEdgeX) => {
      const maxDist = 2000;
      for (let i = 0; i < 250; i++) {
        // Start from depth 200 and go way outwards
        const dist = 200 + Math.pow(Math.random(), 1.2) * (maxDist - 200);
        const sx = isLeft ? baseEdgeX - dist : baseEdgeX + dist;
        const sy = -500 + Math.random() * (V_HEIGHT + 1000);
        const len = 10 + Math.random() * 25; // "very small, small lines"
        const cx = sx + (Math.random() * 6 - 3);
        const cy = sy + len / 2;
        const ex = sx + (Math.random() * 8 - 4);
        const ey = sy + len;
        data.sparseLines.push({ sx, sy, cx, cy, ex, ey });
      }
    };
    addSparseLines(true, leftEdge);
    addSparseLines(false, rightEdge);

    for (let i = 0; i < 80; i++) {
      const isLeft = Math.random() > 0.5;
      const baseEdgeX = isLeft ? leftEdge : rightEdge;
      const dx = isLeft ? baseEdgeX - Math.random() * 250 : baseEdgeX + Math.random() * 250;
      const dy = -500 + Math.random() * (V_HEIGHT + 1000);
      data.dots.push({ x: dx, y: dy, r: 0.5 + Math.random() * 2.5 });
    }
    
    cliffDataRef.current = data;
  }, [leftEdge, rightEdge]);

  const draw = (ctx) => {
    // Fill physical bounds to test aspect ratio
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();

    // Draw Barrack Proxies
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    Object.values(BARRACKS_LAYOUT).forEach(layout => {
       ctx.beginPath();
       ctx.rect(layout.x - 90, layout.y - 75, 180, 150);
       ctx.fill();
       ctx.stroke();
    });
    
    // Draw Center Line to help balance
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(V_WIDTH/2, 0);
    ctx.lineTo(V_WIDTH/2, V_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Cliffs
    const data = cliffDataRef.current;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    data.layers.forEach(layer => {
      ctx.fillStyle = layer.color;
      ctx.strokeStyle = layer.strokeColor || COLORS.inkDark;
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

    ctx.strokeStyle = COLORS.inkDark;
    ctx.lineWidth = 1.5;
    data.strokes.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.sx, s.sy);
      ctx.quadraticCurveTo(s.cx, s.cy, s.ex, s.ey);
      ctx.stroke();
    });

    ctx.strokeStyle = COLORS.inkLight;
    ctx.lineWidth = 1.0;
    data.sparseLines.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.sx, s.sy);
      ctx.quadraticCurveTo(s.cx, s.cy, s.ex, s.ey);
      ctx.stroke();
    });

    data.cracks.forEach(c => {
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = c.lineW;
      ctx.beginPath();
      c.points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    });

    ctx.fillStyle = COLORS.inkDark;
    data.dots.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const canvasRef = useCardCanvas(draw, { logicalW: V_WIDTH, logicalH: V_HEIGHT });
  return <canvas ref={canvasRef} className="block h-full w-full" style={{ background: COLORS.parchment }} />;
};
