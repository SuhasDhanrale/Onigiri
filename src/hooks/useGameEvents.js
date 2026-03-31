import { useEffect } from 'react';
import { bus } from '../core/EventBus.js';
import { EVENTS } from '../core/events.js';

export function useGameEvents(setUiTick) {
  useEffect(() => {
    const tick = () => setUiTick(t => t + 1);

    bus.on(EVENTS.GAME_STATE_CHANGED, tick);
    bus.on(EVENTS.WAVE_CHANGED,       tick);
    bus.on(EVENTS.COMMAND_CHANGED,    tick);
    bus.on(EVENTS.HONOR_EARNED,       tick);
    bus.on(EVENTS.ELITE_KILLED,       tick);
    bus.on(EVENTS.UNIT_SPAWNED,       tick);

    return () => {
      bus.off(EVENTS.GAME_STATE_CHANGED, tick);
      bus.off(EVENTS.WAVE_CHANGED,       tick);
      bus.off(EVENTS.COMMAND_CHANGED,    tick);
      bus.off(EVENTS.HONOR_EARNED,       tick);
      bus.off(EVENTS.ELITE_KILLED,       tick);
      bus.off(EVENTS.UNIT_SPAWNED,       tick);
    };
  }, [setUiTick]);
}
