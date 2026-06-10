import { useEffect, useReducer, useRef, useState } from 'react';

/**
 * Generic Mock Lab data bridge — the mechanism that lets a mock behave like the
 * LIVE game without importing the live systems.
 *
 * It seeds a mutable state object once (from `create`), subscribes a map of bus
 * events to reducer fns that mutate it in place, and re-renders the mock when any
 * of them fire. The GAME supplies the content:
 *   - `bus`      — your game's event bus (or webgame-kit/core's bus)
 *   - `create`   — a GAME-STATE-SHAPED factory (usually `() => preset.create()`)
 *   - `handlers` — your own { eventName: (state, payload) => void } mutations,
 *                  mirroring what the real systems do on those events.
 *
 *   const meta = useMockBridge(bus, () => preset.create(), {
 *     DECK_CHANGE:   (m, { deck })    => { m.activeDeck = deck; },
 *     CANDY_UNLOCK:  (m, { candyId }) => { m.unlocked.push(candyId); },
 *   });
 *
 * Because both the state shape and the event names match the real game, a screen
 * built against `meta` here promotes by swapping this bridge for live state.
 */
export function useMockBridge(bus, create, handlers = {}) {
  const [state] = useState(create);
  const ref = useRef(state);
  const [, force] = useReducer((count) => count + 1, 0);

  useEffect(() => {
    const subs = Object.entries(handlers).map(([event, fn]) => {
      const handler = (payload) => {
        fn(ref.current, payload);
        force();
      };
      bus.on(event, handler);
      return () => bus.off(event, handler);
    });
    return () => subs.forEach((off) => off());
    // Subscriptions are seeded once; handlers/bus are treated as stable per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref.current;
}
