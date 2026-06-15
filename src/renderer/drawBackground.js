import { V_WIDTH, V_HEIGHT, WALL_Y, BATTLE_LINE_Y, TOWER_SLOTS, TOWER_COST } from '../config/constants.js';
import { COLORS } from '../config/colors.js';
import { BARRACKS_DEFS, BARRACKS_LAYOUT } from '../config/barracks.js';
import { UNIT_TYPES } from '../config/units.js';
import { getSquadCap } from '../core/utils.js';
import { drawWallHpBar } from './drawWalls.js';
import { drawBuildingArt } from './drawBuildings.js';

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
        ctx.fillRect(0, 0, V_WIDTH, s.inkLineY + 150);

        for (let i = 0; i < 3; i++) {
            if (i === 0) ctx.fillStyle = 'rgba(184, 66, 53, 0.15)';
            else if (i === 1) ctx.fillStyle = 'rgba(27, 25, 24, 0.10)';
            else ctx.fillStyle = 'rgba(27, 25, 24, 0.12)';

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, s.inkLineY);

            for (let x = 0; x <= V_WIDTH; x += 40) {
                let noise = Math.sin(x * 0.02 + now / (1000 + i * 200)) * (25 + i * 10); 
                noise += Math.sin(x * 0.08 - now / (600 + i * 150)) * (8 + i * 3); 
                
                const tendrilFrequency = 0.015 + (i * 0.005);
                const tendrilStrength = Math.max(0, Math.sin(x * tendrilFrequency + now/1000 + i*2));
                const tendrilDrop = Math.pow(tendrilStrength, 3) * (35 + i * 15); 
                
                const dangerPulse = (s.inkLineY > 800) ? Math.sin(now / 150) * ((s.inkLineY - 800) * 0.03) : 0;
                
                ctx.lineTo(x, s.inkLineY + noise + tendrilDrop - (i * 25) + dangerPulse);
            }
            ctx.lineTo(V_WIDTH, 0);
            ctx.fill();
        }
        ctx.restore();
    }

    ctx.fillStyle = `rgba(0, 0, 0, 0.06)`;
    ctx.fillRect(bgX, WALL_Y, bgW, bgH);

    drawWallHpBar(ctx, s, now);

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
            drawBuildingArt(ctx, key);
        }
        ctx.restore();
        
        ctx.save(); 
        ctx.translate(layout.x, layout.y + 30); 
        if (level > 0) {
            const maxTime = def.spawnRate * bannerMult;
            const cap = getSquadCap(key, level, metaRef.current.equippedItem, metaRef.current.conqueredRegions, metaRef.current.activeSquadCapBonus ?? 0);
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

    // Empty Arrow Tower build slots (occupied slots are drawn as units)
    TOWER_SLOTS.forEach((slot) => {
        const occupied = s.units.some(u => u.name === 'Arrow Tower' && u.team === 'player' && u.hp > 0 && Math.hypot(u.x - slot.x, u.y - slot.y) < 50);
        if (occupied) return;
        ctx.save();
        ctx.translate(slot.x, slot.y);
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
        ctx.lineWidth = 3;
        ctx.strokeRect(-26, -40, 52, 60);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(212, 175, 55, 0.85)';
        ctx.font = 'bold 20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🏹', 0, -10);
        ctx.fillStyle = COLORS.inkDark;
        ctx.font = 'bold 11px serif';
        ctx.fillText(`BUILD ${TOWER_COST}K`, 0, 35);
        ctx.restore();
    });
}
