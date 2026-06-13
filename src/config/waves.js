export const MAX_ENCOUNTER_PHASES = 5;
export const MAX_BOSS_PRELUDE_PHASES = MAX_ENCOUNTER_PHASES - 1;

export function getPlayableWaveCount(nodeType, configuredWaves = 3) {
  const waves = Math.max(1, configuredWaves ?? 3);
  if (nodeType === 'boss') return Math.min(waves, MAX_BOSS_PRELUDE_PHASES);
  return Math.min(waves, MAX_ENCOUNTER_PHASES);
}

export function getEncounterPhaseCount(nodeType, configuredWaves = 3) {
  const playableWaves = getPlayableWaveCount(nodeType, configuredWaves);
  return nodeType === 'boss' ? playableWaves + 1 : playableWaves;
}

export function getCompressedWavePressure(waveNum, nodeType, configuredWaves = 3) {
  const configured = Math.max(1, configuredWaves ?? 3);
  const playable = getPlayableWaveCount(nodeType, configured);
  if (configured <= playable || playable <= 1) return waveNum;

  const progress = (waveNum - 1) / Math.max(1, playable - 1);
  return Math.max(waveNum, Math.ceil(1 + progress * (configured - 1)));
}

export function getWaveCompressionMultiplier(nodeType, configuredWaves = 3) {
  const configured = Math.max(1, configuredWaves ?? 3);
  const playable = getPlayableWaveCount(nodeType, configured);
  return Math.max(1, configured / Math.max(1, playable));
}
