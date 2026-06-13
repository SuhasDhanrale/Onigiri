const SUPPORTED_BOSS_VISUALS = new Set(['goki', 'kasha']);

function drawPath(ctx, d, { fill = null, stroke = null, strokeWidth = 1, opacity = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  const path = new Path2D(d);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(path);
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke(path);
  }
  ctx.restore();
}

function drawBossShell(ctx, unit, now, drawContent) {
  const size = unit.radius * 3.15;
  const scale = size / 200;

  ctx.save();
  ctx.shadowBlur = 26;
  ctx.shadowColor = unit.color;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(0, unit.radius * 0.72, unit.radius * 1.15, unit.radius * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, Math.sin(now * 2.2 + unit.hashOffset) * 3);
  ctx.scale(scale, scale);
  ctx.translate(-100, -100);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawContent(ctx);
  ctx.restore();
}

function drawBossHealth(ctx, unit) {
  const width = Math.max(118, unit.radius * 2.35);
  const height = 9;
  const y = unit.radius + 22;
  const ratio = unit.maxHp > 0 ? Math.max(0, unit.hp / unit.maxHp) : 0;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 13px serif';
  ctx.fillStyle = '#dfd4ba';
  ctx.strokeStyle = '#1b1918';
  ctx.lineWidth = 4;
  ctx.strokeText(unit.name?.toUpperCase?.() ?? 'BOSS', 0, -unit.radius - 20);
  ctx.fillText(unit.name?.toUpperCase?.() ?? 'BOSS', 0, -unit.radius - 20);

  ctx.fillStyle = '#1b1918';
  ctx.fillRect(-width / 2, y, width, height);
  ctx.fillStyle = unit.color;
  ctx.fillRect(-width / 2, y, width * ratio, height);
  ctx.strokeStyle = '#dfd4ba';
  ctx.lineWidth = 2;
  ctx.strokeRect(-width / 2, y, width, height);
  ctx.restore();
}

function drawGoki(ctx) {
  drawPath(ctx, 'M 50 180 Q 20 150 30 100 Q 10 50 60 40 Q 100 10 140 40 Q 190 50 170 100 Q 180 150 150 180 Z', {
    fill: '#2c2a29',
    opacity: 0.78,
  });
  drawPath(ctx, 'M 40 160 L 20 120 L 35 90 L 15 60 L 50 45 L 70 20 L 100 10 L 130 20 L 150 45 L 185 60 L 165 90 L 180 120 L 160 160 Z', {
    fill: '#1b1918',
    stroke: '#dfd4ba',
    strokeWidth: 2,
  });
  drawPath(ctx, 'M 40 100 L 70 80 L 60 120 M 160 100 L 130 80 L 140 120 M 100 40 L 90 70 M 100 40 L 110 70 M 70 140 L 100 120 L 130 140', {
    stroke: '#4a4846',
    strokeWidth: 5,
  });
  drawPath(ctx, 'M 20 80 L 40 70 L 30 50 M 180 80 L 160 70 L 170 50 M 80 160 L 100 150 L 120 160', {
    stroke: '#4a4846',
    strokeWidth: 3,
  });
  drawPath(ctx, 'M 75 50 L 85 20 L 115 20 L 125 50 Z', {
    fill: '#1b1918',
    stroke: '#dfd4ba',
    strokeWidth: 2,
  });
  drawPath(ctx, 'M 85 30 L 95 33 L 85 36 Z M 115 30 L 105 33 L 115 36 Z', { fill: '#b84235' });
  drawPath(ctx, 'M 88 40 L 96 42 L 88 44 Z M 112 40 L 104 42 L 112 44 Z', { fill: '#b84235' });
  drawPath(ctx, 'M 92 48 L 98 49 L 92 50 Z M 108 48 L 102 49 L 108 50 Z', { fill: '#b84235' });
}

function drawKasha(ctx, now) {
  ctx.save();
  ctx.translate(100, 100);
  ctx.rotate(now * 2.1);

  ctx.strokeStyle = '#b84235';
  ctx.lineWidth = 12;
  ctx.setLineDash([30, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, 80, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#1b1918';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 16; i += 1) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 16);
    drawPath(ctx, 'M 0 -70 L -5 -40 L 5 -40 Z', { fill: '#b84235' });
    ctx.restore();
  }

  ctx.strokeStyle = '#dfd4ba';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i += 1) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 8);
    ctx.beginPath();
    ctx.moveTo(0, -78);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(0, Math.sin(now * 4) * 10);
  drawPath(ctx, 'M 100 60 Q 50 100 70 160 Q 100 130 130 160 Q 150 100 100 60 Z', {
    fill: '#1b1918',
    stroke: '#b84235',
    strokeWidth: 3,
  });
  drawPath(ctx, 'M 80 150 Q 100 180 120 150', { stroke: '#b84235', strokeWidth: 3 });
  drawPath(ctx, 'M 85 70 Q 100 50 115 70 L 120 90 Q 100 110 80 90 Z', { fill: '#dfd4ba' });
  ctx.fillStyle = '#1b1918';
  ctx.beginPath();
  ctx.ellipse(100, 95, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b84235';
  ctx.beginPath();
  ctx.arc(90, 75, 4, 0, Math.PI * 2);
  ctx.arc(110, 75, 4, 0, Math.PI * 2);
  ctx.fill();
  drawPath(ctx, 'M 85 70 L 95 78 M 115 70 L 105 78', { stroke: '#1b1918', strokeWidth: 3 });
  ctx.restore();
}

export function hasChapterBossVisual(bossId) {
  return SUPPORTED_BOSS_VISUALS.has(bossId);
}

export function drawChapterBossVisual(ctx, unit, now = performance.now() / 1000) {
  if (unit.bossId === 'goki') {
    drawBossShell(ctx, unit, now, drawGoki);
    drawBossHealth(ctx, unit);
    return true;
  }

  if (unit.bossId === 'kasha') {
    drawBossShell(ctx, unit, now, innerCtx => drawKasha(innerCtx, now));
    drawBossHealth(ctx, unit);
    return true;
  }

  return false;
}
