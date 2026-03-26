import { BARRACKS_DEFS, BARRACKS_LAYOUT } from '../config/barracks.js';
import { UNIT_TYPES } from '../config/units.js';
import { getSquadCap } from '../core/utils.js';
import { spawnUnit } from './SpawnSystem.js';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';

/**
 * Ticks all barracks training timers and auto-spawns units when ready.
 * @param {object} s           - game state
 * @param {number} dt
 * @param {object} metaRef     - React ref to meta state
 */
export function tickBarracks(s, dt, metaRef) {
  const isImperial = metaRef.current.equippedHeirloom === 'IMPERIAL_BANNER';
  const bannerMult = isImperial ? 1.5 : 1.0;

  Object.keys(s.barracks).forEach(key => {
    const level = s.barracks[key];
    if (level > 0) {
      const def = BARRACKS_DEFS[key];
      const maxTime = def.spawnRate * bannerMult;
      const cap = getSquadCap(key, level, metaRef.current.equippedHeirloom, metaRef.current.conqueredRegions);
      const currentCount = s.units.filter(u => u.name === UNIT_TYPES[def.unit]?.name && u.team === 'player' && u.hp > 0).length;

      if (currentCount < cap) {
        const focusMult = (s.focusedBuilding === key) ? 2.0 : 1.0;
        if (s.autoUnlocked[key]) s.timers[key] -= dt * focusMult;

        if (s.timers[key] <= 0) {
          const layout = BARRACKS_LAYOUT[key];
          spawnUnit(s, def.unit, 'player', layout.x, layout.y - 80, metaRef);
          bus.emit(EVENTS.UNIT_SPAWNED, { type: def.unit });
          s.visuals[key] = 1.0;
          s.timers[key] = maxTime;
        }
      } else {
        s.timers[key] = maxTime;
      }
    }
  });

  // Tick visual squash animations
  Object.keys(s.visuals).forEach(k => {
    if (s.visuals[k] > 0) s.visuals[k] = Math.max(0, s.visuals[k] - dt * 7);
  });
}
