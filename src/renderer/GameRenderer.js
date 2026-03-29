import { V_WIDTH, V_HEIGHT } from '../config/constants.js';
import { drawBackground } from './drawBackground.js';
import { drawBackgroundEffects, drawForegroundEffects } from './drawEffects.js';
import { drawUnitTopDown } from './drawUnits.js';

export const initRenderer = (canvas) => {
    canvas.width = V_WIDTH;
    canvas.height = V_HEIGHT;
};

export const drawGame = (ctx, s, dt, now, metaRef) => {
    const canvas = ctx.canvas;
    const cw = canvas.width;
    const ch = canvas.height;

    // Reset transform and clear the full physical canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    ctx.save();

    // Camera: scale Safe Zone (V_WIDTH x V_HEIGHT) to fit within physical canvas,
    // centered both horizontally and vertically
    const scale = Math.min(cw / V_WIDTH, ch / V_HEIGHT);
    const offsetX = (cw - V_WIDTH * scale) / 2;
    const offsetY = (ch - V_HEIGHT * scale) / 2;

    // Keep state in sync so InputHandler can do the inverse math
    s.canvasScale = scale;
    s.canvasOffsetX = offsetX;
    s.canvasOffsetY = offsetY;

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const bgX = -3000;
    const bgW = V_WIDTH + 6000;
    const bgY = -3000;
    const bgH = V_HEIGHT + 6000;

    // FoxFires (full bleed)
    s.foxFires.forEach(ff => {
         ctx.save();
         ctx.globalCompositeOperation = 'screen';
         ctx.fillStyle = `rgba(234, 88, 12, ${Math.min(0.25, ff.life / 2)})`;
         ctx.fillRect(bgX, ff.yTop, bgW, ff.yBottom - ff.yTop);
         ctx.restore();
    });

    // Screenshake
    if (s.screenShake > 0) {
        const amt = Math.min(1, s.screenShake) * 25;
        ctx.translate((Math.random() - 0.5) * amt, (Math.random() - 0.5) * amt);
    }

    // Boss Vignette
    const bossActive = s.units.some(u => u.type === 'boss');
    if (bossActive) {
        const grad = ctx.createRadialGradient(V_WIDTH/2, V_HEIGHT/2, 0, V_WIDTH/2, V_HEIGHT/2, V_WIDTH);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, 'rgba(184, 66, 53, 0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(bgX, bgY, bgW, bgH);
    }

    // Fever Overlay
    if (s.feverActive > 0) {
        ctx.fillStyle = 'rgba(184, 66, 53, 0.15)';
        ctx.fillRect(bgX, bgY, bgW, bgH);
    }

    drawBackground(ctx, s, now, metaRef);
    drawBackgroundEffects(ctx, s);

    // Sort and draw units — semantic layer first, Y-second within layer
    [...s.units]
      .sort((a, b) => {
        const la = a.renderLayer ?? 2;
        const lb = b.renderLayer ?? 2;
        if (la !== lb) return la - lb;
        return a.y - b.y;
      })
      .forEach(u => drawUnitTopDown(ctx, u));

    drawForegroundEffects(ctx, s);

    ctx.restore();
};
