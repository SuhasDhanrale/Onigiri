import { addParticle } from './SpawnSystem.js';
import { COLORS } from '../config/colors.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';

/**
 * Processes all dead units (hp <= 0): grants koku, honor, blood splats, particles.
 * Removes dead units from s.units after processing.
 * @param {object} s       - game state
 * @param {object} bgCtx   - background canvas 2d context (for blood splats)
 * @param {object} metaRef - React ref to meta state
 */
export function processDeaths(s, bgCtx, metaRef) {
  for (let i = s.units.length - 1; i >= 0; i--) {
    if (s.units[i].hp <= 0) {
      const u = s.units[i];

      // Clear guard slot if applicable
      if (u.team === 'player' && u.stance === 'DEFEND') {
        if (u.slotType === 'front') s.frontlineSlots[u.slotIndex] = null;
        else if (u.slotType === 'back') s.backlineSlots[u.slotIndex] = null;
      }

      if (u.team === 'enemy') {
        const isBloodKatana = metaRef.current.equippedHeirloom === 'BLOOD_KATANA';
        const hasRiverlands = metaRef.current.conqueredRegions.includes('RIVERLANDS');

        if (u.isElite) {
          s.earnedHonor += 2;
          const baseReward = isBloodKatana ? 0 : 30;
          let reward = (baseReward > 0 && hasRiverlands) ? baseReward + Math.max(1, Math.floor(baseReward * 0.2)) : baseReward;
          if (s.harvestActive > 0) reward *= 2;
          s.koku += reward; s.totalKoku += reward;
          bus.emit(EVENTS.KOKU_CHANGED, { koku: s.koku });
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
          s.koku += reward; s.totalKoku += reward;
          bus.emit(EVENTS.KOKU_CHANGED, { koku: s.koku });
          if (reward > 0) s.floatingTexts.push({ x: u.x, y: u.y, text: `+${reward}`, color: '#ffb703', life: 1.0, vy: -60 });
        }
      }

      addParticle(s, u.x, u.y, COLORS.ink, 12);

      // Blood splat on background canvas
      if (bgCtx && u.name !== 'Bamboo Barricade') {
        bgCtx.save();
        bgCtx.globalCompositeOperation = 'multiply';
        bgCtx.fillStyle = Math.random() > 0.5 ? 'rgba(184, 66, 53, 0.25)' : 'rgba(27, 25, 24, 0.35)';
        bgCtx.beginPath();
        for (let splat = 0; splat < 4 + Math.random() * 3; splat++) {
          const splatR = (u.radius * (0.3 + Math.random() * 0.8));
          const splatX = u.x + (Math.random() - 0.5) * u.radius * 2;
          const splatY = u.y + (Math.random() - 0.5) * u.radius * 2;
          bgCtx.arc(splatX, splatY, Math.max(0.1, splatR), 0, Math.PI * 2);
        }
        bgCtx.fill();
        bgCtx.restore();
      }

      bus.emit(EVENTS.UNIT_DIED, { unit: u });
      s.units.splice(i, 1);
    }
  }
}
