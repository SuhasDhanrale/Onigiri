import { addParticle } from './SpawnSystem.js';
import { COLORS } from '../config/colors.js';
import { pushFx } from '../renderer/drawSumiFx.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';
import { SoundManager } from './SoundManager.js';

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
        if (u.isChapterBoss) {
          pushFx(s, { kind: 'shockwave', layer: 'foreground', x: u.x, y: u.y, radius: u.radius * 3.2, color: u.color || '#b84235', life: 1.1, maxLife: 1.1 });
          pushFx(s, { kind: 'ink_burst', layer: 'foreground', x: u.x, y: u.y, radius: u.radius * 3.0, color: '#1b1918', life: 1.1, maxLife: 1.1, rays: 22 });
          pushFx(s, { kind: 'screen_pulse', layer: 'background', x: u.x, y: u.y, color: u.color || '#b84235', life: 0.6, maxLife: 0.6 });
          SoundManager.playSfx('boss_death');
        } else {
          const deathRadius = u.isElite ? u.radius * 2.2 : u.radius * 1.8;
          pushFx(s, { kind: 'smoke_puff', layer: 'foreground', x: u.x, y: u.y, radius: deathRadius, color: 'rgba(27, 25, 24, 0.5)', life: u.isElite ? 0.85 : 0.55, maxLife: u.isElite ? 0.85 : 0.55, puffs: u.isElite ? 8 : 5 });
          pushFx(s, { kind: 'ink_burst', layer: 'foreground', x: u.x, y: u.y, radius: deathRadius, color: '#1b1918', life: 0.35, maxLife: 0.35, rays: u.isElite ? 12 : 7 });
          SoundManager.playSfx(u.isElite ? 'elite_death' : 'unit_death');
        }

        const isBloodKatana = metaRef.current.equippedItem === 'BLOOD_KATANA';
        const hasRiverlands = metaRef.current.conqueredRegions.includes('RIVERLANDS');
        const lootMult      = metaRef.current.activeCommandDropMult ?? 1.0;  // LOOTING blessing

        if (u.isElite) {
          s.earnedHonor += 2;
          const baseReward = isBloodKatana ? 0 : 30;
          let reward = (baseReward > 0 && hasRiverlands) ? baseReward + Math.max(1, Math.floor(baseReward * 0.2)) : baseReward;
          if (s.harvestActive > 0) reward *= 2;
          if (lootMult !== 1.0) reward = Math.round(reward * lootMult);  // LOOTING blessing
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
          if (lootMult !== 1.0) reward = Math.round(reward * lootMult);  // LOOTING blessing
          s.command += reward; s.totalCommand += reward;
          bus.emit(EVENTS.COMMAND_CHANGED, { command: s.command });
          if (reward > 0) s.floatingTexts.push({ x: u.x, y: u.y, text: `+${reward}`, color: '#ffb703', life: 1.0, vy: -60 });
        }
        
        // Track slain stats
        if (s.combatStats) {
           s.combatStats.enemiesSlain.total += 1;
           const tName = u.name || 'Unknown Enemy';
           s.combatStats.enemiesSlain.types[tName] = (s.combatStats.enemiesSlain.types[tName] || 0) + 1;
        }
      }

      if (u.team === 'player') {
        pushFx(s, { kind: 'smoke_puff', layer: 'foreground', x: u.x, y: u.y, radius: u.radius * 1.8, color: 'rgba(139, 133, 116, 0.42)', life: 0.65, maxLife: 0.65, puffs: 5 });
        SoundManager.playSfx('unit_death');
      }

      addParticle(s, u.x, u.y, COLORS.ink, 12);

      // No blood splats on background canvas


      bus.emit(EVENTS.UNIT_DIED, { unit: u });
      s.units.splice(i, 1);
    }
  }
}
