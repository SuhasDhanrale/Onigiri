// Small shared canvas primitives mirroring common SVG shape attrs (fill/stroke/strokeWidth/opacity).

export function drawPath(ctx, d, { fill, stroke, strokeWidth = 1, lineJoin = 'miter', lineCap = 'butt', opacity = 1 } = {}) {
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
    ctx.lineJoin = lineJoin;
    ctx.lineCap = lineCap;
    ctx.stroke(path);
  }
  ctx.restore();
}

export function line(ctx, x1, y1, x2, y2, { stroke, width = 1, cap = 'butt', opacity = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.lineCap = cap;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function circle(ctx, cx, cy, r, { fill, stroke, strokeWidth = 1, opacity = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth; ctx.stroke(); }
  ctx.restore();
}

export function rect(ctx, x, y, w, h, { fill, stroke, strokeWidth = 1, opacity = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth; ctx.strokeRect(x, y, w, h); }
  ctx.restore();
}
