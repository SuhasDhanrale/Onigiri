import { V_WIDTH, WALL_FACE_Y } from '../config/constants.js';
import { WALL_LEVELS } from '../config/walls.js';
import { drawPath, line, circle, rect } from './canvasShapes.js';
import { translateText } from '../i18n/i18n.js';

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

// HP bar for the player's wall. It lives in the strip just below the wall (and
// above the barracks) — clearly inside our own base, so it doesn't read as an
// enemy health bar — and is only shown while the wall is actually under attack,
// fading out shortly after the last hit. Drawn last in the frame (GameRenderer)
// so it sits cleanly on top.
const WALL_HP_BAR_Y = 1350;        // below WALL_Y (1320), above the barracks (~1390)
const WALL_HP_VISIBLE_MS = 1600;   // keep showing this long after the last hit
const WALL_HP_FADE_MS = 400;       // fade out over the tail of that window

export function drawWallHpBar(ctx, s, now) {
  const wall = s.wall;
  if (!wall) return;

  // Only visible while under attack (recently hit by an enemy).
  const sinceHit = now - (wall.lastHit ?? -Infinity);
  if (sinceHit > WALL_HP_VISIBLE_MS) return;
  const fade = sinceHit > WALL_HP_VISIBLE_MS - WALL_HP_FADE_MS
    ? Math.max(0, (WALL_HP_VISIBLE_MS - sinceHit) / WALL_HP_FADE_MS)
    : 1;

  const level = wall.level ?? 0;
  const wallDef = WALL_LEVELS[level] ?? WALL_LEVELS[0];
  const hpPct = wall.maxHp > 0 ? Math.max(0, Math.min(1, wall.hp / wall.maxHp)) : 0;

  const barW = 280;
  const barH = 16;
  const cx = V_WIDTH / 2;
  const barX = cx - barW / 2;
  const barY = WALL_HP_BAR_Y;
  const r = 5;

  let barColor;
  if (hpPct > 0.66)      barColor = '#b84235'; // Vermilion (healthy)
  else if (hpPct > 0.33) barColor = '#d4af37'; // Gold (wounded)
  else                   barColor = '#ff3b1f'; // Bright (critical)

  ctx.save();
  ctx.globalAlpha = fade;

  // Frame: dark plate with a thin bronze border
  ctx.beginPath();
  ctx.roundRect(barX - 3, barY - 3, barW + 6, barH + 6, r + 2);
  ctx.fillStyle = '#1b1918';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#5c4a3d';
  ctx.stroke();

  // Empty track
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, r);
  ctx.fillStyle = '#3a3633';
  ctx.fill();

  // Fill — pulse when critical
  if (hpPct > 0) {
    ctx.globalAlpha = fade * (hpPct <= 0.33 ? 0.75 + Math.sin(now / 100) * 0.25 : 1);
    ctx.beginPath();
    ctx.roundRect(barX, barY, Math.max(barH, barW * hpPct), barH, r);
    ctx.fillStyle = barColor;
    ctx.fill();
    // Subtle top highlight for a bit of sheen
    ctx.beginPath();
    ctx.roundRect(barX, barY + 1, Math.max(barH, barW * hpPct), barH * 0.4, r);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fill();
    ctx.globalAlpha = fade;
  }

  // Wall name + HP centered in the bar
  ctx.fillStyle = '#dfd4ba';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${translateText(wallDef.name)}  ${Math.ceil(wall.hp)} / ${wall.maxHp}`, cx, barY + barH / 2 + 1);

  ctx.restore();
}
