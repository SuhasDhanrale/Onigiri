/**
 * Manages melee engagement slots around units.
 * Slots are arranged in a semicircle facing the attacker's approach direction.
 */

export function initSlotArray(unit) {
  unit.meleeSlots = new Array(unit.maxMeleeSlots).fill(null);
  unit.claimedSlotIdx = null;
  unit.slotTargetId = null;
  unit.slotTargetX = null;
  unit.slotTargetY = null;
  unit.stance_override = null;
}

export function claimSlot(attacker, target) {
  if (!target || !target.meleeSlots) return null;

  for (let i = 0; i < target.meleeSlots.length; i++) {
    if (target.meleeSlots[i] === null) {
      target.meleeSlots[i] = attacker.id;
      attacker.claimedSlotIdx = i;
      attacker.slotTargetId = target.id;

      const slotPos = calculateSlotPosition(attacker, target, i);
      attacker.slotTargetX = slotPos.x;
      attacker.slotTargetY = slotPos.y;

      return { slotIdx: i, slotX: slotPos.x, slotY: slotPos.y };
    }
  }
  return null;
}

export function releaseSlot(attacker, target) {
  if (!target || !target.meleeSlots) return;

  if (target.meleeSlots[attacker.claimedSlotIdx] === attacker.id) {
    target.meleeSlots[attacker.claimedSlotIdx] = null;
  }
  attacker.claimedSlotIdx = null;
  attacker.slotTargetId = null;
  attacker.slotTargetX = null;
  attacker.slotTargetY = null;
  attacker.stance_override = null;
}

// Deprecated — CombatSystem now updates slot positions directly using calculateSlotPosition each frame.
export function updateSlotPositions() {}

export function calculateSlotPosition(attacker, target, slotIdx) {
  const totalSlots = target.meleeSlots.length;
  const angleSpread = Math.PI * 0.8; // 144-degree arc

  // Enemies attack from above (moving downward in screen space) → slots on the TOP of the target (negative Y = up)
  // Players attack from below (moving upward in screen space) → slots on the BOTTOM of the target (positive Y = down)
  // Center angle: enemies = -PI/2 (top), players = PI/2 (bottom)
  const centerAngle = attacker.team === 'enemy' ? -Math.PI / 2 : Math.PI / 2;
  const startAngle = centerAngle - angleSpread / 2;

  // Guard against division by zero when totalSlots === 1
  const t = totalSlots <= 1 ? 0.5 : slotIdx / (totalSlots - 1);
  const angle = startAngle + t * angleSpread;
  const distance = target.radius + attacker.radius + 5;

  return {
    x: target.x + Math.cos(angle) * distance,
    y: target.y + Math.sin(angle) * distance
  };
}



export function shouldBypassSlotClaiming(unit) {
  if (unit.type === 'ranged') return true;
  if (unit.type === 'siege') return true;
  if (unit.type === 'support') return true;
  if (unit.type === 'cavalry' && unit.chargeTimer > 0) return true;
  if (unit.name === 'Ikki Rebel') return true;
  return false;
}
