import { COLORS } from '../config/colors.js';

export class SpriteRenderer {
  constructor() {
    this.sprites = {};
    this.fallbackMode = false;
    this.loading = {};
  }

  async loadSprite(id, basePath) {
    if (this.sprites[id]) return this.sprites[id];
    if (this.loading[id]) return null;

    this.loading[id] = true;
    try {
      const response = await fetch(`${basePath}${id}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.sprites[id] = data;
      this.loading[id] = false;
      return data;
    } catch (err) {
      console.warn(`[SpriteRenderer] Failed to load ${id}, using fallback:`, err.message);
      this.loading[id] = false;
      return null;
    }
  }

  async loadAllSprites(basePath = '/assets/sprites/enemy/') {
    const spriteIds = [
      'rebels/ikki-rebel',
      'tengu/tengu-flier',
      'onmyoji/onmyoji',
      'shinobi/shinobi',
      'oni/great-oni'
    ];
    const results = await Promise.all(spriteIds.map(id => this.loadSprite(id, basePath)));
    return results.filter(Boolean);
  }

  draw(ctx, spriteId, x, y, state = 'idle', animProgress = 0, scale = 1) {
    const sprite = this.sprites[spriteId];
    if (!sprite) {
      this.drawFallback(ctx, spriteId, x, y, scale);
      return;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const animation = sprite.animations[state];
    const keyframes = animation?.keyframes || [];

    for (const layerName of sprite.drawOrder) {
      const layer = sprite.layers[layerName];
      if (!layer) continue;

      // Get all keyframes for this layer, sorted by time
      const layerKfs = keyframes
        .filter(k => k.layer === layerName)
        .sort((a, b) => a.time - b.time);

      this.drawLayer(ctx, layer, layerKfs, animProgress);
    }

    ctx.restore();
  }

  drawLayer(ctx, layer, layerKfs, progress) {
    // Helper to interpolate a property value between keyframes
    const interpolate = (prop, defaultVal = 0) => {
      if (layerKfs.length === 0) return defaultVal;
      if (layerKfs.length === 1 || progress <= layerKfs[0].time) {
        return layerKfs[0][prop] !== undefined ? layerKfs[0][prop] : defaultVal;
      }
      if (progress >= layerKfs[layerKfs.length - 1].time) {
        return layerKfs[layerKfs.length - 1][prop] !== undefined ? layerKfs[layerKfs.length - 1][prop] : defaultVal;
      }

      // Find the two keyframes to interpolate between
      for (let i = 0; i < layerKfs.length - 1; i++) {
        const prevKf = layerKfs[i];
        const nextKf = layerKfs[i + 1];
        if (progress >= prevKf.time && progress <= nextKf.time) {
          const prevVal = prevKf[prop] !== undefined ? prevKf[prop] : defaultVal;
          const nextVal = nextKf[prop] !== undefined ? nextKf[prop] : defaultVal;
          const t = (progress - prevKf.time) / (nextKf.time - prevKf.time);
          return prevVal + (nextVal - prevVal) * t;
        }
      }
      return defaultVal;
    };

    if (layer.type === 'group') {
      ctx.save();

      const tx = interpolate('translateX', 0);
      const ty = interpolate('translateY', 0);
      const rot = interpolate('rotate', 0);
      const sc = interpolate('scale', 1);
      const scaleX = interpolate('scaleX', 1);
      const scaleY = interpolate('scaleY', 1);
      const op = interpolate('opacity', null);

      ctx.translate(tx, ty);
      if (rot !== 0) ctx.rotate((rot * Math.PI) / 180);
      if (sc !== 1) ctx.scale(sc, sc);
      if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);
      if (op !== null) ctx.globalAlpha = op;

      if (layer.attackTranslateX) ctx.translate(layer.attackTranslateX, 0);
      if (layer.attackTranslateY) ctx.translate(0, layer.attackTranslateY);
      if (layer.attackRotate) ctx.rotate((layer.attackRotate * Math.PI) / 180);

      for (const child of layer.children || []) {
        this.drawPrimitive(ctx, child);
      }
      ctx.restore();
    } else {
      // For non-group layers, check if we need to apply opacity from keyframes
      const op = interpolate('opacity', null);
      if (op !== null) {
        ctx.save();
        ctx.globalAlpha = op;
        this.drawPrimitive(ctx, layer);
        ctx.restore();
      } else {
        this.drawPrimitive(ctx, layer);
      }
    }
  }

  drawPrimitive(ctx, shape) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (shape.opacity !== undefined && shape.opacity !== null) {
      ctx.globalAlpha = shape.opacity;
    }

    switch (shape.type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(shape.cx || 0, shape.cy || 0, shape.r, 0, Math.PI * 2);
        if (shape.fill && shape.fill !== 'none') {
          ctx.fillStyle = shape.fill;
          ctx.fill();
        }
        if (shape.stroke) {
          ctx.strokeStyle = shape.stroke;
          ctx.lineWidth = shape.strokeWidth || 2;
          ctx.stroke();
        }
        break;

      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(0, 0, shape.rx, shape.ry, 0, 0, Math.PI * 2);
        if (shape.fill) {
          ctx.fillStyle = shape.fill;
          ctx.fill();
        }
        if (shape.stroke) {
          ctx.strokeStyle = shape.stroke;
          ctx.lineWidth = shape.strokeWidth || 2;
          ctx.stroke();
        }
        break;

      case 'path':
        const path = new Path2D(shape.d);
        if (shape.fill) {
          ctx.fillStyle = shape.fill;
          ctx.fill(path);
        }
        if (shape.stroke) {
          ctx.strokeStyle = shape.stroke;
          ctx.lineWidth = shape.strokeWidth || 2;
          ctx.stroke(path);
        }
        break;

      case 'polygon':
        ctx.beginPath();
        const pts = shape.points.split(' ').map(p => {
          const [x, y] = p.split(',').map(Number);
          return { x, y };
        });
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        if (shape.fill) {
          ctx.fillStyle = shape.fill;
          ctx.fill();
        }
        if (shape.stroke) {
          ctx.strokeStyle = shape.stroke;
          ctx.lineWidth = shape.strokeWidth || 2;
          ctx.stroke();
        }
        break;

      case 'rect':
        ctx.beginPath();
        ctx.roundRect(shape.x || 0, shape.y || 0, shape.w, shape.h, shape.r || 0);
        if (shape.fill) {
          ctx.fillStyle = shape.fill;
          ctx.fill();
        }
        if (shape.stroke) {
          ctx.strokeStyle = shape.stroke;
          ctx.lineWidth = shape.strokeWidth || 2;
          ctx.stroke();
        }
        break;

      case 'roundRect':
        ctx.beginPath();
        ctx.roundRect(shape.x, shape.y, shape.w, shape.h, shape.r);
        if (shape.fill) {
          ctx.fillStyle = shape.fill;
          ctx.fill();
        }
        if (shape.stroke) {
          ctx.strokeStyle = shape.stroke;
          ctx.lineWidth = shape.strokeWidth || 2;
          ctx.stroke();
        }
        break;

      case 'line':
        ctx.beginPath();
        ctx.moveTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x2, shape.y2);
        ctx.strokeStyle = shape.stroke;
        ctx.lineWidth = shape.strokeWidth || 2;
        ctx.stroke();
        break;

      case 'lines':
        if (shape.pairs) {
          for (const [x1, y1, x2, y2] of shape.pairs) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = shape.stroke;
            ctx.lineWidth = shape.strokeWidth || 2;
            ctx.stroke();
          }
        }
        break;

      case 'circles':
        if (shape.positions) {
          for (const [cx, cy] of shape.positions) {
            ctx.beginPath();
            ctx.arc(cx, cy, shape.r, 0, Math.PI * 2);
            ctx.fillStyle = shape.fill;
            ctx.fill();
          }
        }
        break;
    }

    ctx.globalAlpha = 1;
  }

  drawFallback(ctx, type, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    switch (type) {
      case 'rebels/ikki-rebel':
      case 'ikki-rebel':
        ctx.fillStyle = COLORS.khaki;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -30);
        ctx.stroke();
        break;

      case 'tengu/tengu-flier':
      case 'tengu-flier':
        ctx.fillStyle = COLORS.jade;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-20, -10);
        ctx.quadraticCurveTo(-40, 0, -20, 10);
        ctx.moveTo(20, -10);
        ctx.quadraticCurveTo(40, 0, 20, 10);
        ctx.strokeStyle = COLORS.parchment;
        ctx.lineWidth = 2;
        ctx.stroke();
        break;

      case 'onmyoji/onmyoji':
      case 'onmyoji':
        ctx.fillStyle = COLORS.parchment;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = COLORS.jade;
        ctx.beginPath();
        ctx.arc(0, -20, 20, 0, Math.PI * 2);
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
        break;

      case 'shinobi/shinobi':
      case 'shinobi':
        ctx.fillStyle = COLORS.ink;
        ctx.beginPath();
        ctx.ellipse(-2, 0, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.vermilion;
        ctx.fillRect(-12, -4, 24, 6);
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(30, -5);
        ctx.moveTo(-15, 0);
        ctx.lineTo(-30, -5);
        ctx.strokeStyle = COLORS.khaki;
        ctx.lineWidth = 3;
        ctx.stroke();
        break;

      case 'oni/great-oni':
      case 'great-oni':
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(184,66,53,0.8)';
        ctx.fillStyle = COLORS.vermilion;
        ctx.beginPath();
        ctx.ellipse(-2, 0, 38, 55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = COLORS.gold;
        ctx.beginPath();
        ctx.arc(0, -25, 15, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        ctx.fillStyle = COLORS.parchment;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.restore();
  }

  getSprite(spriteId) {
    return this.sprites[spriteId];
  }

  hasSprite(spriteId) {
    return !!this.sprites[spriteId];
  }

  isLoaded() {
    return Object.keys(this.sprites).length > 0;
  }
}

export const spriteRenderer = new SpriteRenderer();