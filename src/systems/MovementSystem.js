import { BATTLE_LINE_Y, SLOT_OFFSETS, WALL_Y, V_WIDTH } from '../config/constants.js';

const YUMI_EXPOSED_RANGE = 150;
const YUMI_BACKLINE_LEASH = 20;
const FRONTLINE_FORMATION_SPACING = 105;
const BACKLINE_FORMATION_SPACING = 115;
const FORMATION_EDGE_PADDING = 70;
const MELEE_FRONTLINE_Y = BATTLE_LINE_Y + 90;
const RANGED_BACKLINE_Y = WALL_Y - 240;
const SIEGE_BACKLINE_Y = WALL_Y - 190;
const FORMATION_ROW_GAP = 34;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getAttackFormationX(unit, players) {
  if (unit.type === 'hero' || unit.type === 'friction') return unit.x;

  const sameRole = players
    .filter(ally =>
      ally.team === unit.team &&
      ally.hp > 0 &&
      ally.stance === 'ATTACK' &&
      ally.name === unit.name &&
      ally.type !== 'hero' &&
      ally.type !== 'friction'
    )
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  const idx = sameRole.findIndex(ally => ally.id === unit.id);
  if (idx < 0) return unit.x;

  const slot = idx % SLOT_OFFSETS.length;
  const row = Math.floor(idx / SLOT_OFFSETS.length);
  const spacing = unit.type === 'ranged' || unit.type === 'siege'
    ? BACKLINE_FORMATION_SPACING
    : FRONTLINE_FORMATION_SPACING;
  const rowNudge = row === 0 ? 0 : (row % 2 === 0 ? -spacing * 0.35 : spacing * 0.35);

  return clamp(
    (V_WIDTH / 2) + (SLOT_OFFSETS[slot] * spacing) + rowNudge,
    FORMATION_EDGE_PADDING,
    V_WIDTH - FORMATION_EDGE_PADDING
  );
}

function steerTowardFormationX(unit, players, now, uSpeed, strength = 0.85) {
  const anchorX = getAttackFormationX(unit, players);
  const dx = anchorX - unit.x;
  const correction = Math.abs(dx) < 8 ? 0 : clamp(dx * 1.4, -uSpeed * strength, uSpeed * strength);
  const drift = Math.sin((now / 400) + unit.hashOffset) * 3;
  return correction + drift;
}

function getAttackFormationY(unit, players) {
  if (unit.type === 'hero' || unit.type === 'friction') return unit.advanceZone;

  const sameRole = players
    .filter(ally =>
      ally.team === unit.team &&
      ally.hp > 0 &&
      ally.stance === 'ATTACK' &&
      ally.name === unit.name &&
      ally.type !== 'hero' &&
      ally.type !== 'friction'
    )
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  const idx = sameRole.findIndex(ally => ally.id === unit.id);
  const row = idx < 0 ? 0 : Math.floor(idx / SLOT_OFFSETS.length);

  if (unit.type === 'ranged') return RANGED_BACKLINE_Y + (row * FORMATION_ROW_GAP);
  if (unit.type === 'siege') return SIEGE_BACKLINE_Y + (row * FORMATION_ROW_GAP);
  if (unit.type === 'cavalry') return unit.advanceZone;
  return MELEE_FRONTLINE_Y + (row * FORMATION_ROW_GAP);
}

export function calculateVelocity(unit, target, closestSq, s, now, uSpeed, enemies, players) {
    let vx = 0; let vy = 0;

    if (unit.stance_override === 'SCREENING') {
      const friendlyTeam = unit.team === 'player' ? players : enemies;
      let avgX = unit.x;
      let friendlyCount = 0;
      for (const ally of friendlyTeam) {
        if (ally.id !== unit.id && ally.stance_override !== 'SCREENING') {
          avgX += ally.x;
          friendlyCount++;
        }
      }
      if (friendlyCount > 0) avgX /= (friendlyCount + 1);
      const dxCenter = avgX - unit.x;
      vx = Math.sign(dxCenter) * Math.min(Math.abs(dxCenter) * 0.5, 10);
      
      vy = unit.team === 'enemy' ? uSpeed : 0;
      return { vx, vy };
    }

    if (unit.team === 'player') {
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
          const dxFormation = getAttackFormationX(unit, players) - unit.x;
          if (Math.abs(dxFormation) > 35) {
            vx = steerTowardFormationX(unit, players, now, uSpeed);
            vy = -uSpeed * 0.6;
          } else {
            vx = steerTowardFormationX(unit, players, now, uSpeed, 0.45);
            vy = -uSpeed;
          }
        } else if (unit.name === 'Yumi Archer') {
          const anchorY = getAttackFormationY(unit, players);
          const closestEnemy = enemies.reduce((closest, enemy) => {
            if (enemy.hp <= 0) return closest;
            const distSq = (enemy.x - unit.x) ** 2 + (enemy.y - unit.y) ** 2;
            return distSq < closest.distSq ? { enemy, distSq } : closest;
          }, { enemy: null, distSq: Infinity });
          const exposed = closestEnemy.distSq <= YUMI_EXPOSED_RANGE * YUMI_EXPOSED_RANGE;

          if (exposed && closestEnemy.enemy) {
            const dx = unit.x - closestEnemy.enemy.x;
            const dist = Math.max(1, Math.abs(dx));
            vx = (dx / dist) * uSpeed * 0.7;
            vy = unit.y < WALL_Y - 80 ? uSpeed * 0.8 : 0;
          } else if (unit.y > anchorY + YUMI_BACKLINE_LEASH) {
            vy = -uSpeed;
            vx = steerTowardFormationX(unit, players, now, uSpeed, 0.75);
          } else if (unit.y < anchorY - YUMI_BACKLINE_LEASH) {
            vy = uSpeed * 0.8;
            vx = steerTowardFormationX(unit, players, now, uSpeed, 0.75);
          } else {
            vy = 0;
            vx = steerTowardFormationX(unit, players, now, uSpeed, 0.75);
          }
        } else if (target && closestSq < unit.aggroRadius * unit.aggroRadius) {
          // If we have a claimed slot, navigate to the slot coordinate (not target center)
          const navX = (unit.slotTargetX !== null) ? unit.slotTargetX : target.x;
          const navY = (unit.slotTargetY !== null) ? unit.slotTargetY : target.y;
          const dx = navX - unit.x; const dy = navY - unit.y; const dist = Math.max(0.1, Math.hypot(dx, dy));
          vx = (dx / dist) * uSpeed; vy = Math.min(0, (dy / dist) * uSpeed);
        } else {
          const alignSpeed = steerTowardFormationX(unit, players, now, uSpeed);
          const anchorY = getAttackFormationY(unit, players);
          if (unit.y > anchorY + 12) {
            vy = -uSpeed;
            vx = alignSpeed;
          } else if (unit.y < anchorY - 12) {
            vy = uSpeed * 0.6;
            vx = alignSpeed;
          } else {
            vy = 0;
            vx = alignSpeed;
          }
        }
      }
    } else if (unit.team === 'enemy') {
      if (unit.type === 'assassin') {
        const targetEdge = (unit.hashOffset % 2 === 0) ? 50 : V_WIDTH - 50;
        const dxEdge = targetEdge - unit.x;
        if (target && closestSq < unit.aggroRadius * unit.aggroRadius) {
          // Use slot coordinate if claimed; otherwise aim at target center
          const navX = (unit.slotTargetX !== null) ? unit.slotTargetX : target.x;
          const navY = (unit.slotTargetY !== null) ? unit.slotTargetY : target.y;
          const dx = navX - unit.x; const dy = navY - unit.y; const dist = Math.max(0.1, Math.hypot(dx, dy));
          vx = (dx / dist) * uSpeed; vy = Math.max(uSpeed * 0.2, (dy / dist) * uSpeed);
        } else if (unit.y < WALL_Y - 250) {
          if (Math.abs(dxEdge) > 20) { vx = Math.sign(dxEdge) * uSpeed; vy = uSpeed * 0.6; } else { vx = 0; vy = uSpeed; }
        } else {
          const alignSpeed = Math.sin((now / 400) + unit.hashOffset) * 10;
          vy = uSpeed; vx = alignSpeed;
        }
      } else if (target && closestSq < unit.aggroRadius * unit.aggroRadius && unit.type !== 'support') {
        // If we have a claimed slot, navigate to the slot coordinate (not target center)
        const navX = (unit.slotTargetX !== null) ? unit.slotTargetX : target.x;
        const navY = (unit.slotTargetY !== null) ? unit.slotTargetY : target.y;
        const dx = navX - unit.x; const dy = navY - unit.y; const dist = Math.max(0.1, Math.hypot(dx, dy));
        vx = (dx / dist) * uSpeed; vy = (dy / dist) * uSpeed;
      } else {
        const alignSpeed = Math.sin((now / 400) + unit.hashOffset) * 10;
        vy = uSpeed; vx = alignSpeed;
      }
      const vanguardY = enemies.length > 0 ? Math.max(...enemies.map(e => e.y)) : 0;
      if (unit.type === 'support' && vanguardY - unit.y > 200) vy = 0;
    }

    return { vx, vy };
}

export function applySeparation(unit, vx, vy, dt, myTeam) {
    let newX = unit.x + (vx * dt);
    let newY = unit.y + (vy * dt);

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
            if (unit.stance_override === 'SCREENING') pushWeight = 0.05;
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
}
