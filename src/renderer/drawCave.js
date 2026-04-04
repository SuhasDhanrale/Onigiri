import { CAVE_CONFIG } from '../config/cave.js';
import { COLORS } from '../config/colors.js';

export function drawCave(ctx, s, now) {
  if (!s.cave || !s.orb) {
    console.log('drawCave: missing cave or orb state', { cave: s.cave, orb: s.orb });
    return;
  }

  const pulse = 0.8 + Math.sin(now / 300) * 0.2;

  // Draw cave (always visible at top)
  const cave = s.cave;
  ctx.save();
  
  // Cave glow - large visible glow
  const caveGrad = ctx.createRadialGradient(cave.x, cave.y, 0, cave.x, cave.y, cave.radius * 2);
  caveGrad.addColorStop(0, 'rgba(122, 92, 97, 0.8)');
  caveGrad.addColorStop(0.5, 'rgba(122, 92, 97, 0.4)');
  caveGrad.addColorStop(1, 'rgba(122, 92, 97, 0)');
  ctx.fillStyle = caveGrad;
  ctx.beginPath();
  ctx.arc(cave.x, cave.y, cave.radius * 2, 0, Math.PI * 2);
  ctx.fill();

  // Cave body - larger and more visible
  ctx.fillStyle = '#7a5c61';
  ctx.beginPath();
  ctx.arc(cave.x, cave.y, cave.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Cave border
  ctx.strokeStyle = '#5a3c41';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Cave inner (dark portal)
  ctx.fillStyle = '#1b1918';
  ctx.beginPath();
  ctx.arc(cave.x, cave.y, cave.radius * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Cave HP bar
  const hpPct = cave.hp / cave.maxHp;
  const barW = 120;
  const barH = 12;
  const barX = cave.x - barW / 2;
  const barY = cave.y - cave.radius - 30;

  // HP bar background
  ctx.fillStyle = '#1b1918';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
  ctx.fillStyle = '#4c4947';
  ctx.fillRect(barX, barY, barW, barH);
  
  // HP bar fill
  ctx.fillStyle = '#b84235';
  ctx.fillRect(barX, barY, barW * hpPct, barH);
  
  // HP text
  ctx.fillStyle = '#dfd4ba';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`CAVE ${Math.ceil(cave.hp)}/${cave.maxHp}`, cave.x, barY + barH / 2);

  ctx.restore();

  // Draw orb (if active)
  const orb = s.orb;
  if (orb.active && orb.hp > 0) {
    ctx.save();

    // Orb glow - prominent pulsing glow
    const orbGrad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius * 3);
    orbGrad.addColorStop(0, `rgba(184, 66, 53, ${0.7 * pulse})`);
    orbGrad.addColorStop(0.5, `rgba(184, 66, 53, ${0.3 * pulse})`);
    orbGrad.addColorStop(1, 'rgba(184, 66, 53, 0)');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius * 3, 0, Math.PI * 2);
    ctx.fill();

    // Orb body
    ctx.fillStyle = '#b84235';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Orb border
    ctx.strokeStyle = '#ff6b5b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Orb inner highlight
    ctx.fillStyle = '#ff6b5b';
    ctx.beginPath();
    ctx.arc(orb.x - orb.radius * 0.25, orb.y - orb.radius * 0.25, orb.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Orb HP bar
    const orbHpPct = orb.hp / orb.maxHp;
    const orbBarW = 80;
    const orbBarH = 10;
    const orbBarX = orb.x - orbBarW / 2;
    const orbBarY = orb.y - orb.radius - 25;

    // HP bar background
    ctx.fillStyle = '#1b1918';
    ctx.fillRect(orbBarX - 2, orbBarY - 2, orbBarW + 4, orbBarH + 4);
    ctx.fillStyle = '#4c4947';
    ctx.fillRect(orbBarX, orbBarY, orbBarW, orbBarH);
    
    // HP bar fill
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(orbBarX, orbBarY, orbBarW * orbHpPct, orbBarH);

    ctx.restore();
  } else if (orb.respawnTimer !== undefined && orb.respawnTimer > 0) {
    // Show respawn indicator
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#dfd4ba';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Orb respawns in ${Math.ceil(orb.respawnTimer)}s`, orb.x, orb.y);
    ctx.restore();
  }
}
