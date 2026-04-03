import { COLORS } from '../config/colors.js';
import { WALL_Y, V_WIDTH } from '../config/constants.js';
import { addParticle } from './SpawnSystem.js';
import { calculateVelocity, applySeparation } from './MovementSystem.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';
import { claimSlot, releaseSlot, calculateSlotPosition, shouldBypassSlotClaiming } from './SlotManager.js';

/**
 * Full unit movement + combat loop. Processes all units each frame.
 * @param {object} s       - game state
 * @param {number} dt
 * @param {object} now     - performance.now()
 * @param {object} metaRef - React ref to meta state
 * @see doc/implementation_plan_SlotBaseCombat02
 */
export function tickUnits(s, dt, now, metaRef) {
  const enemies = s.units.filter(u => u.team === 'enemy');
  const players = s.units.filter(u => u.team === 'player');
  const expectedHpMap = new Map();

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

    let uSpeed = unit.speed;
    if (unit.team === 'player') {
      if (s.warDrumsActive > 0) uSpeed *= 1.5;
      uSpeed *= (metaRef.current.activeMoveSpeedMult ?? 1.0);  // SWIFT_FEET / FOX_SPEED blessing
    }
    if (unit.chargeTimer > 0) uSpeed *= 2.0;
    const atkSpeedMult = unit.team === 'player'
      ? (s.warDrumsActive > 0 ? 1.5 : 1.0) * (metaRef.current.activeAttackSpeedMult ?? 1.0)  // WAR_DRUMS blessing
      : 1.0;

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
        bus.emit('SCREEN_SHAKE', s.screenShake);
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
      const dy = e.y - unit.y;
      const rawDistSq = dx * dx + dy * dy;

      // Detection range: ranged/siege/assassin always see all. Enemies use spherical aggroRadius;
      // player units use dx<150 lane (defenders hold position, not chase across map).
      const inDetectionRange =
        unit.type === 'ranged' || unit.type === 'siege' || unit.type === 'assassin'
          ? true
          : unit.team === 'enemy'
            ? rawDistSq < unit.aggroRadius * unit.aggroRadius
            : dx < 150;

      if (inDetectionRange) {
        let canSee = false;
        if (unit.type === 'ranged' || unit.type === 'siege' || unit.type === 'assassin') canSee = true;
        else if (unit.team === 'player' && dy <= 60) canSee = true;
        else if (unit.team === 'enemy' && dy >= -60) canSee = true;

        if (canSee) {
          let distSq = rawDistSq;
          if (unit.type === 'cavalry' && e.type === 'ranged') distSq -= 250000;
          if (unit.type === 'assassin' && (e.type === 'ranged' || e.type === 'support' || e.type === 'friction')) distSq -= 500000;
          if (e.taunt && distSq < 40000) { target = e; closestSq = rawDistSq; break; }
          if (unit.type === 'ranged') {
            const effectiveHp = expectedHpMap.get(e.id);
            if (effectiveHp !== undefined && effectiveHp <= 0) continue;
          }
          if (distSq < closestSq) { closestSq = rawDistSq; target = e; }
        }
      }
    }

    // Handle slot claiming for melee combat
    const bypassSlotClaim = shouldBypassSlotClaiming(unit);

    if (target) {
      if (unit.slotTargetId !== target.id) {
        if (unit.slotTargetId && unit.claimedSlotIdx !== null) {
          const oldTarget = targetList.find(t => t.id === unit.slotTargetId);
          if (oldTarget) releaseSlot(unit, oldTarget);
        }

        if (!bypassSlotClaim) {
          const slotResult = claimSlot(unit, target);
          if (!slotResult) {
            unit.stance_override = 'SCREENING';
          } else {
            unit.stance_override = null;
          }
        }
      } else if (unit.stance_override === 'SCREENING') {
        // Enemy units: scan ALL nearby targets for available slots while advancing
        if (unit.team === 'enemy') {
          for (const potentialTarget of targetList) {
            if (potentialTarget.meleeSlots) {
              const retry = claimSlot(unit, potentialTarget);
              if (retry) {
                unit.stance_override = null;
                target = potentialTarget;
                break;
              }
            }
          }
        } else {
          // Player units: retry same target only
          const retry = claimSlot(unit, target);
          if (retry) unit.stance_override = null;
        }
      } else if (unit.claimedSlotIdx !== null) {
        // Target hasn't changed — recalculate slot position since target may have moved this frame
        const slotPos = calculateSlotPosition(unit, target, unit.claimedSlotIdx);
        unit.slotTargetX = slotPos.x;
        unit.slotTargetY = slotPos.y;
      }
    } else {
      // Target lost (may have died) — clear slot state directly without needing the old target reference
      unit.claimedSlotIdx = null;
      unit.slotTargetId = null;
      unit.slotTargetX = null;
      unit.slotTargetY = null;
      unit.stance_override = null;
    }

    let engageDist = unit.radius + (target ? target.radius : 0) + 15;
    if (unit.type === 'ranged' || unit.type === 'siege') engageDist = unit.range;

    const slotDistSq = unit.slotTargetX !== null && unit.slotTargetY !== null
      ? (unit.x - unit.slotTargetX) ** 2 + (unit.y - unit.slotTargetY) ** 2
      : Math.max(0, closestSq); // clamp: cavalry bias can make closestSq negative

    // Always pass raw closestSq (distance to target) to calculateVelocity for the aggro gate.
    // slotDistSq is only used below for the isEngaged melee check.
    let { vx, vy } = calculateVelocity(unit, target, closestSq, s, now, uSpeed, enemies, players);

    // Combat engagement
    const isEngaged = target && slotDistSq <= engageDist * engageDist && unit.type !== 'support';
    if (isEngaged) {
      if (unit.name === 'Ikki Rebel') { target.hp -= unit.damage; unit.hp = 0; addParticle(s, unit.x, unit.y, COLORS.ink, 5); continue; }

      if (unit.type === 'assassin' && target.name === 'Bamboo Barricade') {
        unit.hp -= 1000; target.hp -= 1000; 
        s.screenShake = 0.5;
        bus.emit('SCREEN_SHAKE', s.screenShake);
        addParticle(s, target.x, target.y, COLORS.vermilion, 10, 300);
        addParticle(s, target.x, target.y, COLORS.khaki, 10, 300);
        continue;
      }

      if (unit.attackCooldown <= 0) {
        if (unit.type === 'boss' && Math.random() < 0.2) {
          unit.telegraphTimer = 0.8; unit.attackCooldown = unit.attackSpeed;
        } else if (unit.type === 'ranged') {
          const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
          const isFlaming = unit.team === 'player' && unit.name === 'Yumi Archer' && metaRef.current.unlockedProvisions.includes('FLAMING_ARROWS') && Math.random() < 0.25;
          s.projectiles.push({ x: unit.x, y: unit.y, vx: Math.cos(angle) * 1200, vy: Math.sin(angle) * 1200, damage: unit.damage, team: unit.team, pierce: unit.pierce, isFlaming });
          expectedHpMap.set(target.id, (expectedHpMap.get(target.id) ?? target.hp) - unit.damage);
        } else if (unit.type === 'siege') {
          s.projectiles.push({ type: 'lob', startX: unit.x, startY: unit.y, targetX: target.x, targetY: target.y, progress: 0, travelTime: 1.2, damage: unit.damage, team: unit.team, z: 0 });
        } else {
          target.hp -= unit.damage;
          unit.swingPhase = 1.0;
          if (target.name === 'Bamboo Barricade' && target.team === 'player' && metaRef.current.unlockedProvisions.includes('SPIKED_CALTROPS')) {
            unit.hp -= unit.damage * 0.5;
            s.floatingTexts.push({ x: unit.x, y: unit.y - 10, text: 'REFLECT', color: '#b84235', life: 0.5, vy: -30 });
          }
          if (unit.type === 'cavalry') {
            if (target.type === 'shield' || target.type === 'boss') { 
              s.screenShake = 0.1; 
              bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
            }
            else {
              const shoveDir = unit.team === 'player' ? -1 : 1;
              target.y += shoveDir * (unit.chargeTimer > 0 ? 180 : 60);
              target.x += (Math.random() - 0.5) * 20;
              s.screenShake = unit.chargeTimer > 0 ? 0.5 : 0.2;
              bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
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
    const myTeam = unit.team === 'player' ? players : enemies;
    applySeparation(unit, vx, vy, dt, myTeam);

    if (unit.team === 'enemy' && unit.y + unit.radius >= WALL_Y) { 
      s.gameState = 'GAMEOVER'; 
      bus.emit(EVENTS.GAME_STATE_CHANGED, { state: s.gameState });
    }
    if (unit.team === 'player' && unit.y < -300) unit.hp = 0;
  }
}
