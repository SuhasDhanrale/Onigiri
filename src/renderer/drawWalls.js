import { V_WIDTH, WALL_Y, WALL_FACE_Y } from '../config/constants.js';
import { WALL_LEVELS } from '../config/walls.js';
import { drawPath, line, circle, rect } from './canvasShapes.js';

// Deterministic pseudo-random in [0, 1) so bamboo sticks/logs don't jitter every frame.
function seededRandom(seed) {
  const v = Math.sin(seed * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

// LEVEL 1: Bamboo Wall
function drawBambooWall(ctx, y) {
  const renderSegment = (startX, endX) => {
    line(ctx, startX, y + 20, endX, y + 20, { stroke: '#2c2a29', width: 20, opacity: 0.2 });
    const supportCount = Math.max(1, Math.floor((endX - startX) / 120));
    for (let i = 0; i < supportCount; i++) {
      const sx = startX + 60 + i * 120;
      if (sx > endX - 20) continue;
      line(ctx, sx, y - 30, sx + 20, y + 80, { stroke: '#5c4a3d', width: 8, cap: 'round' });
    }
    line(ctx, startX, y - 20, endX, y - 20, { stroke: '#5c4a3d', width: 10 });
    line(ctx, startX, y - 45, endX, y - 45, { stroke: '#5c4a3d', width: 10 });
    const tieCount = Math.max(1, Math.floor((endX - startX) / 30));
    for (let i = 0; i < tieCount; i++) {
      const cx = startX + 15 + i * 30;
      circle(ctx, cx, y - 20, 4, { fill: '#2c2a29' });
      circle(ctx, cx, y - 45, 4, { fill: '#2c2a29' });
    }
  };

  renderSegment(-50, 300);
  renderSegment(450, 750);
  renderSegment(900, V_WIDTH + 50);

  for (let x = -50; x < V_WIDTH + 50; x += 15) {
    if ((x > 300 && x < 450) || (x > 750 && x < 900)) continue;
    const heightOffset = seededRandom(x) * 20 - 10;
    const xOffset = seededRandom(x + 1) * 6 - 3;
    line(ctx, x, y + 20, x + xOffset, y - 60 + heightOffset, { stroke: '#8b7355', width: 6, cap: 'round' });
  }

  line(ctx, 300, y + 20, 300, y - 100, { stroke: '#2c2a29', width: 16, cap: 'round' });
  line(ctx, 450, y + 20, 450, y - 100, { stroke: '#2c2a29', width: 16, cap: 'round' });
  line(ctx, 750, y + 20, 750, y - 100, { stroke: '#2c2a29', width: 16, cap: 'round' });
  line(ctx, 900, y + 20, 900, y - 100, { stroke: '#2c2a29', width: 16, cap: 'round' });
  line(ctx, 280, y - 80, 470, y - 80, { stroke: '#2c2a29', width: 12, cap: 'round' });
  line(ctx, 730, y - 80, 920, y - 80, { stroke: '#2c2a29', width: 12, cap: 'round' });
  line(ctx, 280, y - 60, 470, y - 60, { stroke: '#5c4a3d', width: 6, cap: 'round' });
  line(ctx, 730, y - 60, 920, y - 60, { stroke: '#5c4a3d', width: 6, cap: 'round' });
}

// LEVEL 2: Wooden Wall
function drawWoodenWall(ctx, y) {
  for (let x = -50; x < V_WIDTH + 50; x += 25) {
    if ((x > 300 && x < 450) || (x > 750 && x < 900)) continue;
    const heightOffset = seededRandom(x) * 10;
    line(ctx, x, y + 20, x, y - 80 + heightOffset, { stroke: '#5c4a3d', width: 22 });
    drawPath(ctx, `M ${x - 11} ${y - 80 + heightOffset} L ${x} ${y - 100 + heightOffset} L ${x + 11} ${y - 80 + heightOffset} Z`, { fill: '#5c4a3d' });
  }

  const renderSegment = (startX, endX) => {
    line(ctx, startX, y + 20, endX, y + 20, { stroke: '#2c2a29', width: 25, opacity: 0.3 });
    const supportCount = Math.max(1, Math.floor((endX - startX) / 120));
    for (let i = 0; i < supportCount; i++) {
      const sx = startX + 60 + i * 120;
      if (sx > endX - 30) continue;
      line(ctx, sx, y - 40, sx + 30, y + 80, { stroke: '#4a3830', width: 16, cap: 'round' });
    }
    line(ctx, startX, y - 30, endX, y - 30, { stroke: '#4a3830', width: 14 });
    line(ctx, startX, y - 60, endX, y - 60, { stroke: '#4a3830', width: 14 });
  };

  renderSegment(-50, 300);
  renderSegment(450, 750);
  renderSegment(900, V_WIDTH + 50);

  line(ctx, 300, y + 20, 300, y - 120, { stroke: '#2c2a29', width: 24 });
  line(ctx, 450, y + 20, 450, y - 120, { stroke: '#2c2a29', width: 24 });
  line(ctx, 750, y + 20, 750, y - 120, { stroke: '#2c2a29', width: 24 });
  line(ctx, 900, y + 20, 900, y - 120, { stroke: '#2c2a29', width: 24 });
  line(ctx, 280, y - 110, 470, y - 110, { stroke: '#2c2a29', width: 20 });
  line(ctx, 730, y - 110, 920, y - 110, { stroke: '#2c2a29', width: 20 });
  line(ctx, 290, y - 90, 460, y - 90, { stroke: '#5c4a3d', width: 10 });
  line(ctx, 740, y - 90, 910, y - 90, { stroke: '#5c4a3d', width: 10 });
}

// LEVEL 3: Stone Wall
function drawStoneWall(ctx, y) {
  const renderSegment = (startX, endX) => {
    line(ctx, startX, y + 30, endX, y + 30, { stroke: '#2c2a29', width: 30, opacity: 0.4 });
    // Stone base (Ishigaki)
    rect(ctx, startX, y - 20, endX - startX, 40, { fill: '#696866', stroke: '#2c2a29', strokeWidth: 4 });
    // Plaster wall (Shirokabe)
    rect(ctx, startX, y - 80, endX - startX, 60, { fill: '#e8dac1', stroke: '#2c2a29', strokeWidth: 4 });
    const beamCount = Math.floor((endX - startX) / 60);
    for (let i = 0; i < beamCount; i++) {
      const bx = startX + i * 60 + 30;
      line(ctx, bx, y - 20, bx, y - 80, { stroke: '#2c2a29', width: 4 });
    }
    line(ctx, startX - 10, y - 80, endX + 10, y - 80, { stroke: '#4a4847', width: 10 });
    line(ctx, startX - 10, y - 85, endX + 10, y - 85, { stroke: '#2c2a29', width: 6 });
  };

  renderSegment(-50, 300);
  renderSegment(450, 750);
  renderSegment(900, V_WIDTH + 50);

  line(ctx, 300, y + 20, 300, y - 120, { stroke: '#2c2a29', width: 30 });
  line(ctx, 450, y + 20, 450, y - 120, { stroke: '#2c2a29', width: 30 });
  line(ctx, 750, y + 20, 750, y - 120, { stroke: '#2c2a29', width: 30 });
  line(ctx, 900, y + 20, 900, y - 120, { stroke: '#2c2a29', width: 30 });
  line(ctx, 270, y - 110, 480, y - 110, { stroke: '#4a4847', width: 24, cap: 'round' });
  line(ctx, 720, y - 110, 930, y - 110, { stroke: '#4a4847', width: 24, cap: 'round' });
  line(ctx, 270, y - 120, 480, y - 120, { stroke: '#2c2a29', width: 8, cap: 'round' });
  line(ctx, 720, y - 120, 930, y - 120, { stroke: '#2c2a29', width: 8, cap: 'round' });
}

// LEVEL 4: Castle Wall
function drawCastleWall(ctx, y) {
  const renderSegment = (startX, endX) => {
    line(ctx, startX, y + 40, endX, y + 40, { stroke: '#2c2a29', width: 40, opacity: 0.5 });
    rect(ctx, startX, y - 40, endX - startX, 60, { fill: '#4a4847', stroke: '#2c2a29', strokeWidth: 6 });
    line(ctx, startX, y - 10, endX, y - 10, { stroke: '#2c2a29', width: 2, opacity: 0.5 });
    rect(ctx, startX, y - 120, endX - startX, 80, { fill: '#fff', stroke: '#2c2a29', strokeWidth: 4 });
    const slitCount = Math.floor((endX - startX) / 50);
    for (let i = 0; i < slitCount; i++) {
      rect(ctx, startX + i * 50 + 20, y - 100, 6, 30, { fill: '#2c2a29' });
    }
    line(ctx, startX - 10, y - 120, endX + 10, y - 120, { stroke: '#4a4847', width: 16 });
    line(ctx, startX - 10, y - 128, endX + 10, y - 128, { stroke: '#2c2a29', width: 8 });
  };

  renderSegment(-50, 300);
  renderSegment(450, 750);
  renderSegment(900, V_WIDTH + 50);

  line(ctx, 290, y + 20, 290, y - 160, { stroke: '#2c2a29', width: 40 });
  line(ctx, 460, y + 20, 460, y - 160, { stroke: '#2c2a29', width: 40 });
  line(ctx, 740, y + 20, 740, y - 160, { stroke: '#2c2a29', width: 40 });
  line(ctx, 910, y + 20, 910, y - 160, { stroke: '#2c2a29', width: 40 });
  line(ctx, 260, y - 150, 490, y - 150, { stroke: '#4a4847', width: 36, cap: 'round' });
  line(ctx, 710, y - 150, 940, y - 150, { stroke: '#4a4847', width: 36, cap: 'round' });
  line(ctx, 260, y - 165, 490, y - 165, { stroke: '#2c2a29', width: 12, cap: 'round' });
  line(ctx, 710, y - 165, 940, y - 165, { stroke: '#2c2a29', width: 12, cap: 'round' });
  circle(ctx, 375, y - 150, 10, { fill: '#dfd4ba' });
  circle(ctx, 825, y - 150, 10, { fill: '#dfd4ba' });
}

// Draws the player base's defensive wall, tiered by `s.wall.level`.
export function drawWall(ctx, s, _now) {
  const level = s.wall?.level ?? 0;
  const variant = WALL_LEVELS[level]?.id ?? WALL_LEVELS[0].id;
  const y = WALL_FACE_Y;

  ctx.save();
  switch (variant) {
    case 'wooden': drawWoodenWall(ctx, y); break;
    case 'stone':  drawStoneWall(ctx, y); break;
    case 'castle': drawCastleWall(ctx, y); break;
    default:       drawBambooWall(ctx, y); break;
  }
  ctx.restore();
}

// Small aesthetic HP bar for the wall, styled like the cave/orb HP bars.
export function drawWallHpBar(ctx, s, now) {
  const wall = s.wall;
  if (!wall) return;

  const level = wall.level ?? 0;
  const wallDef = WALL_LEVELS[level] ?? WALL_LEVELS[0];
  const hpPct = wall.maxHp > 0 ? Math.max(0, Math.min(1, wall.hp / wall.maxHp)) : 0;

  const barW = 200;
  const barH = 14;
  const barX = V_WIDTH / 2 - barW / 2;
  const barY = WALL_Y - 200;

  ctx.fillStyle = '#1b1918';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
  ctx.fillStyle = '#4c4947';
  ctx.fillRect(barX, barY, barW, barH);

  let barColor;
  if (hpPct > 0.66)      barColor = '#b84235';
  else if (hpPct > 0.33) barColor = '#d4af37';
  else                   barColor = '#ff3b1f';

  if (hpPct <= 0.33) {
    ctx.globalAlpha = 0.8 + Math.sin(now / 100) * 0.2;
  }
  ctx.fillStyle = barColor;
  ctx.fillRect(barX, barY, barW * hpPct, barH);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#dfd4ba';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${wallDef.name}  ${Math.ceil(wall.hp)} / ${wall.maxHp}`, V_WIDTH / 2, barY + barH / 2);
}
