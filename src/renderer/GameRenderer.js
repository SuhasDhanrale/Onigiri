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

    drawBackground(ctx, s, now, metaRef);
    drawBackgroundEffects(ctx, s);
    
    // Sort and draw units
    s.units.sort((a,b) => (a.type === 'flying' ? 1 : 0) - (b.type === 'flying' ? 1 : 0))
           .forEach(u => drawUnitTopDown(ctx, u));
           
    drawForegroundEffects(ctx, s);
    
    ctx.restore();
};
