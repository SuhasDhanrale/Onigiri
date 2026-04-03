import { addParticle } from './SpawnSystem.js';
import { COLORS } from '../config/colors.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';

/**
 * Processes all dead units (hp <= 0): grants command, honor, particles.
 * Removes dead units from s.units after processing.
 * @param {object} s       - game state
 * @param {object} metaRef - React ref to meta state
 */
export function processDeaths(s, metaRef) {
  for (let i = s.units.length - 1; i >= 0; i--) {
    if (s.units[i].hp <= 0) {
      const u = s.units[i];

      // Clear guard slot if applicable
      if (u.team === 'player' && u.stance === 'DEFEND') {
        if (u.slotType === 'front') s.frontlineSlots[u.slotIndex] = null;
        else if (u.slotType === 'back') s.backlineSlots[u.slotIndex] = null;
      }

      if (u.team === 'enemy') {
        const isBloodKatana = metaRef.current.equippedItem === 'BLOOD_KATANA';
        const hasRiverlands = metaRef.current.conqueredRegions.includes('RIVERLANDS');

        if (u.isElite) {
          s.earnedHonor += 2;
          const baseReward = isBloodKatana ? 0 : 30;
          let reward = (baseReward > 0 && hasRiverlands) ? baseReward + Math.max(1, Math.floor(baseReward * 0.2)) : baseReward;
          if (s.harvestActive > 0) reward *= 2;
          s.command += reward; s.totalCommand += reward;
          bus.emit(EVENTS.COMMAND_CHANGED, { command: s.command });
          bus.emit(EVENTS.HONOR_EARNED, { amount: 2 });
          s.floatingTexts.push({ x: u.x, y: u.y - 20, text: '+2 HONOR!', color: '#d4af37', life: 2.0, vy: -50 });
          if (reward > 0) s.floatingTexts.push({ x: u.x, y: u.y, text: `+${reward}`, color: '#ffb703', life: 1.0, vy: -60 });
          s.screenShake = 0.5;
          bus.emit(EVENTS.SCREEN_SHAKE, { amount: s.screenShake });
        } else {
          let baseReward = u.type === 'boss' ? 50 : (u.type === 'shield' ? 5 : (u.name === 'Ikki Rebel' ? 1 : 2));
          if (isBloodKatana) baseReward = 0;
          let reward = (baseReward > 0 && hasRiverlands) ? baseReward + Math.max(1, Math.floor(baseReward * 0.2)) : baseReward;
          if (s.harvestActive > 0) reward *= 2;
          s.command += reward; s.totalCommand += reward;
          bus.emit(EVENTS.COMMAND_CHANGED, { command: s.command });
          if (reward > 0) s.floatingTexts.push({ x: u.x, y: u.y, text: `+${reward}`, color: '#ffb703', life: 1.0, vy: -60 });
        }
      }

      addParticle(s, u.x, u.y, COLORS.ink, 12);

      // No blood splats on background canvas


      bus.emit(EVENTS.UNIT_DIED, { unit: u });
      s.units.splice(i, 1);
    }
  }
}
