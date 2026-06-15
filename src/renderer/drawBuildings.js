import { drawPath, line, circle, rect } from './canvasShapes.js';

// Keeps the building art below the wall line so its banners/roofs don't intrude
// on the flank Arrow Tower slots (at WALL_Y - 70, above the wall).
const ART_Y_OFFSET = -40;

// Banner pole + flag + kanji glyph, shared by all four buildings.
// dir: -1 (flag/text extend left of the pole) or +1 (extend right).
function drawBanner(ctx, x, y, dir, flagColor, kanji, textColor = '#fff') {
  ctx.save();
  ctx.translate(x, y);
  line(ctx, 0, 100, 0, -80, { stroke: '#2c2a29', width: 4 });
  drawPath(ctx, `M 0 -70 L ${dir * 40} -70 L ${dir * 40} 30 L 0 30 Z`, { fill: flagColor, stroke: '#2c2a29', strokeWidth: 3 });
  ctx.fillStyle = textColor;
  ctx.font = 'bold 24px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(kanji, dir * 20, -10);
  ctx.restore();
}

// HATAMOTO: Sword Dojo
function drawSwordDojo(ctx) {
  drawPath(ctx, 'M -90 90 L -70 20 L 70 20 L 90 90 Z', { fill: '#e8dac1', stroke: '#2c2a29', strokeWidth: 4 });
  drawPath(ctx, 'M -90 90 L -70 20 M -30 90 L -20 20 M 30 90 L 20 20 M 90 90 L 70 20', { stroke: '#5c4a3d', strokeWidth: 6 });
  drawPath(ctx, 'M -120 40 Q 0 -40 120 40 L 140 10 L 80 -80 L -80 -80 L -140 10 Z', { fill: '#2c2a29', stroke: '#1b1918', strokeWidth: 5, lineJoin: 'round' });
  drawPath(ctx, 'M -100 20 Q 0 -50 100 20 M -80 0 Q 0 -60 80 0 M -60 -20 Q 0 -70 60 -20', { stroke: '#4a4847', strokeWidth: 4 });
  drawPath(ctx, 'M -70 -70 L 70 -70 L 80 -90 L -80 -90 Z', { fill: '#b84235', stroke: '#1b1918', strokeWidth: 3 });
  circle(ctx, -80, -80, 10, { fill: '#dfd4ba', stroke: '#1b1918', strokeWidth: 3 });
  circle(ctx, 80, -80, 10, { fill: '#dfd4ba', stroke: '#1b1918', strokeWidth: 3 });
  drawBanner(ctx, -110, -20, -1, '#4a90e2', '剣');
  drawBanner(ctx, 110, -20, 1, '#4a90e2', '剣');
  rect(ctx, -40, -10, 10, 40, { fill: '#8b7355', stroke: '#2c2a29', strokeWidth: 2 });
  rect(ctx, -50, 0, 30, 6, { fill: '#8b7355', stroke: '#2c2a29', strokeWidth: 2 });
  rect(ctx, 30, -10, 10, 40, { fill: '#8b7355', stroke: '#2c2a29', strokeWidth: 2 });
  rect(ctx, 20, 0, 30, 6, { fill: '#8b7355', stroke: '#2c2a29', strokeWidth: 2 });
  drawPath(ctx, 'M -100 90 L 100 90 L 110 110 L -110 110 Z', { fill: '#5c4a3d', stroke: '#2c2a29', strokeWidth: 4 });
}

// YUMI: Archery Range
function drawBowDojo(ctx) {
  drawPath(ctx, 'M -90 90 L -70 20 L 70 20 L 90 90 Z', { fill: '#2c2a29', stroke: '#2c2a29', strokeWidth: 4 });
  circle(ctx, -30, 50, 15, { fill: '#e8dac1', stroke: '#b84235', strokeWidth: 4 });
  circle(ctx, -30, 50, 5, { fill: '#b84235' });
  circle(ctx, 30, 50, 15, { fill: '#e8dac1', stroke: '#b84235', strokeWidth: 4 });
  circle(ctx, 30, 50, 5, { fill: '#b84235' });
  drawPath(ctx, 'M -90 90 L -70 20 M 90 90 L 70 20', { stroke: '#5c4a3d', strokeWidth: 6 });
  drawPath(ctx, 'M -130 30 L 130 30 L 110 -30 L -110 -30 Z', { fill: '#2c2a29', stroke: '#1b1918', strokeWidth: 5 });
  drawPath(ctx, 'M -100 -50 L 100 -50 L 110 -30 L -110 -30 Z', { fill: '#b84235', stroke: '#1b1918', strokeWidth: 3 });
  drawBanner(ctx, -110, -20, -1, '#dfd4ba', '弓', '#2c2a29');
  drawPath(ctx, 'M -100 90 L 100 90 L 110 110 L -110 110 Z', { fill: '#5c4a3d', stroke: '#2c2a29', strokeWidth: 4 });
}

// CAVALRY: Stables
function drawStablesDojo(ctx) {
  drawPath(ctx, 'M -90 90 L -70 20 L 70 20 L 90 90 Z', { fill: '#e8dac1', stroke: '#2c2a29', strokeWidth: 4 });
  drawPath(ctx, 'M -90 90 L -70 20 M -30 90 L -20 20 M 30 90 L 20 20 M 90 90 L 70 20', { stroke: '#5c4a3d', strokeWidth: 6 });
  drawPath(ctx, 'M -110 30 Q 0 -50 110 30 L 90 -40 L -90 -40 Z', { fill: '#dfd4ba', stroke: '#8b7355', strokeWidth: 5 });
  drawPath(ctx, 'M -80 -20 Q 0 -60 80 -20 M -60 -10 Q 0 -40 60 -10', { stroke: '#8b7355', strokeWidth: 3 });
  drawPath(ctx, 'M 50 80 L 140 60 M 60 95 L 140 85', { stroke: '#5c4a3d', strokeWidth: 4 });
  drawPath(ctx, 'M 120 100 L 120 50 M 140 100 L 140 50', { stroke: '#5c4a3d', strokeWidth: 6, lineCap: 'round' });
  drawBanner(ctx, -100, -20, -1, '#8b7355', '馬');
  drawPath(ctx, 'M -100 90 L 100 90 L 110 110 L -110 110 Z', { fill: '#5c4a3d', stroke: '#2c2a29', strokeWidth: 4 });
}

// HOROKU: Powder Mill
function drawPowderMillDojo(ctx) {
  circle(ctx, 80, 70, 15, { fill: '#b84235', stroke: '#2c2a29', strokeWidth: 3 });
  circle(ctx, 105, 75, 15, { fill: '#b84235', stroke: '#2c2a29', strokeWidth: 3 });
  circle(ctx, 95, 50, 15, { fill: '#b84235', stroke: '#2c2a29', strokeWidth: 3 });
  drawPath(ctx, 'M -90 90 L -70 20 L 70 20 L 90 90 Z', { fill: '#4a4847', stroke: '#2c2a29', strokeWidth: 4 });
  drawPath(ctx, 'M -40 20 L -30 -80 L -10 -80 L 0 20 Z', { fill: '#8b7355', stroke: '#2c2a29', strokeWidth: 3 });
  drawPath(ctx, 'M -30 -60 L -10 -60 M -25 -40 L -5 -40', { stroke: '#5c4a3d', strokeWidth: 2 });
  circle(ctx, -20, -90, 15, { fill: '#e8dac1', opacity: 0.8 });
  circle(ctx, -35, -110, 20, { fill: '#e8dac1', opacity: 0.6 });
  circle(ctx, 0, -120, 25, { fill: '#e8dac1', opacity: 0.4 });
  drawPath(ctx, 'M -110 30 L 110 30 L 80 -10 L -80 -10 Z', { fill: '#2c2a29', stroke: '#1b1918', strokeWidth: 5 });
  drawPath(ctx, 'M -90 20 L -70 -10 M -50 20 L -30 -10 M 10 20 L 30 -10 M 50 20 L 70 -10', { stroke: '#4a4847', strokeWidth: 3 });
  drawBanner(ctx, 130, -20, 1, '#b84235', '爆');
  drawPath(ctx, 'M -100 90 L 100 90 L 110 110 L -110 110 Z', { fill: '#2c2a29', stroke: '#1b1918', strokeWidth: 4 });
}

// Draws a barracks' illustrated building art at the origin of the existing layout translate.
export function drawBuildingArt(ctx, key) {
  ctx.save();
  ctx.translate(0, ART_Y_OFFSET);
  switch (key) {
    case 'HATAMOTO': drawSwordDojo(ctx); break;
    case 'YUMI':     drawBowDojo(ctx); break;
    case 'CAVALRY':  drawStablesDojo(ctx); break;
    case 'HOROKU':   drawPowderMillDojo(ctx); break;
    default: break;
  }
  ctx.restore();
}
