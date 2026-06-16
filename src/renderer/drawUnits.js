import { COLORS } from '../config/colors.js';
import { spriteRenderer } from './SpriteRenderer.js';
import { drawChapterBossVisual, hasChapterBossVisual } from './drawBossVisuals.js';

function getSpriteId(unit) {
  if (unit.name === 'Bamboo Barricade') return null;
  if (unit.name === 'Arrow Tower') return null;
  
  if (unit.team === 'player') {
    switch (unit.type) {
      case 'melee': return 'hatamoto';
      case 'ranged': return 'yumi-archer';
      case 'siege': return 'horoku';
      case 'cavalry': return 'cavalry';
      case 'hero': return 'champion';
    }
  } else {
    switch (unit.type) {
      case 'flying': return 'tengu/tengu-flier';
      case 'support': return 'onmyoji/onmyoji';
      case 'assassin': return 'shinobi/shinobi';
      case 'boss': return 'oni/great-oni';
      case 'melee': return 'rebels/ikki-rebel';
    }
  }
  return null;
}

function drawProceduralUnit(ctx, u) {
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
  else if (u.name === 'Arrow Tower') {
      ctx.save();
      // Counter-rotate so the tower stands vertically regardless of unit team orientation
      ctx.rotate(u.team === 'player' ? Math.PI/2 : -Math.PI/2);

      const r = u.radius * 1.3; // Make it significantly bigger
      
      // Draw Legs
      ctx.strokeStyle = '#3d2b1f';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      // Left leg
      ctx.moveTo(-r*0.6, r*0.6); ctx.lineTo(-r*0.4, -r*1.2);
      // Right leg
      ctx.moveTo(r*0.6, r*0.6); ctx.lineTo(r*0.4, -r*1.2);
      // Cross braces
      ctx.moveTo(-r*0.5, -r*0.2); ctx.lineTo(r*0.45, -r*0.8);
      ctx.moveTo(r*0.5, -r*0.2); ctx.lineTo(-r*0.45, -r*0.8);
      ctx.moveTo(-r*0.55, r*0.4); ctx.lineTo(r*0.5, -r*0.1);
      ctx.moveTo(r*0.55, r*0.4); ctx.lineTo(-r*0.5, -r*0.1);
      ctx.stroke();

      // Platform Base
      ctx.fillStyle = '#4a3b2c';
      ctx.fillRect(-r*0.9, -r*1.4, r*1.8, r*0.2);
      ctx.strokeRect(-r*0.9, -r*1.4, r*1.8, r*0.2);

      // Cabin / Walls
      ctx.fillStyle = '#e8dcc4'; // Plaster color
      ctx.fillRect(-r*0.7, -r*2.6, r*1.4, r*1.2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#3d2b1f';
      ctx.strokeRect(-r*0.7, -r*2.6, r*1.4, r*1.2);

      // Wooden beams on cabin
      ctx.beginPath();
      ctx.moveTo(-r*0.7, -r*2.0); ctx.lineTo(r*0.7, -r*2.0);
      ctx.moveTo(0, -r*2.6); ctx.lineTo(0, -r*1.4);
      ctx.stroke();

      // Archery Slits (Windows)
      ctx.fillStyle = '#1a1816';
      ctx.fillRect(-r*0.4, -r*2.3, r*0.2, r*0.6);
      ctx.fillRect(r*0.2, -r*2.3, r*0.2, r*0.6);

      // Roof (Japanese style)
      ctx.fillStyle = '#8b2e2e'; // Crimson roof
      ctx.beginPath();
      ctx.moveTo(-r*1.1, -r*2.6);
      ctx.lineTo(r*1.1, -r*2.6);
      ctx.quadraticCurveTo(r*0.5, -r*3.4, 0, -r*3.6);
      ctx.quadraticCurveTo(-r*0.5, -r*3.4, -r*1.1, -r*2.6);
      ctx.fill();
      
      // Roof outline
      ctx.strokeStyle = '#1a1816';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top Finial
      ctx.fillStyle = '#d4af37'; // Gold
      ctx.beginPath();
      ctx.arc(0, -r*3.7, r*0.15, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
      // Restore line width for subsequent drawing just in case
      ctx.lineWidth = 3;
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
      ctx.lineTo(u.radius*2.8 + sw, u.radius*0.6); 
      ctx.stroke(); 
  } 
  else if (u.type === 'assassin') {
      ctx.fillStyle = COLORS.ink; 
      ctx.beginPath(); ctx.ellipse(-2, 0, Math.max(0.1, u.radius*0.8), Math.max(0.1, u.radius*1.2), 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = COLORS.vermilion; ctx.fillRect(-u.radius*0.8, -3, u.radius*1.6, 6);
      ctx.strokeStyle = '#8b8574'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(u.radius*0.8, 0); ctx.lineTo(u.radius*1.8 + sw, 0); ctx.stroke();
  }
  else if (u.type === 'boss') { 
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
}

export const drawUnitTopDown = (ctx, u) => {
  ctx.save(); 
  ctx.translate(u.x, u.y); 
  const now = performance.now();

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

  // Enraged (Onmyoji buff) — pulsing vermilion glow so the boosted unit reads at a glance
  if (u.rageTimer > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(now / 90);
      ctx.strokeStyle = `rgba(184, 66, 53, ${0.45 + 0.35 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.1, u.radius + 5 + pulse * 3), 0, Math.PI*2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(184, 66, 53, 0.12)';
      ctx.fill();
  }

  // Onmyoji chain whip — segmented chain that reaches toward the target ally and retracts
  if (u.chain) {
      const p = Math.min(1, u.chain.t / u.chain.dur);
      const reach = 1 - Math.abs(p - 0.5) * 2; // 0 → 1 → 0 across the swing
      const dx = (u.chain.tx - u.x) * reach;
      const dy = (u.chain.ty - u.y) * reach;
      const links = 8;
      ctx.strokeStyle = '#6b6256';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dx, dy); ctx.stroke();
      ctx.fillStyle = COLORS.vermilion;
      for (let li = 1; li <= links; li++) {
          const f = li / links;
          ctx.beginPath(); ctx.arc(dx * f, dy * f, 3, 0, Math.PI*2); ctx.fill();
      }
      // Charm at the chain's tip
      ctx.fillStyle = COLORS.parchment;
      ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI*2); ctx.fill();
  }

  if (u.isChapterBoss && hasChapterBossVisual(u.bossId)) {
      drawChapterBossVisual(ctx, u, now / 1000);
      ctx.restore();
      return;
  }
  
  ctx.rotate(u.team === 'player' ? -Math.PI/2 : Math.PI/2);

  const spriteId = getSpriteId(u);
  const useSprite = spriteId && spriteRenderer.hasSprite(spriteId);
  
  if (useSprite) {
    // Counter-rotate so sprites face correct direction (up for player, down for enemy)
    ctx.rotate(Math.PI / 2);
    
    const sprite = spriteRenderer.getSprite(spriteId);
    const scale = u.radius / sprite.radius;
    
    // Visual-only animation timer (independent of swingPhase decay rate)
    const attackDuration = sprite.animations?.attack?.duration || 200;
    
    // Track previous attackCooldown to detect the frame it was reset (ranged/siege trigger)
    if (u._prevAttackCooldown === undefined) u._prevAttackCooldown = 0;
    const cooldownJustReset = u.attackCooldown > u._prevAttackCooldown && u.attackCooldown > (u.attackSpeed * 0.8);
    u._prevAttackCooldown = u.attackCooldown;

    // Trigger animation: swingPhase for melee, cooldown-reset for ranged/siege/boss
    const justAttacked = u.swingPhase > 0.01 || cooldownJustReset;

    if (justAttacked && !u._visAnimStart) {
      u._visAnimStart = performance.now();
    }

    // Calculate animation progress based on sprite's intended duration
    let animState = 'idle';
    let animProgress = 0;

    if (u._visAnimStart) {
      const elapsed = performance.now() - u._visAnimStart;
      animProgress = Math.min(1, elapsed / attackDuration);
      animState = 'attack';

      if (animProgress >= 1) {
        u._visAnimStart = null;
      }
    } else {
      const idleDuration = sprite.animations?.idle?.duration || 1000;
      if (idleDuration > 0) {
        animState = 'idle';
        animProgress = (performance.now() % idleDuration) / idleDuration;
      }
    }
    
    spriteRenderer.draw(ctx, spriteId, 0, 0, animState, animProgress, scale);
    
    if (u.maxHp > 100) { 
        ctx.rotate(u.team === 'player' ? Math.PI/2 : -Math.PI/2); 
        ctx.fillStyle = '#1b1918'; ctx.fillRect(-15, u.radius + 5, 30, 4); 
        ctx.fillStyle = '#b84235'; ctx.fillRect(-15, u.radius + 5, Math.max(0, 30 * (u.hp / u.maxHp)), 4); 
    }
  } else {
    drawProceduralUnit(ctx, u);
    
    if (u.maxHp > 100) { 
        ctx.rotate(u.team === 'player' ? Math.PI/2 : -Math.PI/2); 
        ctx.fillStyle = '#1b1918'; ctx.fillRect(-15, u.radius + 5, 30, 4); 
        ctx.fillStyle = '#b84235'; ctx.fillRect(-15, u.radius + 5, Math.max(0, 30 * (u.hp / u.maxHp)), 4); 
    }
  }
  
  ctx.restore();
};
