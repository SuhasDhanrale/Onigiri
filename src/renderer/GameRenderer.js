import { V_WIDTH, V_HEIGHT } from '../config/constants.js';
import { drawBackground } from './drawBackground.js';
import { drawBackgroundEffects, drawForegroundEffects } from './drawEffects.js';
import { drawUnitTopDown } from './drawUnits.js';

export const drawGame = (ctx, s, dt, now, metaRef) => {
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT); 
    ctx.save();
    
    // FoxFires
    s.foxFires.forEach(ff => {
         ctx.save();
         ctx.globalCompositeOperation = 'screen';
         ctx.fillStyle = `rgba(234, 88, 12, ${Math.min(0.25, ff.life / 2)})`;
         ctx.fillRect(0, ff.yTop, V_WIDTH, ff.yBottom - ff.yTop);
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
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
    }

    // Fever Overlay
    if (s.feverActive > 0) {
        ctx.fillStyle = 'rgba(184, 66, 53, 0.15)';
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
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
