import { useState, useRef, useEffect } from 'react';
import { createRunState } from '../core/GameState.js';

export function useRunState() {
  const [runState, setRunState] = useState(null);
  const runStateRef = useRef(null);

  useEffect(() => {
    runStateRef.current = runState;
  }, [runState]);

  function startRun(meta) {
    const fresh = createRunState(meta);
    setRunState(fresh);
    return fresh;
  }

  function endRun() {
    setRunState(null);
  }

  return { runState, setRunState, runStateRef, startRun, endRun };
}
