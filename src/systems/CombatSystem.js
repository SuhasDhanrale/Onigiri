import { COLORS } from '../config/colors.js';
import { WALL_Y, V_WIDTH } from '../config/constants.js';
import { addParticle } from './SpawnSystem.js';
import { pushFx } from '../renderer/drawSumiFx.js';
import { calculateVelocity, applySeparation } from './MovementSystem.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';
import { claimSlot, releaseSlot, calculateSlotPosition, shouldBypassSlotClaiming } from './SlotManager.js';
import { canAttackOrb } from './CaveSystem.js';
import { SoundManager } from './SoundManager.js';

const YUMI_EXPOSED_RANGE = 150;
const YUMI_EXPOSED_DAMAGE_MULT = 0.6;
const YUMI_EXPOSED_ATTACK_TIME_MULT = 1.75;
const ASSASSIN_BARRICADE_SLOW_MULT = 0.5;
const ASSASSIN_BARRICADE_SLOW_TIME = 5.0;

function bumpShake(s, amount) {
  s.screenShake = Math.max(s.screenShake, amount);
  bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
}

function emitMeleeImpact(s, unit, target, amount = 0.16) {
  const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
  const x = (unit.x + target.x) / 2;
  const y = (unit.y + target.y) / 2;
  const isPlayerHit = unit.team === 'player';
  const color = isPlayerHit ? '#dfd4ba' : '#8b8574';
  pushFx(s, { kind: 'slash_arc', layer: 'foreground', x, y, radius: unit.radius + target.radius + 36, rotation: angle, color, life: 0.22, maxLife: 0.22 });
  pushFx(s, { kind: 'impact_sparks', layer: 'foreground', x: target.x, y: target.y, radius: 42, color: isPlayerHit ? '#d4af37' : '#dfd4ba', life: 0.28, maxLife: 0.28, rays: 7 });
  bumpShake(s, amount);
  SoundManager.playSfx('sword_hit');
}

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
    if (unit.slowTimer > 0) unit.slowTimer -= dt;

    let uSpeed = unit.speed;
    if (unit.team === 'player') {
      if (s.warDrumsActive > 0) uSpeed *= 1.5;
      uSpeed *= (metaRef.current.activeMoveSpeedMult ?? 1.0);  // SWIFT_FEET / FOX_SPEED blessing
    }
    if (unit.slowTimer > 0) uSpeed *= (unit.slowMult ?? 0.6);
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
        bumpShake(s, 0.55);
        s.explosions.push({ x: unit.x, y: unit.y, r: unit.range, life: 0.6, color: COLORS.vermilion });
        pushFx(s, { kind: 'shockwave', layer: 'foreground', x: unit.x, y: unit.y, radius: unit.range, color: COLORS.vermilion, life: 0.55, maxLife: 0.55 });
        players.forEach(p => { if (Math.hypot(p.x - unit.x, p.y - unit.y) < unit.range) { p.hp -= unit.damage * 2; p.y += 100; } });
        SoundManager.playSfx('siege_impact');
      }
      continue;
    }

    // Target finding
    let target = null; let closestSq = Infinity; let bestTargetScore = Infinity;
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
          let targetScore = rawDistSq;
          if (unit.type === 'cavalry' && e.type === 'ranged') targetScore -= 250000;
          if (unit.type === 'assassin') {
            if (unit.assassinFlankComplete) {
              if (e.name === 'Yumi Archer') targetScore -= 2000000;
              else if (e.type === 'ranged' || e.type === 'siege' || e.type === 'support') targetScore -= 650000;
              else if (e.type === 'friction') targetScore -= 250000;
            } else if (e.type === 'friction') {
              targetScore -= 900000;
            } else if (e.taunt || e.type === 'melee' || e.type === 'cavalry') {
              targetScore -= 250000;
            }
          }
          if (unit.type !== 'assassin' && e.taunt && targetScore < 40000) { target = e; closestSq = rawDistSq; break; }
          if (unit.type === 'ranged') {
            const effectiveHp = expectedHpMap.get(e.id);
            if (effectiveHp !== undefined && effectiveHp <= 0) continue;
          }
          if (targetScore < bestTargetScore) {
            bestTargetScore = targetScore;
            closestSq = rawDistSq;
            target = e;
          }
        }
      }
    }

    // Orb targeting for ranged/siege player units
    let orbTarget = null;
    if (unit.team === 'player' && (unit.type === 'ranged' || unit.type === 'siege') && canAttackOrb(s, unit)) {
      const orbDistSq = Math.pow(s.orb.x - unit.x, 2) + Math.pow(s.orb.y - unit.y, 2);
      if (orbDistSq < closestSq) {
        orbTarget = s.orb;
      }
    }

    const isExposedYumi = unit.team === 'player' && unit.name === 'Yumi Archer' && enemies.some(enemy =>
      enemy.hp > 0 &&
      (enemy.x - unit.x) ** 2 + (enemy.y - unit.y) ** 2 <= YUMI_EXPOSED_RANGE * YUMI_EXPOSED_RANGE
    );
    const attackRecoveryMult = isExposedYumi ? YUMI_EXPOSED_ATTACK_TIME_MULT : 1;

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
      if (unit.name === 'Ikki Rebel') {
        target.hp -= unit.damage;
        unit.hp = 0;
        pushFx(s, { kind: 'impact_sparks', layer: 'foreground', x: target.x, y: target.y, radius: 36, color: '#8b8574', life: 0.22, maxLife: 0.22, rays: 6 });
        addParticle(s, unit.x, unit.y, COLORS.ink, 5);
        SoundManager.playSfx('ikki_kamikaze');
        continue;
      }

      if (unit.attackCooldown <= 0) {
        if (unit.type === 'boss' && Math.random() < 0.2) {
          unit.telegraphTimer = 0.8; unit.attackCooldown = unit.attackSpeed;
          SoundManager.playSfx('boss_telegraph');
        } else if (unit.type === 'ranged') {
          const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
          const damage = isExposedYumi ? unit.damage * YUMI_EXPOSED_DAMAGE_MULT : unit.damage;
          const isFlaming = !isExposedYumi && unit.team === 'player' && unit.name === 'Yumi Archer' && metaRef.current.unlockedProvisions.includes('FLAMING_ARROWS') && Math.random() < 0.25;
          s.projectiles.push({ x: unit.x, y: unit.y, vx: Math.cos(angle) * 1200, vy: Math.sin(angle) * 1200, damage, team: unit.team, pierce: unit.pierce && !isExposedYumi, isFlaming });
          if (isFlaming) {
            s.floatingTexts.push({ x: unit.x, y: unit.y - 18, text: 'IGNITE', color: '#ea580c', life: 0.55, vy: -24 });
          }
          expectedHpMap.set(target.id, (expectedHpMap.get(target.id) ?? target.hp) - damage);
          SoundManager.playSfx('arrow_release');
        } else if (unit.type === 'siege') {
          s.projectiles.push({ type: 'lob', startX: unit.x, startY: unit.y, targetX: target.x, targetY: target.y, progress: 0, travelTime: 1.2, damage: unit.damage, team: unit.team, z: 0 });
          SoundManager.playSfx('siege_launch');
          } else {
          target.hp -= unit.damage;
          if (unit.team === 'player' && s.combatStats) s.combatStats.damageDealt += unit.damage;
          unit.swingPhase = 1.0;
          SoundManager.playSfx('sword_swing');
          emitMeleeImpact(s, unit, target, unit.type === 'boss' ? 0.34 : unit.type === 'cavalry' ? 0.26 : 0.14);
          if (unit.type === 'assassin' && target.name === 'Bamboo Barricade' && target.team === 'player') {
            unit.slowTimer = Math.max(unit.slowTimer ?? 0, ASSASSIN_BARRICADE_SLOW_TIME);
            unit.slowMult = ASSASSIN_BARRICADE_SLOW_MULT;
            s.floatingTexts.push({ x: unit.x, y: unit.y - 14, text: 'CRIPPLED', color: COLORS.khaki, life: 0.7, vy: -24 });
            pushFx(s, { kind: 'smoke_puff', layer: 'foreground', x: target.x, y: target.y, radius: 52, color: 'rgba(74, 59, 50, 0.55)', life: 0.7, maxLife: 0.7 });
            SoundManager.playSfx('parry_cripple');
          }
          if (target.name === 'Bamboo Barricade' && target.team === 'player' && metaRef.current.unlockedProvisions.includes('SPIKED_CALTROPS')) {
            unit.hp -= unit.damage * 0.5;
            s.floatingTexts.push({ x: unit.x, y: unit.y - 10, text: 'SPIKES', color: '#b84235', life: 0.5, vy: -30 });
            pushFx(s, { kind: 'impact_sparks', layer: 'foreground', x: unit.x, y: unit.y, radius: 46, color: '#dfd4ba', life: 0.28, maxLife: 0.28, rays: 9 });
            SoundManager.playSfx('reflect_hit');
          }
          if (unit.type === 'cavalry') {
            if (target.type === 'shield' || target.type === 'boss') {
              pushFx(s, { kind: 'shockwave', layer: 'foreground', x: target.x, y: target.y, radius: 60, color: '#dfd4ba', life: 0.3, maxLife: 0.3 });
              bumpShake(s, 0.18);
              SoundManager.playSfx('shield_block');
            }
            else {
              const shoveDir = unit.team === 'player' ? -1 : 1;
              target.y += shoveDir * (unit.chargeTimer > 0 ? 180 : 60);
              target.x += (Math.random() - 0.5) * 20;
              pushFx(s, { kind: 'shockwave', layer: 'foreground', x: target.x, y: target.y, radius: unit.chargeTimer > 0 ? 96 : 62, color: '#dfd4ba', life: 0.32, maxLife: 0.32 });
              bumpShake(s, unit.chargeTimer > 0 ? 0.5 : 0.24);
              addParticle(s, target.x, target.y, '#dfd4ba', 5);
              SoundManager.playSfx('cavalry_charge_impact');
            }
          }
        }
        unit.attackCooldown = (unit.attackSpeed * attackRecoveryMult) / atkSpeedMult;
      }

      vx *= 0.15; vy *= 0.15;
      if (unit.type === 'ranged') {
        const minRangeSq = Math.pow(unit.range * 0.4, 2);
        if (closestSq < minRangeSq) { vy = (unit.team === 'player' ? 1 : -1) * uSpeed * 0.8; vx = 0; }
      }
    }

    // Orb attack for ranged/siege units
    if (orbTarget && unit.attackCooldown <= 0) {
      const orbDist = Math.hypot(orbTarget.x - unit.x, orbTarget.y - unit.y);
      if (orbDist <= unit.range) {
        if (unit.type === 'ranged') {
          const angle = Math.atan2(orbTarget.y - unit.y, orbTarget.x - unit.x);
          s.projectiles.push({ 
            x: unit.x, y: unit.y, 
            vx: Math.cos(angle) * 1200, 
            vy: Math.sin(angle) * 1200, 
            damage: isExposedYumi ? unit.damage * YUMI_EXPOSED_DAMAGE_MULT : unit.damage, team: unit.team, 
            isOrbAttack: true 
          });
        } else if (unit.type === 'siege') {
          s.projectiles.push({ 
            type: 'lob', 
            startX: unit.x, startY: unit.y, 
            targetX: orbTarget.x, targetY: orbTarget.y, 
            progress: 0, travelTime: 1.2, 
            damage: unit.damage, team: unit.team, 
            z: 0, isOrbAttack: true 
          });
        }
        unit.attackCooldown = (unit.attackSpeed * attackRecoveryMult) / atkSpeedMult;
      }
    }

    // Position update + separation
    const myTeam = unit.team === 'player' ? players : enemies;
    applySeparation(unit, vx, vy, dt, myTeam);

    if (unit.team === 'enemy' && unit.y + unit.radius >= WALL_Y) {
      unit.y = WALL_Y - unit.radius; // pin at the wall instead of clipping through
      const dps = unit.damage / (unit.attackSpeed || 1);
      s.wall.hp = Math.max(0, s.wall.hp - dps * dt);
      if (s.wall.hp <= 0 && s.gameState === 'COMBAT') {
        s.gameState = 'GAMEOVER';
        bus.emit(EVENTS.GAME_STATE_CHANGED, { state: s.gameState });
        SoundManager.playSfx('gameover_stinger');
      }
    }
    if (unit.team === 'player' && unit.y < -300) unit.hp = 0;
  }
}
