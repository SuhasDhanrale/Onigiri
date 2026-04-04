import { CAVE_CONFIG } from '../config/cave.js';
import { COLORS } from '../config/colors.js';

export function drawCave(ctx, s, now) {
  if (!s.cave || !s.orb) return;

  const pulse = 0.8 + Math.sin(now / 300) * 0.2;

  // Draw cave
  const cave = s.cave;
  ctx.save();
  
  // Cave glow
  const caveGrad = ctx.createRadialGradient(cave.x, cave.y, 0, cave.x, cave.y, cave.radius * 1.5);
  caveGrad.addColorStop(0, 'rgba(122, 92, 97, 0.6)');
  caveGrad.addColorStop(0.5, 'rgba(122, 92, 97, 0.3)');
  caveGrad.addColorStop(1, 'rgba(122, 92, 97, 0)');
  ctx.fillStyle = caveGrad;
  ctx.beginPath();
  ctx.arc(cave.x, cave.y, cave.radius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Cave body
  ctx.fillStyle = COLORS.spirit;
  ctx.beginPath();
  ctx.arc(cave.x, cave.y, cave.radius, 0, Math.PI * 2);
  ctx.fill();

  // Cave inner
  ctx.fillStyle = COLORS.inkDark;
  ctx.beginPath();
  ctx.arc(cave.x, cave.y, cave.radius * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Cave HP bar
  const hpPct = cave.hp / cave.maxHp;
  const barW = 100;
  const barH = 8;
  const barX = cave.x - barW / 2;
  const barY = cave.y - cave.radius - 20;

  ctx.fillStyle = COLORS.inkDark;
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = COLORS.vermilion;
  ctx.fillRect(barX, barY, barW * hpPct, barH);

  ctx.restore();

  // Draw orb (if active)
  const orb = s.orb;
  if (orb.active && orb.hp > 0) {
    ctx.save();

    // Orb glow
    const orbGrad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius * 2);
    orbGrad.addColorStop(0, `rgba(184, 66, 53, ${0.5 * pulse})`);
    orbGrad.addColorStop(0.5, `rgba(184, 66, 53, ${0.2 * pulse})`);
    orbGrad.addColorStop(1, 'rgba(184, 66, 53, 0)');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Orb body
    ctx.fillStyle = COLORS.vermilion;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Orb inner highlight
    ctx.fillStyle = '#ff6b5b';
    ctx.beginPath();
    ctx.arc(orb.x - orb.radius * 0.3, orb.y - orb.radius * 0.3, orb.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Orb HP bar
    const orbHpPct = orb.hp / orb.maxHp;
    const orbBarW = 60;
    const orbBarH = 6;
    const orbBarX = orb.x - orbBarW / 2;
    const orbBarY = orb.y - orb.radius - 15;

    ctx.fillStyle = COLORS.inkDark;
    ctx.fillRect(orbBarX, orbBarY, orbBarW, orbBarH);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(orbBarX, orbBarY, orbBarW * orbHpPct, orbBarH);

    ctx.restore();
  } else if (orb.respawnTimer !== undefined && orb.respawnTimer > 0) {
    // Show respawn indicator
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = COLORS.ink;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Orb respawns in ${Math.ceil(orb.respawnTimer)}s`, orb.x, orb.y);
    ctx.restore();
  }
}
