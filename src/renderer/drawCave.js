import { CAVE_CONFIG } from '../config/cave.js';
import { COLORS } from '../config/colors.js';

export function drawCave(ctx, s, now) {
  if (!s.cave || !s.orb) {
    console.log('drawCave: missing cave or orb state', { cave: s.cave, orb: s.orb });
    return;
  }

  const pulse = 0.8 + Math.sin(now / 300) * 0.2;
  const cave = s.cave;
  const hpPct = cave.hp / cave.maxHp;
  const isRaging = hpPct < CAVE_CONFIG.rage.threshold;

  ctx.save();

  // --- Rage ring (drawn behind everything) ---
  if (isRaging) {
    const rageAlpha = 0.25 + Math.sin(now / 150) * 0.2;
    const rageGrad = ctx.createRadialGradient(cave.x, cave.y, cave.radius * 0.8, cave.x, cave.y, cave.radius * 3.5);
    rageGrad.addColorStop(0, `rgba(255, 59, 31, ${rageAlpha})`);
    rageGrad.addColorStop(1, 'rgba(255, 59, 31, 0)');
    ctx.fillStyle = rageGrad;
    ctx.beginPath();
    ctx.arc(cave.x, cave.y, cave.radius * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing outer ring stroke
    ctx.strokeStyle = `rgba(255, 59, 31, ${0.5 + Math.sin(now / 120) * 0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cave.x, cave.y, cave.radius * 1.4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- Cave glow ---
  const glowColor = isRaging ? '184, 66, 53' : '122, 92, 97';
  const caveGrad = ctx.createRadialGradient(cave.x, cave.y, 0, cave.x, cave.y, cave.radius * 2);
  caveGrad.addColorStop(0, `rgba(${glowColor}, 0.8)`);
  caveGrad.addColorStop(0.5, `rgba(${glowColor}, 0.4)`);
  caveGrad.addColorStop(1, `rgba(${glowColor}, 0)`);
  ctx.fillStyle = caveGrad;
  ctx.beginPath();
  ctx.arc(cave.x, cave.y, cave.radius * 2, 0, Math.PI * 2);
  ctx.fill();

  // --- Cave body ---
  ctx.fillStyle = '#7a5c61';
  ctx.beginPath();
  ctx.arc(cave.x, cave.y, cave.radius, 0, Math.PI * 2);
  ctx.fill();

  // Cave border — turns red in rage
  ctx.strokeStyle = isRaging ? '#ff3b1f' : '#5a3c41';
  ctx.lineWidth = isRaging ? 5 : 4;
  ctx.stroke();

  // Cave inner (dark portal)
  ctx.fillStyle = '#1b1918';
  ctx.beginPath();
  ctx.arc(cave.x, cave.y, cave.radius * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // "RAGE" label when in rage mode
  if (isRaging) {
    const rageTextAlpha = 0.7 + Math.sin(now / 200) * 0.3;
    ctx.globalAlpha = rageTextAlpha;
    ctx.fillStyle = '#ff3b1f';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠ RAGING', cave.x, cave.y);
    ctx.globalAlpha = 1;
  }

  // --- Cave HP bar ---
  const barW = 140;
  const barH = 14;
  const barX = cave.x - barW / 2;
  const barY = cave.y - cave.radius - 38;

  // HP bar background
  ctx.fillStyle = '#1b1918';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
  ctx.fillStyle = '#4c4947';
  ctx.fillRect(barX, barY, barW, barH);

  // HP bar fill — colour based on remaining HP
  let barColor;
  if (hpPct > 0.66)      barColor = '#b84235'; // Red (healthy)
  else if (hpPct > 0.33) barColor = '#d4af37'; // Gold (wounded)
  else                   barColor = '#ff3b1f'; // Bright orange-red (critical)

  // Pulsing effect when critical
  if (hpPct <= 0.33) {
    ctx.globalAlpha = 0.8 + Math.sin(now / 100) * 0.2;
  }
  ctx.fillStyle = barColor;
  ctx.fillRect(barX, barY, barW * hpPct, barH);
  ctx.globalAlpha = 1;

  // HP bar label
  ctx.fillStyle = '#dfd4ba';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`CAVE  ${Math.ceil(cave.hp)} / ${cave.maxHp}`, cave.x, barY + barH / 2);

  // "DESTROY THE CAVE" hint — shown once when cave is untouched
  if (cave.hp >= cave.maxHp) {
    ctx.globalAlpha = 0.55 + Math.sin(now / 600) * 0.15;
    ctx.fillStyle = '#dfd4ba';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▲ TARGET: DESTROY THE CAVE', cave.x, barY - 14);
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // --- Draw orb ---
  const orb = s.orb;
  if (orb.active && orb.hp > 0) {
    ctx.save();

    // Orb glow
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

    ctx.fillStyle = '#1b1918';
    ctx.fillRect(orbBarX - 2, orbBarY - 2, orbBarW + 4, orbBarH + 4);
    ctx.fillStyle = '#4c4947';
    ctx.fillRect(orbBarX, orbBarY, orbBarW, orbBarH);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(orbBarX, orbBarY, orbBarW * orbHpPct, orbBarH);

    ctx.restore();
  } else if (orb.respawnTimer !== undefined && orb.respawnTimer > 0) {
    // --- Ghost orb countdown ---
    const totalTime = CAVE_CONFIG.orb.respawnTime;
    const elapsed = totalTime - orb.respawnTimer;
    const progress = elapsed / totalTime; // 0 → 1 as timer counts down

    ctx.save();

    // Ghost orb body
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#7a5c61';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    ctx.fill();

    // Countdown arc (draws clockwise from top, filling in as time passes)
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius + 10, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.stroke();

    // Timer text inside ghost orb
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#dfd4ba';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.ceil(orb.respawnTimer)}s`, orb.x, orb.y);

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
