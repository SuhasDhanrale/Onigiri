import { COLORS } from '../config/colors.js';
import { WALL_Y, V_WIDTH } from '../config/constants.js';
import { addParticle } from './SpawnSystem.js';

/**
 * Full unit movement + combat loop. Processes all units each frame.
 * @param {object} s       - game state
 * @param {number} dt
 * @param {number} now     - performance.now()
 * @param {object} metaRef - React ref to meta state
 * @param {Function} setUiTick
 */
export function tickUnits(s, dt, now, metaRef, setUiTick) {
  const enemies = s.units.filter(u => u.team === 'enemy');
  const players = s.units.filter(u => u.team === 'player');

  for (let i = 0; i < s.units.length; i++) {
    const unit = s.units[i];

    // Tick per-unit timers
    if (unit.attackCooldown > 0) unit.attackCooldown -= dt;
    if (unit.swingPhase > 0) unit.swingPhase -= dt * 8;
    if (unit.chargeTimer > 0) {
      unit.chargeTimer -= dt;
      if (unit.team === 'player' && Math.random() < dt * 15) {
        s.particles.push({ x: unit.x + (Math.random() - 0.5) * 10, y: unit.y + 10, vx: (Math.random() - 0.5) * 30, vy: 50, life: 0.4, color: '#dfd4ba', r: 4 });
      }
    }
    if (unit.lifeSpan !== undefined) { unit.lifeSpan -= dt; if (unit.lifeSpan <= 0) { unit.hp = 0; unit.noReward = true; } }
    if (unit.burn > 0) { unit.burn -= dt; unit.hp -= 10 * dt; }

    let uSpeed = (unit.team === 'player' && s.warDrumsActive > 0) ? unit.speed * 1.5 : unit.speed;
    if (unit.chargeTimer > 0) uSpeed *= 2.0;
    const atkSpeedMult = (unit.team === 'player' && s.warDrumsActive > 0) ? 1.5 : 1.0;

    // Support healing
    if (unit.type === 'support' && unit.attackCooldown <= 0) {
      const allies = unit.team === 'enemy' ? enemies : players;
      let healed = false;
      allies.forEach(a => { if (a.id !== unit.id && Math.hypot(a.x - unit.x, a.y - unit.y) < unit.range) { a.hp = Math.min(a.maxHp, a.hp + 5); healed = true; } });
      if (healed) { s.explosions.push({ x: unit.x, y: unit.y, r: unit.range, life: 0.5, color: COLORS.jade }); unit.attackCooldown = unit.attackSpeed / atkSpeedMult; }
    }

    // Boss telegraph
    if (unit.type === 'boss' && unit.telegraphTimer > 0) {
      unit.telegraphTimer -= dt;
      if (unit.telegraphTimer <= 0) {
        s.screenShake = 0.5;
        s.explosions.push({ x: unit.x, y: unit.y, r: unit.range, life: 0.6, color: COLORS.vermilion });
        players.forEach(p => { if (Math.hypot(p.x - unit.x, p.y - unit.y) < unit.range) { p.hp -= unit.damage * 2; p.y += 100; } });
      }
      continue;
    }

    // Target finding
    let target = null; let closestSq = Infinity;
    const targetList = unit.team === 'player' ? enemies : players;
    for (let j = 0; j < targetList.length; j++) {
      const e = targetList[j];
      if (e.type === 'flying' && unit.type === 'melee') continue;
      if (unit.type === 'flying' && e.type === 'friction') continue;

      if (unit.stance === 'PATROL' && e.type === 'assassin' && e.y > 500) { target = e; closestSq = 0; break; }

      const dx = Math.abs(e.x - unit.x);
      if (unit.type === 'ranged' || unit.type === 'siege' || unit.type === 'assassin' || dx < 150) {
        const dy = e.y - unit.y;
        let canSee = false;
        if (unit.type === 'ranged' || unit.type === 'siege' || unit.type === 'assassin') canSee = true;
        else if (unit.team === 'player' && dy <= 60) canSee = true;
        else if (unit.team === 'enemy' && dy >= -60) canSee = true;

        if (canSee) {
          let distSq = dx * dx + dy * dy;
          if (unit.type === 'cavalry' && e.type === 'ranged') distSq -= 250000;
          if (unit.type === 'assassin' && (e.type === 'ranged' || e.type === 'support')) distSq -= 400000;
          if (e.taunt && distSq < 40000) { target = e; break; }
          if (distSq < closestSq) { closestSq = distSq; target = e; }
        }
      }
    }

    let engageDist = unit.radius + (target ? target.radius : 0) + 15;
    if (unit.type === 'ranged' || unit.type === 'siege') engageDist = unit.range;

    // Velocity calculation
    let vx = 0; let vy = 0;

    if (unit.team === 'player') {
      const dxGate = (V_WIDTH / 2) - unit.x;
      if (unit.stance === 'PATROL') {
        if (target && (target.type === 'assassin' || closestSq < unit.aggroRadius * unit.aggroRadius)) {
          const dx = target.x - unit.x; const dy = target.y - unit.y; const dist = Math.max(0.1, Math.hypot(dx, dy));
          vx = (dx / dist) * uSpeed; vy = (dy / dist) * uSpeed;
        } else {
          vy = (unit.defendY - unit.y) * 2.0;
          vx = uSpeed * 0.6 * (unit.patrolDir || 1);
          if (unit.x > V_WIDTH - 150) unit.patrolDir = -1;
          if (unit.x < 150) unit.patrolDir = 1;
        }
      } else if (unit.stance === 'DEFEND') {
        if (target && closestSq < unit.aggroRadius * unit.aggroRadius) {
          const dx = target.x - unit.x; const dy = target.y - unit.y; const dist = Math.max(0.1, Math.hypot(dx, dy));
          vx = (dx / dist) * uSpeed; vy = (dy / dist) * uSpeed;
        } else if (unit.defendX != null && unit.defendY != null) {
          const dxA = unit.defendX - unit.x; const dyA = unit.defendY - unit.y;
          const distAnchorSq = dxA * dxA + dyA * dyA;
          if (distAnchorSq < 16) { unit.x = unit.defendX; unit.y = unit.defendY; vx = 0; vy = 0; }
          else { const d = Math.max(0.1, Math.sqrt(distAnchorSq)); vx = (dxA / d) * uSpeed * 0.8; vy = (dyA / d) * uSpeed * 0.8; }
        }
      } else {
        if (unit.y > WALL_Y - 50 && unit.type !== 'flying') {
          if (Math.abs(dxGate) > 80) { vx = Math.sign(dxGate) * uSpeed * 0.8; vy = -uSpeed * 0.6; } else { vy = -uSpeed; }
        } else if (target && closestSq < unit.aggroRadius * unit.aggroRadius) {
          const dx = target.x - unit.x; const dy = target.y - unit.y; const dist = Math.max(0.1, Math.hypot(dx, dy));
          vx = (dx / dist) * uSpeed; vy = Math.min(0, (dy / dist) * uSpeed);
        } else {
          const alignSpeed = Math.sin((now / 400) + unit.hashOffset) * 10;
          if (unit.y > unit.advanceZone) { vy = -uSpeed; vx = alignSpeed; } else { vy = 0; vx = alignSpeed; }
        }
      }
    } else if (unit.team === 'enemy') {
      if (unit.type === 'assassin') {
        const targetEdge = (unit.hashOffset % 2 === 0) ? 50 : V_WIDTH - 50;
        const dxEdge = targetEdge - unit.x;
        if (target && closestSq < unit.aggroRadius * unit.aggroRadius) {
          const dx = target.x - unit.x; const dy = target.y - unit.y; const dist = Math.max(0.1, Math.hypot(dx, dy));
          vx = (dx / dist) * uSpeed; vy = Math.max(uSpeed * 0.2, (dy / dist) * uSpeed);
        } else if (unit.y < WALL_Y - 250) {
          if (Math.abs(dxEdge) > 20) { vx = Math.sign(dxEdge) * uSpeed; vy = uSpeed * 0.6; } else { vx = 0; vy = uSpeed; }
        } else {
          const alignSpeed = Math.sin((now / 400) + unit.hashOffset) * 10;
          vy = uSpeed; vx = alignSpeed;
        }
      } else if (target && closestSq < unit.aggroRadius * unit.aggroRadius && unit.type !== 'support') {
        const dx = target.x - unit.x; const dy = target.y - unit.y; const dist = Math.max(0.1, Math.hypot(dx, dy));
        vx = (dx / dist) * uSpeed; vy = Math.max(uSpeed * 0.2, (dy / dist) * uSpeed);
      } else {
        const alignSpeed = Math.sin((now / 400) + unit.hashOffset) * 10;
        vy = uSpeed; vx = alignSpeed;
      }
      const vanguardY = enemies.length > 0 ? Math.max(...enemies.map(e => e.y)) : 0;
      if (unit.type === 'support' && vanguardY - unit.y > 200) vy = 0;
    }

    // Combat engagement
    const isEngaged = target && closestSq <= engageDist * engageDist && unit.type !== 'support';
    if (isEngaged) {
      if (unit.name === 'Ikki Rebel') { target.hp -= unit.damage; unit.hp = 0; addParticle(s, unit.x, unit.y, COLORS.ink, 5); continue; }

      if (unit.type === 'assassin' && target.name === 'Bamboo Barricade') {
        unit.hp -= 1000; target.hp -= 1000; s.screenShake = 0.5;
        addParticle(s, target.x, target.y, COLORS.vermilion, 10, 300);
        addParticle(s, target.x, target.y, COLORS.khaki, 10, 300);
        continue;
      }

      if (unit.attackCooldown <= 0) {
        if (unit.type === 'boss' && Math.random() < 0.2) {
          unit.telegraphTimer = 0.8; unit.attackCooldown = unit.attackSpeed;
        } else if (unit.type === 'ranged') {
          const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
          const isFlaming = unit.team === 'player' && unit.name === 'Yumi Archer' && metaRef.current.unlockedTechs.includes('FLAMING_ARROWS') && Math.random() < 0.25;
          s.projectiles.push({ x: unit.x, y: unit.y, vx: Math.cos(angle) * 1200, vy: Math.sin(angle) * 1200, damage: unit.damage, team: unit.team, pierce: unit.pierce, isFlaming });
        } else if (unit.type === 'siege') {
          s.projectiles.push({ type: 'lob', startX: unit.x, startY: unit.y, targetX: target.x, targetY: target.y, progress: 0, travelTime: 1.2, damage: unit.damage, team: unit.team, z: 0 });
        } else {
          target.hp -= unit.damage;
          unit.swingPhase = 1.0;
          if (target.name === 'Bamboo Barricade' && target.team === 'player' && metaRef.current.unlockedTechs.includes('SPIKED_CALTROPS')) {
            unit.hp -= unit.damage * 0.5;
            s.floatingTexts.push({ x: unit.x, y: unit.y - 10, text: 'REFLECT', color: '#b84235', life: 0.5, vy: -30 });
          }
          if (unit.type === 'cavalry') {
            if (target.type === 'shield' || target.type === 'boss') { s.screenShake = 0.1; }
            else {
              const shoveDir = unit.team === 'player' ? -1 : 1;
              target.y += shoveDir * (unit.chargeTimer > 0 ? 180 : 60);
              target.x += (Math.random() - 0.5) * 20;
              s.screenShake = unit.chargeTimer > 0 ? 0.5 : 0.2;
              addParticle(s, target.x, target.y, '#dfd4ba', 5);
            }
          }
        }
        unit.attackCooldown = unit.attackSpeed / atkSpeedMult;
      }

      vx *= 0.15; vy *= 0.15;
      if (unit.type === 'ranged') {
        const minRangeSq = Math.pow(unit.range * 0.4, 2);
        if (closestSq < minRangeSq) { vy = (unit.team === 'player' ? 1 : -1) * uSpeed * 0.8; vx = 0; }
      }
    }

    // Position update + separation
    let newX = unit.x + (vx * dt);
    let newY = unit.y + (vy * dt);

    const myTeam = unit.team === 'player' ? players : enemies;
    for (let j = 0; j < myTeam.length; j++) {
      const ally = myTeam[j];
      if (unit.id !== ally.id) {
        const bothFlying = unit.type === 'flying' && ally.type === 'flying';
        const bothGround = unit.type !== 'flying' && ally.type !== 'flying';
        if (bothFlying || bothGround) {
          let dxAlly = unit.x - ally.x; let dyAlly = unit.y - ally.y;
          if (dxAlly === 0 && dyAlly === 0) { dxAlly = (Math.random() - 0.5) * 2; dyAlly = (Math.random() - 0.5) * 2; }
          const distSq = dxAlly * dxAlly + dyAlly * dyAlly;
          const minDist = unit.radius + ally.radius + (bothFlying ? 15 : 22);
          if (distSq < minDist * minDist) {
            const dist = Math.max(0.1, Math.sqrt(distSq));
            const overlap = minDist - dist;
            if (unit.stance === 'PATROL' && ally.stance === 'PATROL') {
              if (unit.x < ally.x) { unit.patrolDir = -1; ally.patrolDir = 1; } else { unit.patrolDir = 1; ally.patrolDir = -1; }
            }
            let pushWeight = 1.0;
            if (unit.stance === 'DEFEND') pushWeight = 0.1;
            if (unit.team === 'player' && Math.abs(vy) < 5 && bothGround) {
              newX += (dxAlly / dist) * overlap * 50.0 * pushWeight * dt;
              newY += (dyAlly / dist) * overlap * 20.0 * pushWeight * dt;
            } else {
              let pushMultiplier = unit.team === 'enemy' ? 36.0 : 30.0;
              if (bothFlying) pushMultiplier = 24.0;
              if (unit.chargeTimer > 0) pushMultiplier *= 3.0;
              newX += (dxAlly / dist) * overlap * pushMultiplier * pushWeight * dt;
              newY += (dyAlly / dist) * overlap * pushMultiplier * pushWeight * dt;
            }
          }
        }
      }
    }

    unit.y = newY;
    unit.x = Math.max(50, Math.min(V_WIDTH - 50, newX));

    if (unit.team === 'enemy' && unit.y + unit.radius >= WALL_Y) { s.gameState = 'GAMEOVER'; setUiTick(t => t + 1); }
    if (unit.team === 'player' && unit.y < -300) unit.hp = 0;
  }
}
