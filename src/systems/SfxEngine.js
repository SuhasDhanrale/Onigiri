// Procedural one-shot SFX library — same Web Audio approach as MusicEngine.js,
// but for short combat/spell/UI stingers instead of looping compositions.
// Every generator is `(ctx, dest, time, opts) => void` and connects only to
// `dest` (SoundManager's sfxGain).

const EPS = 0.0001;

/** Short burst of filtered white noise. */
function playNoise(ctx, dest, time, {
  duration = 0.2,
  filterType = 'bandpass',
  filterFreq = 1000,
  filterFreqTo = null,
  Q = 1,
  gain = 0.4,
} = {}) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, time);
  if (filterFreqTo !== null) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(EPS, filterFreqTo), time + duration);
  }
  filter.Q.value = Q;

  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, time);
  g.gain.exponentialRampToValueAtTime(EPS, time + duration);

  noise.connect(filter);
  filter.connect(g);
  g.connect(dest);
  noise.start(time);
  noise.stop(time + duration + 0.05);
}

/** Oscillator with an envelope and optional pitch sweep. */
function playTone(ctx, dest, time, {
  freq = 440,
  freqTo = null,
  type = 'sine',
  duration = 0.3,
  gain = 0.35,
  attack = 0.005,
} = {}) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  if (freqTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(EPS, freqTo), time + duration);

  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(gain, time + attack);
  g.gain.exponentialRampToValueAtTime(EPS, time + duration);

  osc.connect(g);
  g.connect(dest);
  osc.start(time);
  osc.stop(time + duration + 0.05);
}

/** Sequence of tones (arpeggio/chime). notes: [{ freq, delay, duration, type, gain }] */
function playChime(ctx, dest, time, notes) {
  notes.forEach(({ freq, delay = 0, duration = 0.25, type = 'triangle', gain = 0.3 }) => {
    playTone(ctx, dest, time + delay, { freq, type, duration, gain });
  });
}

// --- SFX definitions ---

export const SFX_LIBRARY = {
  // -- Combat: melee / sword --
  sword_swing: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.12, filterType: 'bandpass', filterFreq: 2600, filterFreqTo: 900, Q: 1.2, gain: 0.28 });
  },
  sword_hit: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.16, filterType: 'bandpass', filterFreq: 1800, Q: 2, gain: 0.45 });
    playTone(ctx, dest, t, { freq: 620, type: 'triangle', duration: 0.18, gain: 0.3 });
  },
  cavalry_charge_impact: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.4, filterType: 'lowpass', filterFreq: 450, gain: 0.55 });
    playTone(ctx, dest, t, { freq: 90, type: 'sine', duration: 0.4, gain: 0.5 });
  },
  shield_block: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.12, filterType: 'bandpass', filterFreq: 2200, Q: 3, gain: 0.35 });
    playTone(ctx, dest, t, { freq: 320, type: 'square', duration: 0.1, gain: 0.25 });
  },
  ikki_kamikaze: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.3, filterType: 'bandpass', filterFreq: 1200, filterFreqTo: 300, gain: 0.4 });
    playTone(ctx, dest, t, { freq: 500, freqTo: 90, type: 'sawtooth', duration: 0.3, gain: 0.3 });
  },

  // -- Combat: ranged / siege --
  arrow_release: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 280, freqTo: 900, type: 'sawtooth', duration: 0.08, gain: 0.18 });
    playNoise(ctx, dest, t, { duration: 0.06, filterType: 'highpass', filterFreq: 2000, gain: 0.12 });
  },
  arrow_impact: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.08, filterType: 'bandpass', filterFreq: 2600, Q: 2.5, gain: 0.35 });
  },
  arrow_impact_fire: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.25, filterType: 'lowpass', filterFreq: 1400, gain: 0.4 });
    playNoise(ctx, dest, t + 0.05, { duration: 0.15, filterType: 'bandpass', filterFreq: 3000, gain: 0.18 });
  },
  siege_launch: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 220, freqTo: 60, type: 'sine', duration: 0.5, gain: 0.3 });
    playNoise(ctx, dest, t, { duration: 0.4, filterType: 'lowpass', filterFreq: 500, gain: 0.2 });
  },
  siege_impact: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.5, filterType: 'lowpass', filterFreq: 320, gain: 0.65 });
    playTone(ctx, dest, t, { freq: 55, type: 'sine', duration: 0.5, gain: 0.45 });
  },
  orb_hit: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 520, type: 'triangle', duration: 0.22, gain: 0.3 });
    playNoise(ctx, dest, t, { duration: 0.15, filterType: 'bandpass', filterFreq: 1500, gain: 0.25 });
  },

  // -- Combat: parry / defense / status --
  parry_cripple: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 820, freqTo: 220, type: 'sawtooth', duration: 0.25, gain: 0.3 });
    playNoise(ctx, dest, t, { duration: 0.2, filterType: 'bandpass', filterFreq: 1000, gain: 0.2 });
  },
  reflect_hit: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 1200, type: 'sine', duration: 0.3, gain: 0.25 });
    playTone(ctx, dest, t, { freq: 1800, type: 'sine', duration: 0.25, gain: 0.15 });
  },

  // -- Death / defeat --
  unit_death: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.3, filterType: 'lowpass', filterFreq: 600, gain: 0.3 });
    playTone(ctx, dest, t, { freq: 300, freqTo: 80, type: 'sine', duration: 0.32, gain: 0.22 });
  },
  elite_death: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.5, filterType: 'lowpass', filterFreq: 500, gain: 0.45 });
    playTone(ctx, dest, t, { freq: 340, freqTo: 60, type: 'sawtooth', duration: 0.55, gain: 0.35 });
    playNoise(ctx, dest, t + 0.12, { duration: 0.3, filterType: 'lowpass', filterFreq: 400, gain: 0.2 });
  },
  boss_death: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 1.0, filterType: 'lowpass', filterFreq: 220, gain: 0.7 });
    playTone(ctx, dest, t, { freq: 200, freqTo: 30, type: 'sawtooth', duration: 1.1, gain: 0.55 });
    playNoise(ctx, dest, t + 0.2, { duration: 0.6, filterType: 'lowpass', filterFreq: 180, gain: 0.4 });
  },
  gameover_stinger: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 400, freqTo: 50, type: 'sawtooth', duration: 1.2, gain: 0.5 });
    playNoise(ctx, dest, t, { duration: 1.0, filterType: 'lowpass', filterFreq: 300, gain: 0.35 });
  },

  // -- Boss / wave events --
  enemy_alert: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 220, freqTo: 440, type: 'sawtooth', duration: 0.5, gain: 0.35 });
    playTone(ctx, dest, t + 0.3, { freq: 220, freqTo: 440, type: 'sawtooth', duration: 0.5, gain: 0.3 });
  },
  boss_appear: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 60, type: 'sine', duration: 1.5, gain: 0.6 });
    playNoise(ctx, dest, t, { duration: 1.3, filterType: 'lowpass', filterFreq: 200, gain: 0.5 });
  },
  boss_telegraph: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 150, freqTo: 650, type: 'square', duration: 0.8, gain: 0.3 });
  },
  reinforcement_horn: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 220, type: 'sawtooth', duration: 0.6, gain: 0.32 });
    playTone(ctx, dest, t, { freq: 330, type: 'sawtooth', duration: 0.6, gain: 0.2 });
  },
  region_victory_fanfare: (ctx, dest, t) => {
    playChime(ctx, dest, t, [
      { freq: 523, delay: 0.00, duration: 0.35, gain: 0.35 },
      { freq: 659, delay: 0.12, duration: 0.35, gain: 0.35 },
      { freq: 784, delay: 0.24, duration: 0.5, gain: 0.4 },
    ]);
  },
  campaign_victory_fanfare: (ctx, dest, t) => {
    playChime(ctx, dest, t, [
      { freq: 392, delay: 0.00, duration: 0.4, gain: 0.35 },
      { freq: 523, delay: 0.16, duration: 0.4, gain: 0.35 },
      { freq: 659, delay: 0.32, duration: 0.4, gain: 0.4 },
      { freq: 784, delay: 0.48, duration: 0.8, gain: 0.45 },
    ]);
  },

  // -- Spells & special abilities --
  thunder_cast: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 100, freqTo: 1100, type: 'sawtooth', duration: 0.15, gain: 0.3 });
    playNoise(ctx, dest, t, { duration: 0.1, filterType: 'bandpass', filterFreq: 4000, gain: 0.2 });
  },
  lightning_strike: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.06, filterType: 'bandpass', filterFreq: 5000, Q: 1.5, gain: 0.4 });
    playTone(ctx, dest, t, { freq: 2000, freqTo: 600, type: 'square', duration: 0.08, gain: 0.25 });
    playTone(ctx, dest, t, { freq: 90, type: 'sine', duration: 0.3, gain: 0.3 });
  },
  foxfire_cast: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.3, filterType: 'lowpass', filterFreq: 900, gain: 0.35 });
    playTone(ctx, dest, t, { freq: 320, freqTo: 140, type: 'sawtooth', duration: 0.3, gain: 0.25 });
  },
  foxfire_burn: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.12, filterType: 'bandpass', filterFreq: 3000, Q: 1.5, gain: 0.12 });
  },
  dragonwave_cast: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 110, freqTo: 320, type: 'sine', duration: 0.6, gain: 0.45 });
    playNoise(ctx, dest, t, { duration: 0.6, filterType: 'lowpass', filterFreq: 450, gain: 0.35 });
  },
  dragonwave_impact: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.5, filterType: 'lowpass', filterFreq: 280, gain: 0.55 });
    playTone(ctx, dest, t, { freq: 75, type: 'sine', duration: 0.5, gain: 0.4 });
  },
  wardrums_activate: (ctx, dest, t) => {
    [0, 0.12, 0.24].forEach((delay) => {
      playNoise(ctx, dest, t + delay, { duration: 0.15, filterType: 'bandpass', filterFreq: 1000, gain: 0.3 });
      playTone(ctx, dest, t + delay, { freq: 95, type: 'sine', duration: 0.25, gain: 0.35 });
    });
  },
  harvest_activate: (ctx, dest, t) => {
    playChime(ctx, dest, t, [
      { freq: 660, delay: 0, duration: 0.3, gain: 0.3 },
      { freq: 880, delay: 0.08, duration: 0.35, gain: 0.3 },
    ]);
  },
  resolve_heal: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 440, freqTo: 660, type: 'sine', duration: 0.45, gain: 0.32 });
    playTone(ctx, dest, t + 0.05, { freq: 550, type: 'sine', duration: 0.5, gain: 0.22 });
  },
  hero_unlock: (ctx, dest, t) => {
    playChime(ctx, dest, t, [
      { freq: 523, delay: 0.00, duration: 0.35, gain: 0.35 },
      { freq: 659, delay: 0.12, duration: 0.35, gain: 0.35 },
      { freq: 784, delay: 0.24, duration: 0.55, gain: 0.4 },
    ]);
  },

  // -- Cave hazards / ambience --
  mine_explode: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.6, filterType: 'lowpass', filterFreq: 320, gain: 0.6 });
    playTone(ctx, dest, t, { freq: 65, type: 'sine', duration: 0.6, gain: 0.45 });
  },
  fire_burst: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.3, filterType: 'bandpass', filterFreq: 2000, gain: 0.4 });
    playTone(ctx, dest, t, { freq: 400, freqTo: 100, type: 'sawtooth', duration: 0.3, gain: 0.25 });
  },

  // -- UI --
  ui_click: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 880, type: 'sine', duration: 0.05, gain: 0.2 });
  },
  ui_hover: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 1200, type: 'sine', duration: 0.03, gain: 0.1 });
  },
  purchase_success: (ctx, dest, t) => {
    playChime(ctx, dest, t, [
      { freq: 660, delay: 0, duration: 0.12, gain: 0.25 },
      { freq: 880, delay: 0.07, duration: 0.18, gain: 0.28 },
    ]);
  },
  purchase_deny: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 160, type: 'square', duration: 0.15, gain: 0.25 });
  },
  barracks_build: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.15, filterType: 'lowpass', filterFreq: 500, gain: 0.3 });
    playTone(ctx, dest, t + 0.05, { freq: 440, type: 'triangle', duration: 0.2, gain: 0.25 });
  },
  level_up: (ctx, dest, t) => {
    playChime(ctx, dest, t, [
      { freq: 523, delay: 0.00, duration: 0.15, gain: 0.3 },
      { freq: 659, delay: 0.06, duration: 0.15, gain: 0.3 },
      { freq: 784, delay: 0.12, duration: 0.22, gain: 0.32 },
    ]);
  },
  node_select: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 740, type: 'sine', duration: 0.08, gain: 0.2 });
  },
  chapter_select: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 600, freqTo: 900, type: 'sine', duration: 0.15, gain: 0.25 });
  },
  screen_transition: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.25, filterType: 'bandpass', filterFreq: 1800, filterFreqTo: 400, gain: 0.2 });
  },
};

/** Per-id minimum gap (seconds) between plays — keeps high-frequency combat SFX from clipping. */
export const SFX_MIN_INTERVAL = {
  sword_swing: 0.05,
  sword_hit: 0.05,
  arrow_release: 0.05,
  arrow_impact: 0.04,
  arrow_impact_fire: 0.06,
  parry_cripple: 0.1,
  reflect_hit: 0.1,
  unit_death: 0.05,
  foxfire_burn: 0.25,
  lightning_strike: 0.05,
  dragonwave_impact: 0.3,
  ui_hover: 0.15,
};

export const SFX_DEFAULT_INTERVAL = 0.03;
