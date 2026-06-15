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

function playResonantNoise(ctx, dest, time, {
  duration = 0.15,
  freqs = [500, 1200],
  Q = 4,
  gain = 0.6,
} = {}) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(gain, time + 0.01);
  g.gain.exponentialRampToValueAtTime(EPS, time + duration);
  g.connect(dest);

  freqs.forEach((freq) => {
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = Q;
    noise.connect(filter);
    filter.connect(g);
  });

  noise.start(time);
  noise.stop(time + duration + 0.05);
}

function playRealisticThunder(ctx, dest, t) {
  playNoise(ctx, dest, t, { duration: 0.1, filterType: 'highpass', filterFreq: 5000, gain: 1.2 });
  playNoise(ctx, dest, t + 0.01, { duration: 1.5, filterType: 'lowpass', filterFreq: 3000, filterFreqTo: 200, gain: 0.9 });
  playTone(ctx, dest, t, { freq: 60, freqTo: 20, type: 'sine', duration: 1.5, gain: 0.7, attack: 0.05 });
  [0.15, 0.35, 0.6, 0.9].forEach((delay, index) => {
    playNoise(ctx, dest, t + delay, {
      duration: 0.5,
      filterType: 'lowpass',
      filterFreq: 800 - index * 150,
      gain: 0.42 - index * 0.06,
    });
  });
}

function playKatanaSwing(ctx, dest, t) {
  playNoise(ctx, dest, t, { duration: 0.15, filterType: 'bandpass', filterFreq: 3000, filterFreqTo: 800, Q: 2, gain: 0.36 });
  playTone(ctx, dest, t, { freq: 4000, freqTo: 1500, type: 'sine', duration: 0.15, gain: 0.08, attack: 0.05 });
}

function playKatanaClash(ctx, dest, t) {
  playNoise(ctx, dest, t, { duration: 0.1, filterType: 'lowpass', filterFreq: 800, gain: 0.45 });
  playChime(ctx, dest, t, [
    { freq: 1200, duration: 0.3, gain: 0.12 },
    { freq: 2750, duration: 0.3, gain: 0.12 },
    { freq: 3100, duration: 0.3, gain: 0.1 },
    { freq: 4800, duration: 0.25, gain: 0.08 },
  ]);
}

function playYumiRelease(ctx, dest, t) {
  playTone(ctx, dest, t, { freq: 150, freqTo: 50, type: 'square', duration: 0.08, gain: 0.42, attack: 0.01 });
  playNoise(ctx, dest, t + 0.02, { duration: 0.25, filterType: 'bandpass', filterFreq: 4000, Q: 1, gain: 0.14 });
}

function playBambooImpact(ctx, dest, t) {
  playResonantNoise(ctx, dest, t, { duration: 0.15, freqs: [400, 1100, 1800], Q: 5, gain: 0.58 });
}

function playMagicSuzu(ctx, dest, t) {
  playNoise(ctx, dest, t, { duration: 0.4, filterType: 'bandpass', filterFreq: 2000, filterFreqTo: 800, gain: 0.16 });
  playChime(ctx, dest, t, [
    { freq: 3500, delay: 0.00, duration: 0.25, gain: 0.08, type: 'sine' },
    { freq: 4200, delay: 0.03, duration: 0.25, gain: 0.08, type: 'sine' },
    { freq: 4800, delay: 0.06, duration: 0.25, gain: 0.07, type: 'sine' },
    { freq: 5600, delay: 0.09, duration: 0.24, gain: 0.06, type: 'sine' },
    { freq: 6200, delay: 0.12, duration: 0.22, gain: 0.05, type: 'sine' },
  ]);
}

function playHyoshigi(ctx, dest, t) {
  playTone(ctx, dest, t, { freq: 2000, freqTo: 500, type: 'square', duration: 0.15, gain: 0.55 });
}

function playEnemySpawn(ctx, dest, t) {
  playTone(ctx, dest, t, { freq: 120, freqTo: 40, type: 'sine', duration: 0.8, gain: 0.85, attack: 0.02 });
  playNoise(ctx, dest, t, { duration: 0.5, filterType: 'bandpass', filterFreq: 400, Q: 1, gain: 0.35 });
  playTone(ctx, dest, t, { freq: 55, freqTo: 52, type: 'sawtooth', duration: 2.5, gain: 0.22, attack: 0.8 });
  [0.1, 0.3, 0.45, 0.7].forEach((delay) => {
    playNoise(ctx, dest, t + delay, { duration: 0.08, filterType: 'highpass', filterFreq: 3000, gain: 0.09 });
  });
}

function playFatalUnitDeath(ctx, dest, t) {
  playNoise(ctx, dest, t, { duration: 0.1, filterType: 'highpass', filterFreq: 4000, filterFreqTo: 1000, gain: 0.5 });
  playTone(ctx, dest, t + 0.05, { freq: 100, freqTo: 30, type: 'sine', duration: 0.3, gain: 0.5, attack: 0.03 });
  playNoise(ctx, dest, t + 0.05, { duration: 0.4, filterType: 'bandpass', filterFreq: 800, filterFreqTo: 200, gain: 0.3 });
}

function playSiegeStrike(ctx, dest, t) {
  playTone(ctx, dest, t, { freq: 120, freqTo: 20, type: 'sine', duration: 1.0, gain: 0.9, attack: 0.02 });
  playNoise(ctx, dest, t, { duration: 1.5, filterType: 'lowpass', filterFreq: 1500, filterFreqTo: 150, gain: 0.7 });
}

function playBossPowerAttack(ctx, dest, t) {
  playNoise(ctx, dest, t, { duration: 0.8, filterType: 'bandpass', filterFreq: 200, filterFreqTo: 3000, gain: 0.42 });
  const impactTime = t + 0.8;
  playTone(ctx, dest, impactTime, { freq: 200, freqTo: 20, type: 'sawtooth', duration: 1.5, gain: 0.85, attack: 0.05 });
  playNoise(ctx, dest, impactTime, { duration: 2.0, filterType: 'lowpass', filterFreq: 5000, filterFreqTo: 100, gain: 0.65 });
  playChime(ctx, dest, impactTime, [
    { freq: 800, duration: 2.5, gain: 0.12 },
    { freq: 1050, duration: 2.5, gain: 0.1 },
    { freq: 1400, duration: 2.4, gain: 0.09 },
  ]);
}

function playSwiftBossAttack(ctx, dest, t) {
  playNoise(ctx, dest, t, { duration: 0.3, filterType: 'bandpass', filterFreq: 500, filterFreqTo: 5000, gain: 0.5 });
  [0.25, 0.35, 0.45].forEach((delay) => {
    playNoise(ctx, dest, t + delay, { duration: 0.08, filterType: 'highpass', filterFreq: 6000, gain: 0.55 });
    playTone(ctx, dest, t + delay, { freq: 4500, freqTo: 2000, type: 'sine', duration: 0.1, gain: 0.18 });
  });
}

function playMiningBossAttack(ctx, dest, t) {
  playNoise(ctx, dest, t, { duration: 0.8, filterType: 'lowpass', filterFreq: 300, filterFreqTo: 800, gain: 0.42 });
  const impactTime = t + 0.7;
  playChime(ctx, dest, impactTime, [
    { freq: 800, duration: 0.4, gain: 0.28 },
    { freq: 1500, duration: 0.4, gain: 0.24 },
    { freq: 2200, duration: 0.35, gain: 0.2 },
  ]);
  playTone(ctx, dest, impactTime, { freq: 80, freqTo: 10, type: 'sine', duration: 1.5, gain: 0.9, attack: 0.05 });
  playNoise(ctx, dest, impactTime, { duration: 2.0, filterType: 'lowpass', filterFreq: 1500, filterFreqTo: 100, gain: 0.55 });
}

// --- SFX definitions ---

export const SFX_LIBRARY = {
  // -- Combat: melee / sword --
  sword_swing: (ctx, dest, t) => {
    playKatanaSwing(ctx, dest, t);
  },
  sword_hit: (ctx, dest, t) => {
    playKatanaClash(ctx, dest, t);
  },
  cavalry_charge_impact: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.4, filterType: 'lowpass', filterFreq: 450, gain: 0.55 });
    playTone(ctx, dest, t, { freq: 90, type: 'sine', duration: 0.4, gain: 0.5 });
  },
  shield_block: (ctx, dest, t) => {
    playBambooImpact(ctx, dest, t);
  },
  ikki_kamikaze: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.3, filterType: 'bandpass', filterFreq: 1200, filterFreqTo: 300, gain: 0.4 });
    playTone(ctx, dest, t, { freq: 500, freqTo: 90, type: 'sawtooth', duration: 0.3, gain: 0.3 });
  },

  // -- Combat: ranged / siege --
  arrow_release: (ctx, dest, t) => {
    playYumiRelease(ctx, dest, t);
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
    playSiegeStrike(ctx, dest, t);
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
    playFatalUnitDeath(ctx, dest, t);
  },
  elite_death: (ctx, dest, t) => {
    playFatalUnitDeath(ctx, dest, t);
    playNoise(ctx, dest, t + 0.12, { duration: 0.55, filterType: 'lowpass', filterFreq: 480, gain: 0.32 });
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
    playEnemySpawn(ctx, dest, t);
  },
  boss_appear: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 60, type: 'sine', duration: 1.5, gain: 0.6 });
    playNoise(ctx, dest, t, { duration: 1.3, filterType: 'lowpass', filterFreq: 200, gain: 0.5 });
  },
  boss_telegraph: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.8, filterType: 'bandpass', filterFreq: 200, filterFreqTo: 3000, gain: 0.42 });
  },
  boss_power_attack: (ctx, dest, t) => {
    playBossPowerAttack(ctx, dest, t);
  },
  boss_swift_attack: (ctx, dest, t) => {
    playSwiftBossAttack(ctx, dest, t);
  },
  boss_mining_attack: (ctx, dest, t) => {
    playMiningBossAttack(ctx, dest, t);
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
    playMagicSuzu(ctx, dest, t);
  },
  lightning_strike: (ctx, dest, t) => {
    playRealisticThunder(ctx, dest, t);
  },
  foxfire_cast: (ctx, dest, t) => {
    playMagicSuzu(ctx, dest, t);
    playNoise(ctx, dest, t + 0.06, { duration: 0.3, filterType: 'lowpass', filterFreq: 900, gain: 0.2 });
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
    playHyoshigi(ctx, dest, t);
    playNoise(ctx, dest, t, { duration: 0.25, filterType: 'bandpass', filterFreq: 1800, filterFreqTo: 400, gain: 0.12 });
  },
};

/** Per-id minimum gap (seconds) between plays — keeps high-frequency combat SFX from clipping. */
export const SFX_MIN_INTERVAL = {
  sword_swing: 0.05,
  sword_hit: 0.05,
  arrow_release: 0.05,
  arrow_impact: 0.04,
  arrow_impact_fire: 0.06,
  siege_impact: 0.25,
  parry_cripple: 0.1,
  reflect_hit: 0.1,
  unit_death: 0.12,
  elite_death: 0.18,
  enemy_alert: 1.0,
  boss_telegraph: 0.6,
  boss_power_attack: 1.2,
  boss_swift_attack: 1.0,
  boss_mining_attack: 1.2,
  foxfire_burn: 0.25,
  lightning_strike: 0.25,
  dragonwave_impact: 0.3,
  screen_transition: 0.12,
  ui_hover: 0.15,
};

export const SFX_DEFAULT_INTERVAL = 0.03;
