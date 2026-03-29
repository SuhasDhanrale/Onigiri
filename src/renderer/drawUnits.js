import { COLORS } from '../config/colors.js';

    export const drawUnitTopDown = (ctx, u) => {
      ctx.save(); ctx.translate(u.x, u.y); 

      if (u.stance === 'DEFEND' || u.stance === 'PATROL') {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)'; 
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, u.radius + 6 + Math.sin(performance.now() / 150) * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.fill();
      }

      if (u.stance_override === 'SCREENING') {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, u.radius + 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fill();
      }

      if (u.isElite) {
          const pulse = Math.sin(performance.now() / 150) * 8;
          ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
          ctx.beginPath(); ctx.arc(0, 0, u.radius + 15 + pulse, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
          ctx.beginPath(); ctx.arc(0, 0, u.radius + 5 + pulse/2, 0, Math.PI*2); ctx.fill();
      }

      if (u.type === 'flying') { 
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; 
          ctx.beginPath(); 
          ctx.ellipse(-10, 45, Math.max(0.1, u.radius*0.8), Math.max(0.1, u.radius*0.4), 0, 0, Math.PI*2); 
          ctx.fill(); 
      }
      if (u.telegraphTimer > 0) { 
          const maxTelegraph = 0.8; 
          const fillRatio = 1 - (u.telegraphTimer / maxTelegraph); 
          ctx.strokeStyle = `rgba(184, 66, 53, 0.8)`; 
          ctx.lineWidth = 2; 
          ctx.beginPath(); 
          ctx.arc(0, 0, Math.max(0.1, u.range), 0, Math.PI*2); 
          ctx.stroke(); 
          ctx.fillStyle = `rgba(184, 66, 53, 0.4)`; 
          ctx.beginPath(); 
          ctx.arc(0, 0, Math.max(0.1, u.range * fillRatio), 0, Math.PI*2); 
          ctx.fill(); 
      }
      if (u.burn > 0) { 
          ctx.fillStyle = 'rgba(234, 88, 12, 0.3)'; 
          ctx.beginPath(); 
          ctx.arc(0, 0, Math.max(0.1, u.radius*1.5), 0, Math.PI*2); 
          ctx.fill(); 
      }
      
      ctx.rotate(u.team === 'player' ? -Math.PI/2 : Math.PI/2);
      ctx.lineWidth = 3; 
      ctx.strokeStyle = COLORS.ink; 
      ctx.lineJoin = 'round';
      const sw = Math.max(0, u.swingPhase) * 20;

      if (u.name === 'Bamboo Barricade') { 
          ctx.strokeStyle = '#4a3b32'; 
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-u.radius, -u.radius); ctx.lineTo(u.radius, u.radius);
          ctx.moveTo(u.radius, -u.radius); ctx.lineTo(-u.radius, u.radius);
          ctx.moveTo(0, -u.radius*1.2); ctx.lineTo(0, u.radius*1.2);
          ctx.stroke();
          ctx.fillStyle = '#8b8574';
          ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
      } 
      else if (u.name === 'Ikki Rebel') { 
          ctx.strokeStyle = `rgba(27, 25, 24, 0.5)`; 
          ctx.lineWidth = 2; 
          ctx.beginPath(); 
          ctx.arc(0, 0, Math.max(0.1, u.radius), 0, Math.PI*2); 
          ctx.stroke(); 
      } 
      else if (u.type === 'cavalry') { 
          ctx.fillStyle = COLORS.ink; 
          ctx.beginPath(); 
          ctx.ellipse(0, 0, Math.max(0.1, u.radius), Math.max(0.1, u.radius*0.6), 0, 0, Math.PI*2); 
          ctx.fill(); ctx.stroke(); 
          ctx.beginPath(); 
          ctx.ellipse(u.radius*0.8, 0, Math.max(0.1, u.radius*0.5), Math.max(0.1, u.radius*0.4), 0, 0, Math.PI*2); 
          ctx.fill(); 
          ctx.fillStyle = u.color; 
          ctx.beginPath(); 
          ctx.arc(-u.radius*0.2, 0, Math.max(0.1, u.radius*0.6), 0, Math.PI*2); 
          ctx.fill(); ctx.stroke(); 
          ctx.strokeStyle = COLORS.parchment; 
          ctx.lineWidth = 5; 
          ctx.beginPath(); 
          ctx.moveTo(0, u.radius*0.6); 
          ctx.lineTo(u.radius*4.0 + sw, u.radius*0.6); 
          ctx.stroke(); 
          ctx.fillStyle = COLORS.parchment; 
          ctx.beginPath(); 
          ctx.moveTo(u.radius*4.0 + sw, u.radius*0.6); 
          ctx.lineTo(u.radius*4.8 + sw, u.radius*0.2); 
          ctx.lineTo(u.radius*4.8 + sw, u.radius*1.0); 
          ctx.closePath(); 
          ctx.fill(); ctx.stroke(); 
      }
      else if (u.type === 'assassin') {
          ctx.fillStyle = COLORS.ink; 
          ctx.beginPath(); ctx.ellipse(-2, 0, Math.max(0.1, u.radius*0.8), Math.max(0.1, u.radius*1.2), 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = COLORS.vermilion; ctx.fillRect(-u.radius*0.8, -3, u.radius*1.6, 6);
          ctx.strokeStyle = '#8b8574'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(u.radius*0.8, 0); ctx.lineTo(u.radius*1.8 + sw, 0); ctx.stroke();
      }
      else if (u.type === 'boss') { 
          ctx.save(); 
          ctx.shadowBlur = 30; 
          ctx.shadowColor = 'rgba(184, 66, 53, 0.9)'; 
          ctx.strokeStyle = 'rgba(184, 66, 53, 0.6)'; 
          ctx.lineWidth = 4; 
          ctx.beginPath(); 
          ctx.arc(0, 0, u.radius + 20, 0, Math.PI*2); 
          ctx.stroke(); 
          ctx.restore(); 
          ctx.fillStyle = u.color;
          ctx.beginPath(); 
          ctx.ellipse(-2, 0, Math.max(0.1, u.radius*0.7), Math.max(0.1, u.radius*1.3), 0, 0, Math.PI*2); 
          ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.ink; 
          ctx.beginPath(); ctx.moveTo(0, -u.radius*0.5); ctx.lineTo(u.radius*1.2, -u.radius*0.9); ctx.lineTo(u.radius*0.5, 0); ctx.fill(); 
          ctx.beginPath(); ctx.moveTo(0, u.radius*0.5); ctx.lineTo(u.radius*1.2, u.radius*0.9); ctx.lineTo(u.radius*0.5, 0); ctx.fill(); 
          ctx.fillStyle = u.color; 
          ctx.beginPath(); ctx.arc(0, 0, Math.max(0.1, u.radius*0.6), 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.navy; 
          ctx.beginPath(); ctx.roundRect(0 + sw, u.radius*0.8, Math.max(0.1, u.radius*2.8), 16, 4); ctx.fill(); ctx.stroke(); 
      } 
      else if (u.type === 'hero') { 
          ctx.fillStyle = u.color; 
          ctx.beginPath(); ctx.ellipse(-2, 0, Math.max(0.1, u.radius*0.9), Math.max(0.1, u.radius*1.4), 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.gold; 
          ctx.beginPath(); ctx.moveTo(-u.radius*0.5, -u.radius); ctx.lineTo(u.radius*0.8, -u.radius*1.5); ctx.lineTo(0, -u.radius*0.5); ctx.fill(); ctx.stroke(); 
          ctx.beginPath(); ctx.moveTo(-u.radius*0.5, u.radius); ctx.lineTo(u.radius*0.8, u.radius*1.5); ctx.lineTo(0, u.radius*0.5); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = u.color; 
          ctx.beginPath(); ctx.arc(0, 0, Math.max(0.1, u.radius*0.7), 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.ink; 
          ctx.beginPath(); ctx.roundRect(-10, u.radius*0.8, Math.max(0.1, u.radius*3.5 + sw), 12, 3); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.parchment; 
          ctx.beginPath(); ctx.moveTo(0, u.radius*0.8+2); ctx.lineTo(u.radius*3.2 + sw, u.radius*0.8+2); ctx.lineTo(u.radius*3.5 + sw, u.radius*0.8+6); ctx.lineTo(u.radius*3.2 + sw, u.radius*0.8+10); ctx.lineTo(0, u.radius*0.8+10); ctx.fill(); ctx.stroke(); 
      } 
      else if (u.type === 'shield') { 
          ctx.fillStyle = u.color; 
          ctx.beginPath(); ctx.ellipse(-2, 0, Math.max(0.1, u.radius*0.8), Math.max(0.1, u.radius*1.2), 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.parchment; 
          ctx.beginPath(); ctx.arc(0, 0, Math.max(0.1, u.radius*0.65), 0, Math.PI*2); ctx.fill(); ctx.stroke(); 
          ctx.fillStyle = COLORS.khaki; 
          ctx.beginPath(); ctx.roundRect(u.radius - 2, -u.radius*1.8, 8, Math.max(0.1, u.radius*3.6), 4); ctx.fill(); ctx.stroke(); 
          ctx.strokeStyle = '#1b1918'; ctx.lineWidth = 2; 
          ctx.beginPath(); ctx.moveTo(u.radius - 2, -u.radius*1.8); ctx.lineTo(u.radius+6, u.radius*1.8); ctx.stroke(); 
          ctx.beginPath(); ctx.moveTo(u.radius+6, -u.radius*1.8); ctx.lineTo(u.radius - 2, u.radius*1.8); ctx.stroke(); 
      } 
      else {
        ctx.fillStyle = u.color; 
        ctx.beginPath(); ctx.ellipse(-2, 0, Math.max(0.1, u.radius*0.8), Math.max(0.1, u.radius*1.2), 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        
        if (u.weapon === 'bow') { 
            ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 5; 
            ctx.beginPath(); ctx.arc(u.radius, 2, Math.max(0.1, u.radius*1.8), -Math.PI/2.5, Math.PI/2); ctx.stroke(); 
        } 
        else if (u.weapon === 'staff') { 
            ctx.strokeStyle = COLORS.jade; ctx.lineWidth = 4; 
            ctx.beginPath(); ctx.moveTo(u.radius, 0); ctx.lineTo(u.radius*3, 0); ctx.stroke(); 
            ctx.fillStyle = COLORS.parchment; ctx.beginPath(); ctx.arc(u.radius*3, 0, 5, 0, Math.PI*2); ctx.fill(); 
        }
        if (u.type === 'flying') { 
            const flap = Math.sin(performance.now() / 150) * 8; 
            ctx.fillStyle = COLORS.ink; 
            ctx.beginPath(); ctx.ellipse(-5, -u.radius - 5, Math.max(0.1, u.radius), Math.max(0.1, Math.abs(5 + flap)), 0, 0, Math.PI*2); ctx.fill(); 
            ctx.beginPath(); ctx.ellipse(-5, u.radius + 5, Math.max(0.1, u.radius), Math.max(0.1, Math.abs(5 - flap)), 0, 0, Math.PI*2); ctx.fill(); 
        }
        ctx.fillStyle = u.type === 'flying' ? COLORS.vermilion : COLORS.parchment; 
        ctx.beginPath(); ctx.arc(0, 0, Math.max(0.1, u.radius*0.6), 0, Math.PI*2); ctx.fill(); ctx.stroke();
      }
      
      if (u.maxHp > 100) { 
          ctx.rotate(u.team === 'player' ? Math.PI/2 : -Math.PI/2); 
          ctx.fillStyle = '#1b1918'; ctx.fillRect(-15, u.radius + 5, 30, 4); 
          ctx.fillStyle = '#b84235'; ctx.fillRect(-15, u.radius + 5, Math.max(0, 30 * (u.hp / u.maxHp)), 4); 
      }
      if (u.deathFlash > 0) { 
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; 
          ctx.beginPath(); 
          ctx.arc(0, 0, Math.max(u.radius, 20), 0, Math.PI*2); 
          ctx.fill(); 
      }
      ctx.restore();
    };
