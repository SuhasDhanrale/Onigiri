import { COLORS } from '../config/colors.js';
import { V_WIDTH } from '../config/constants.js';

export function drawBackgroundEffects(ctx, s) {
    s.lightnings.forEach(l => { 
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = l.life * 20; ctx.lineCap = 'round'; 
        ctx.beginPath(); ctx.moveTo(l.x + (Math.random()*40-20), -100); ctx.lineTo(l.x, l.y); ctx.stroke(); 
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = l.life * 10; ctx.stroke(); 
    });
    
    s.dragonWaves.forEach(w => { 
        ctx.fillStyle = `rgba(56, 189, 248, ${Math.min(1, w.life)})`; 
        ctx.beginPath(); ctx.ellipse(V_WIDTH/2, w.y, V_WIDTH/2, 40, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, w.life*1.5)})`; 
        ctx.beginPath(); ctx.ellipse(V_WIDTH/2, w.y, V_WIDTH/2.2, 10, 0, 0, Math.PI*2); ctx.fill(); 
    });
    
    s.explosions.forEach(e => { 
        ctx.strokeStyle = e.color; ctx.lineWidth = e.life * 15; 
        ctx.beginPath(); ctx.arc(e.x, e.y, Math.max(0.1, e.r * (1 - e.life)), 0, Math.PI*2); ctx.stroke(); 
    });
}

export function drawForegroundEffects(ctx, s) {
    s.projectiles.forEach(p => { 
        if (p.type === 'lob') { 
            const sz = Math.max(0.1, 8 + (p.z * 0.1)); 
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(p.x, p.y + p.z*0.5, sz, 0, Math.PI*2); ctx.fill(); 
            ctx.fillStyle = COLORS.ink; ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI*2); ctx.fill(); 
            ctx.fillStyle = COLORS.vermilion; ctx.beginPath(); ctx.arc(p.x, p.y, sz*0.4, 0, Math.PI*2); ctx.fill(); 
        } else { 
            if (p.isFlaming) {
                ctx.shadowColor = '#ea580c'; ctx.shadowBlur = 8;
                ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 5;
            } else {
                ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3; 
            }
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx*0.03, p.y - p.vy*0.03); ctx.stroke(); 
            ctx.shadowBlur = 0;
        } 
    });
    
    s.slashTrails.forEach(t => { 
        ctx.lineCap = 'round'; 
        ctx.strokeStyle = `rgba(184, 66, 53, ${t.life * 0.8})`; ctx.lineWidth = 30 * t.life; 
        ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke(); 
        ctx.strokeStyle = `rgba(255,255,255, ${t.life})`; ctx.lineWidth = 10 * t.life; 
        ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke(); 
    });
    
    s.particles.forEach(p => { 
        ctx.fillStyle = p.color; 
        ctx.globalAlpha = p.life > 1 ? 1.0 : Math.max(0, p.life); 
        ctx.beginPath(); 
        if (p.isDrip) {
            ctx.ellipse(p.x, p.y, Math.max(0.1, p.r), Math.max(0.1, p.r * 5), 0, 0, Math.PI*2);
        } else {
            ctx.arc(p.x, p.y, Math.max(0.1, p.r), 0, Math.PI*2); 
        }
        ctx.fill(); 
        ctx.globalAlpha = 1.0; 
    });
    
    ctx.font = 'bold 28px serif'; ctx.textAlign = 'center'; 
    s.floatingTexts.forEach(ft => { 
        ctx.fillStyle = ft.color; 
        ctx.globalAlpha = Math.min(1, ft.life * 2); 
        ctx.fillText(ft.text, ft.x, ft.y); 
        ctx.globalAlpha = 1.0; 
    });
}
