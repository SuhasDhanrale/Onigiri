import { V_WIDTH, V_HEIGHT } from '../config/constants.js';

function wave(effect) {
  const maxLife = effect.maxLife || 1;
  return 1 - Math.max(0, Math.min(1, effect.life / maxLife));
}

function alpha(effect, mult = 1) {
  const maxLife = effect.maxLife || 1;
  return Math.max(0, Math.min(1, effect.life / maxLife)) * mult;
}

function seeded(seed, salt = 0) {
  const n = Math.sin((seed || 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function drawPolygon(ctx, radius, points, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const a = rotation + (i / points) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function pushFx(s, effect) {
  if (!s.visualEffects) s.visualEffects = [];
  if (s.visualEffects.length > 90) s.visualEffects.splice(0, s.visualEffects.length - 90);
  const maxLife = effect.maxLife ?? effect.life ?? 1;
  s.visualEffects.push({
    layer: 'foreground',
    seed: Math.floor(Math.random() * 100000),
    maxLife,
    life: maxLife,
    ...effect,
  });
}

export function drawSumiChakra(ctx, x, y, radius, color, progress, options = {}) {
  const spin = (options.spin || 1) * progress * Math.PI * 2 + (options.rotation || 0);
  const fade = options.alpha ?? 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, options.floor ? 0.42 : 1);
  ctx.rotate(spin);
  ctx.globalAlpha *= fade;
  ctx.strokeStyle = color;
  ctx.lineWidth = options.thick ? 5 : 2;
  ctx.setLineDash(options.dashed ? [radius * 0.18, radius * 0.08] : []);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.lineWidth = 1.5;
  drawPolygon(ctx, radius * 0.72, 3, -Math.PI / 2);
  ctx.stroke();
  drawPolygon(ctx, radius * 0.72, 3, Math.PI / 2);
  ctx.stroke();

  ctx.rotate(-spin * 1.7);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * radius * 0.48, Math.sin(a) * radius * 0.48, Math.max(2, radius * 0.025), 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

function drawShockwave(ctx, effect) {
  const t = wave(effect);
  const a = alpha(effect, 0.9);
  const radius = (effect.radius || 100) * (0.25 + t * 1.1);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = effect.color || '#dfd4ba';
  ctx.globalAlpha = a;
  ctx.lineWidth = Math.max(2, (1 - t) * 14);
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth *= 0.35;
  ctx.globalAlpha = a * 0.55;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawInkBurst(ctx, effect) {
  const t = wave(effect);
  const a = alpha(effect, 0.85);
  const rays = effect.rays || 14;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.globalAlpha = a;
  ctx.strokeStyle = effect.color || '#1b1918';
  ctx.lineCap = 'round';
  for (let i = 0; i < rays; i++) {
    const jitter = seeded(effect.seed, i) * 0.8 - 0.4;
    const angle = (i / rays) * Math.PI * 2 + jitter;
    const len = (effect.radius || 80) * (0.35 + seeded(effect.seed, i + 20) * 0.75) * (0.4 + t);
    ctx.lineWidth = Math.max(2, (1 - t) * 9 * seeded(effect.seed, i + 40));
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * len * 0.18, Math.sin(angle) * len * 0.18);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSummon(ctx, effect) {
  const t = wave(effect);
  const a = alpha(effect, 1);
  const pulse = 1 + Math.sin(t * Math.PI) * 0.28;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  drawSumiChakra(ctx, effect.x, effect.y, (effect.radius || 120) * pulse, effect.color || '#b84235', t, {
    alpha: a,
    dashed: true,
    floor: true,
    thick: true,
    spin: 0.65,
  });
  drawShockwave(ctx, { ...effect, radius: (effect.radius || 120) * 1.2, color: effect.color || '#b84235' });
  ctx.restore();
}

function drawGokiMine(ctx, hazard, now) {
  const warning = hazard.armTimer > 0;
  const pulse = 0.5 + Math.sin(now / 90 + hazard.seed) * 0.5;
  const activeAlpha = warning ? 0.45 + pulse * 0.16 : Math.min(0.8, hazard.life / 3);
  const crackColor = warning ? '#dfd4ba' : '#1b1918';

  ctx.save();
  ctx.translate(hazard.x, hazard.y);
  ctx.globalAlpha = activeAlpha;
  const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, hazard.radius);
  grad.addColorStop(0, warning ? 'rgba(139, 115, 85, 0.16)' : 'rgba(139, 115, 85, 0.55)');
  grad.addColorStop(0.72, warning ? 'rgba(27, 25, 24, 0.12)' : 'rgba(27, 25, 24, 0.32)');
  grad.addColorStop(1, 'rgba(27, 25, 24, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = warning ? '#dfd4ba' : '#8b7355';
  ctx.lineWidth = warning ? 3 : 5;
  ctx.setLineDash(warning ? [12, 7] : []);
  ctx.beginPath();
  ctx.arc(0, 0, hazard.radius * (warning ? 0.88 + pulse * 0.05 : 0.9), 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = crackColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'square';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + seeded(hazard.seed, i) * 0.45;
    const mid = hazard.radius * (0.18 + seeded(hazard.seed, i + 8) * 0.18);
    const end = hazard.radius * (0.62 + seeded(hazard.seed, i + 16) * 0.24);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * mid, Math.sin(a) * mid);
    ctx.lineTo(Math.cos(a + 0.15) * end, Math.sin(a + 0.15) * end);
    ctx.stroke();
  }

  ctx.fillStyle = warning ? '#8b7355' : '#1b1918';
  ctx.beginPath();
  ctx.arc(0, 0, warning ? 9 + pulse * 4 : 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawKashaZone(ctx, hazard, now) {
  const warning = hazard.armTimer > 0;
  const t = Math.max(0, 1 - hazard.life / (hazard.maxLife || 5));
  const pulse = 0.5 + Math.sin(now / 70 + hazard.seed) * 0.5;

  ctx.save();
  ctx.translate(hazard.x, hazard.y);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = warning ? 0.36 + pulse * 0.1 : Math.min(0.72, hazard.life / 2.7);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, hazard.radius);
  grad.addColorStop(0, warning ? 'rgba(234, 88, 12, 0.14)' : 'rgba(255, 190, 80, 0.36)');
  grad.addColorStop(0.55, warning ? 'rgba(184, 66, 53, 0.18)' : 'rgba(234, 88, 12, 0.36)');
  grad.addColorStop(1, 'rgba(184, 66, 53, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, hazard.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate((now / 520) + hazard.seed);
  ctx.strokeStyle = warning ? '#dfd4ba' : '#ea580c';
  ctx.lineWidth = warning ? 2.5 : 4;
  ctx.setLineDash(warning ? [7, 9] : [18, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, hazard.radius * (0.78 + pulse * 0.04), 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const inner = hazard.radius * 0.22;
    const outer = hazard.radius * (0.76 + Math.sin(t * Math.PI) * 0.12);
    ctx.strokeStyle = i % 2 === 0 ? '#ffb703' : '#b84235';
    ctx.lineWidth = warning ? 2 : 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.quadraticCurveTo(Math.cos(a + 0.22) * outer * 0.62, Math.sin(a + 0.22) * outer * 0.62, Math.cos(a + 0.42) * outer, Math.sin(a + 0.42) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLightning(ctx, effect) {
  const a = alpha(effect, 1);
  const branches = effect.branches || 4;
  const startY = effect.startY ?? -120;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass === 0 ? '#facc15' : '#ffffff';
    ctx.lineWidth = (pass === 0 ? 14 : 5) * a;
    ctx.globalAlpha = a * (pass === 0 ? 0.55 : 0.9);
    ctx.beginPath();
    ctx.moveTo(effect.x + (seeded(effect.seed, 1) - 0.5) * 70, startY);
    const segments = 7;
    for (let i = 1; i <= segments; i++) {
      const p = i / segments;
      const x = effect.x + (seeded(effect.seed, i + pass * 20) - 0.5) * 95 * (1 - p * 0.25);
      const y = startY + (effect.y - startY) * p;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.globalAlpha = a * 0.75;
  for (let i = 0; i < branches; i++) {
    const angle = -Math.PI / 2 + (seeded(effect.seed, i + 40) - 0.5) * 2.2;
    const len = 45 + seeded(effect.seed, i + 50) * 55;
    ctx.beginPath();
    ctx.moveTo(effect.x, effect.y);
    ctx.lineTo(effect.x + Math.cos(angle) * len, effect.y + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGroundStar(ctx, effect) {
  const t = wave(effect);
  const a = alpha(effect, 0.9);
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = effect.color || '#facc15';
  ctx.lineWidth = Math.max(2, 8 * (1 - t));
  ctx.globalAlpha = a;
  const rays = 10;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    const len = (effect.radius || 74) * (0.3 + t * 0.95);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 12, Math.sin(angle) * 12);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSlashArc(ctx, effect) {
  const t = wave(effect);
  const a = alpha(effect, 0.95);
  const radius = effect.radius || 74;
  const sweep = effect.sweep || Math.PI * 0.78;
  const rotation = effect.rotation || 0;

  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(rotation);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = a;
  ctx.lineCap = 'round';

  ctx.strokeStyle = effect.color || '#dfd4ba';
  ctx.lineWidth = Math.max(2, (1 - t) * 18);
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.7 + t * 0.25), -sweep / 2, sweep / 2);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = a * 0.75;
  ctx.lineWidth = Math.max(1, (1 - t) * 6);
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.62 + t * 0.22), -sweep / 2 + 0.12, sweep / 2 - 0.12);
  ctx.stroke();
  ctx.restore();
}

function drawImpactSparks(ctx, effect) {
  const t = wave(effect);
  const a = alpha(effect, 0.95);
  const rays = effect.rays || 8;
  const radius = effect.radius || 48;

  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = a;
  ctx.lineCap = 'round';
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2 + seeded(effect.seed, i) * 0.42;
    const inner = radius * (0.08 + t * 0.15);
    const outer = radius * (0.45 + t * (0.55 + seeded(effect.seed, i + 10) * 0.35));
    ctx.strokeStyle = i % 3 === 0 ? '#ffffff' : (effect.color || '#d4af37');
    ctx.lineWidth = Math.max(1, (1 - t) * (5 + seeded(effect.seed, i + 20) * 4));
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.fillStyle = effect.core || '#dfd4ba';
  ctx.globalAlpha = a * 0.75;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(2, radius * 0.12 * (1 - t)), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSmokePuff(ctx, effect) {
  const t = wave(effect);
  const a = alpha(effect, 0.55);
  const radius = effect.radius || 52;
  const puffs = effect.puffs || 6;

  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.globalAlpha = a;
  for (let i = 0; i < puffs; i++) {
    const angle = (i / puffs) * Math.PI * 2 + seeded(effect.seed, i) * 0.7;
    const dist = radius * t * (0.25 + seeded(effect.seed, i + 10) * 0.55);
    const r = radius * (0.22 + seeded(effect.seed, i + 20) * 0.22) * (0.75 + t);
    const grad = ctx.createRadialGradient(Math.cos(angle) * dist, Math.sin(angle) * dist, 0, Math.cos(angle) * dist, Math.sin(angle) * dist, r);
    grad.addColorStop(0, effect.color || 'rgba(27, 25, 24, 0.55)');
    grad.addColorStop(1, 'rgba(27, 25, 24, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawAura(ctx, effect) {
  const t = wave(effect);
  const a = alpha(effect, 0.9);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  drawSumiChakra(ctx, effect.x, effect.y, (effect.radius || 100) * (0.8 + t * 0.45), effect.color || '#d4af37', t, {
    alpha: a,
    dashed: true,
    floor: true,
    spin: effect.spin || 0.35,
  });
  ctx.restore();
}

function drawDragonCrest(ctx, effect) {
  const a = alpha(effect, 1);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = a;
  const y = effect.y;
  const grad = ctx.createLinearGradient(0, y - 100, 0, y + 100);
  grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
  grad.addColorStop(0.45, 'rgba(56, 189, 248, 0.34)');
  grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.5)');
  grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(-200, y - 115, V_WIDTH + 400, 230);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let x = -80; x <= V_WIDTH + 80; x += 40) {
    const yy = y + Math.sin((x / 90) + effect.seed) * 22;
    if (x === -80) ctx.moveTo(x, yy);
    else ctx.lineTo(x, yy);
  }
  ctx.stroke();
  ctx.restore();
}

function drawFoxWall(ctx, effect) {
  const a = alpha(effect, 1);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const grad = ctx.createLinearGradient(0, effect.yTop, 0, effect.yBottom);
  grad.addColorStop(0, `rgba(234, 88, 12, ${0.04 * a})`);
  grad.addColorStop(0.45, `rgba(234, 88, 12, ${0.22 * a})`);
  grad.addColorStop(1, `rgba(184, 66, 53, ${0.08 * a})`);
  ctx.fillStyle = grad;
  ctx.fillRect(-200, effect.yTop, V_WIDTH + 400, effect.yBottom - effect.yTop);

  for (let i = 0; i < 16; i++) {
    const x = (i / 15) * V_WIDTH;
    const flame = 35 + seeded(effect.seed, i) * 55;
    const y = effect.yBottom - seeded(effect.seed, i + 20) * (effect.yBottom - effect.yTop);
    ctx.fillStyle = i % 2 ? '#ffb703' : '#ea580c';
    ctx.globalAlpha = a * (0.28 + seeded(effect.seed, i + 30) * 0.22);
    ctx.beginPath();
    ctx.moveTo(x, y + flame * 0.45);
    ctx.quadraticCurveTo(x + 28, y, x, y - flame);
    ctx.quadraticCurveTo(x - 18, y, x, y + flame * 0.45);
    ctx.fill();
  }
  ctx.restore();
}

function drawScreenPulse(ctx, effect) {
  const a = alpha(effect, 0.34);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const grad = ctx.createRadialGradient(effect.x ?? V_WIDTH / 2, effect.y ?? V_HEIGHT / 2, 0, V_WIDTH / 2, V_HEIGHT / 2, V_WIDTH * 0.8);
  grad.addColorStop(0, `${effect.color || 'rgba(184, 66, 53, 1)'}`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = a;
  ctx.fillStyle = grad;
  ctx.fillRect(-400, -400, V_WIDTH + 800, V_HEIGHT + 800);
  ctx.restore();
}

export function drawBossHazardFx(ctx, hazard, now) {
  if (hazard.type === 'mud_mine') drawGokiMine(ctx, hazard, now);
  else if (hazard.type === 'fire_zone') drawKashaZone(ctx, hazard, now);
}

export function drawVisualEffect(ctx, effect) {
  if (effect.delay > 0) return;
  switch (effect.kind) {
    case 'summon_chakra': drawSummon(ctx, effect); break;
    case 'shockwave': drawShockwave(ctx, effect); break;
    case 'ink_burst': drawInkBurst(ctx, effect); break;
    case 'lightning': drawLightning(ctx, effect); break;
    case 'ground_star': drawGroundStar(ctx, effect); break;
    case 'slash_arc': drawSlashArc(ctx, effect); break;
    case 'impact_sparks': drawImpactSparks(ctx, effect); break;
    case 'smoke_puff': drawSmokePuff(ctx, effect); break;
    case 'aura': drawAura(ctx, effect); break;
    case 'dragon_crest': drawDragonCrest(ctx, effect); break;
    case 'fox_wall': drawFoxWall(ctx, effect); break;
    case 'screen_pulse': drawScreenPulse(ctx, effect); break;
    default: break;
  }
}
