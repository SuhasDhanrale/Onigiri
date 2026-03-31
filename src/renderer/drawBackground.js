import { V_WIDTH, V_HEIGHT, WALL_Y, BATTLE_LINE_Y } from '../config/constants.js';
import { COLORS } from '../config/colors.js';
import { BARRACKS_DEFS, BARRACKS_LAYOUT } from '../config/barracks.js';
import { UNIT_TYPES } from '../config/units.js';
import { getSquadCap } from '../core/utils.js';

export function drawBackground(ctx, s, now, metaRef) {
    const bgX = -3000;
    const bgW = V_WIDTH + 6000;
    const bgY = -3000;
    const bgH = V_HEIGHT + 6000;

    const bossActive = s.units.some(u => u.type === 'boss');
    if (bossActive) { 
        const grad = ctx.createRadialGradient(V_WIDTH/2, V_HEIGHT/2, V_HEIGHT/3, V_WIDTH/2, V_HEIGHT/2, V_HEIGHT); 
        grad.addColorStop(0, 'rgba(184, 66, 53, 0)'); 
        grad.addColorStop(1, `rgba(184, 66, 53, ${0.15 + Math.sin(now/200)*0.05})`); 
        ctx.fillStyle = grad; 
        ctx.fillRect(bgX, 0, bgW, V_HEIGHT); 
    }
    
    if (s.feverActive > 0) { 
        ctx.fillStyle = `rgba(184, 66, 53, 0.25)`; 
        ctx.fillRect(bgX, 0, bgW, V_HEIGHT); 
    }
    
    ctx.setLineDash([15, 15]); 
    ctx.strokeStyle = `rgba(27, 25, 24, 0.15)`; 
    ctx.lineWidth = 4; 
    ctx.beginPath(); ctx.moveTo(bgX, BATTLE_LINE_Y); ctx.lineTo(bgX + bgW, BATTLE_LINE_Y); ctx.stroke(); 
    ctx.setLineDash([]);
    
    if (s.inkLineY > -50) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        
        const washGrad = ctx.createLinearGradient(0, 0, 0, s.inkLineY + 50);
        washGrad.addColorStop(0, 'rgba(184, 66, 53, 0.15)'); 
        washGrad.addColorStop(0.8, 'rgba(184, 66, 53, 0.05)');
        washGrad.addColorStop(1, 'rgba(184, 66, 53, 0)');
        ctx.fillStyle = washGrad;
        ctx.fillRect(bgX, 0, bgW, s.inkLineY + 150);
        
        for (let i = 0; i < 3; i++) {
            if (i === 0) ctx.fillStyle = 'rgba(184, 66, 53, 0.15)'; 
            else if (i === 1) ctx.fillStyle = 'rgba(27, 25, 24, 0.10)'; 
            else ctx.fillStyle = 'rgba(27, 25, 24, 0.12)'; 
            
            ctx.beginPath(); 
            ctx.moveTo(bgX, 0); 
            ctx.lineTo(bgX, s.inkLineY);
            
            for (let x = bgX; x <= bgX + bgW; x += 40) {
                let noise = Math.sin(x * 0.02 + now / (1000 + i * 200)) * (25 + i * 10); 
                noise += Math.sin(x * 0.08 - now / (600 + i * 150)) * (8 + i * 3); 
                
                const tendrilFrequency = 0.015 + (i * 0.005);
                const tendrilStrength = Math.max(0, Math.sin(x * tendrilFrequency + now/1000 + i*2));
                const tendrilDrop = Math.pow(tendrilStrength, 3) * (35 + i * 15); 
                
                const dangerPulse = (s.inkLineY > 800) ? Math.sin(now / 150) * ((s.inkLineY - 800) * 0.03) : 0;
                
                ctx.lineTo(x, s.inkLineY + noise + tendrilDrop - (i * 25) + dangerPulse);
            }
            ctx.lineTo(bgX + bgW, 0); 
            ctx.fill();
        }
        ctx.restore();
    }

    ctx.fillStyle = `rgba(0, 0, 0, 0.06)`; 
    ctx.fillRect(bgX, WALL_Y, bgW, bgH); 
    
    const gateL = V_WIDTH/2 - 120; 
    const gateR = V_WIDTH/2 + 120; 
    ctx.strokeStyle = COLORS.vermilion; 
    ctx.lineWidth = s.feverActive > 0 ? 16 : 8 + (Math.sin(now / 150) * 4);
    
    ctx.beginPath(); ctx.moveTo(bgX, WALL_Y); ctx.lineTo(gateL, WALL_Y); ctx.stroke(); 
    ctx.beginPath(); ctx.moveTo(gateR, WALL_Y); ctx.lineTo(bgX + bgW, WALL_Y); ctx.stroke();
    ctx.fillStyle = COLORS.inkDark; 
    ctx.fillRect(gateL - 15, WALL_Y - 50, 30, 80); 
    ctx.fillRect(gateR - 15, WALL_Y - 50, 30, 80);
    
    const isImperial = metaRef.current.equippedItem === 'IMPERIAL_BANNER';
    const bannerMult = isImperial ? 1.5 : 1.0;

    Object.entries(BARRACKS_DEFS).forEach(([key, def]) => {
        const layout = BARRACKS_LAYOUT[key]; 
        const level = s.barracks[key] || 0; 
        const squash = s.visuals[key] || 0; 
        const isFocused = s.focusedBuilding === key;
        
        ctx.save(); 
        ctx.translate(layout.x, layout.y); 
        ctx.scale(1 + squash * 0.15, 1 - squash * 0.25); 

        if (isFocused) {
            ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
            ctx.beginPath();
            ctx.arc(0, -40, 90 + Math.sin(now / 150) * 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (level === 0) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = COLORS.inkDark; 
            ctx.fillRect(-50, -50, 100, 100);
            ctx.globalAlpha = 1.0;
        } else {
            if (key === 'HATAMOTO') { 
                ctx.fillStyle = '#f2f0ea'; ctx.fillRect(-65, -75, 130, 95); 
                ctx.fillStyle = COLORS.inkDark; ctx.fillRect(-75, 0, 150, 30); 
                ctx.beginPath(); ctx.moveTo(-80, -75); ctx.lineTo(80, -75); ctx.lineTo(0, -130); ctx.fill(); 
            } else if (key === 'YUMI') { 
                ctx.fillStyle = COLORS.inkDark; ctx.beginPath(); ctx.moveTo(-80, -30); ctx.quadraticCurveTo(0, -80, 80, -30); ctx.lineTo(95, -20); ctx.lineTo(-95, -20); ctx.fill(); 
                ctx.fillRect(-70, -20, 14, 55); ctx.fillRect(56, -20, 14, 55); 
                ctx.fillStyle = COLORS.navy; ctx.fillRect(-60, -20, 120, 55); 
            } else if (key === 'CAVALRY') { 
                ctx.fillStyle = '#222'; ctx.fillRect(-85, -55, 170, 75); 
                ctx.fillStyle = COLORS.khaki; ctx.beginPath(); ctx.moveTo(-95, -55); ctx.lineTo(95, -55); ctx.lineTo(85, -85); ctx.lineTo(-85, -85); ctx.fill(); 
                ctx.fillStyle = COLORS.vermilion; ctx.beginPath(); ctx.ellipse(0, -20, 20, 12, Math.PI/4, 0, Math.PI*2); ctx.fill(); 
            } else if (key === 'HOROKU') { 
                ctx.fillStyle = COLORS.khaki; ctx.fillRect(-85, -65, 170, 85); 
                ctx.fillStyle = COLORS.inkDark; ctx.beginPath(); ctx.moveTo(-95, -65); ctx.lineTo(95, -65); ctx.lineTo(75, -110); ctx.lineTo(-75, -110); ctx.fill(); 
                ctx.fillStyle = COLORS.parchment; ctx.fillRect(-40, -30, 80, 50); 
            }
        }
        ctx.restore();
        
        ctx.save(); 
        ctx.translate(layout.x, layout.y + 30); 
        if (level > 0) {
            const maxTime = def.spawnRate * bannerMult;
            const cap = getSquadCap(key, level, metaRef.current.equippedItem, metaRef.current.conqueredRegions);
            const currentCount = s.units.filter(u => u.name === UNIT_TYPES[def.unit].name && u.team === 'player' && u.hp > 0).length;
            const isAtCap = currentCount >= cap;
            const pct = Math.max(0, Math.min(1, 1 - (s.timers[key] / maxTime)));

            ctx.fillStyle = COLORS.inkDark; ctx.fillRect(-70, 0, 140, 20); 
            ctx.fillStyle = COLORS.parchment; ctx.fillRect(-68, 2, 136, 16); 
            
            if (isAtCap) {
                ctx.fillStyle = COLORS.vermilion; ctx.fillRect(-68, 2, 136, 16);
                ctx.fillStyle = COLORS.parchment; ctx.font = 'bold 12px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('MAX SQUAD', 0, 12);
            } else {
                ctx.fillStyle = s.autoUnlocked[key] ? COLORS.jade : COLORS.navy;
                ctx.fillRect(-68, 2, 136 * pct, 16);
                ctx.fillStyle = pct > 0.5 ? COLORS.parchment : COLORS.inkDark;
                ctx.font = 'bold 10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(s.autoUnlocked[key] ? 'TRAINING...' : 'TAP TO TRAIN', 0, 12);
            }
        } else {
            ctx.fillStyle = 'rgba(27, 25, 24, 0.4)'; ctx.fillRect(-50, 0, 100, 20);
            ctx.fillStyle = COLORS.parchment; ctx.font = 'bold 10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('LOCKED', 0, 12);
        }
        ctx.restore();
    });
}
