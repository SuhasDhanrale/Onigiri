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
  const snapSize = Math.floor(ctx.sampleRate * 0.1);
  const snapBuf = ctx.createBuffer(1, snapSize, ctx.sampleRate);
  for (let i = 0; i < snapSize; i++) snapBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const snap = ctx.createBufferSource();
  snap.buffer = snapBuf;

  const snapFilter = ctx.createBiquadFilter();
  snapFilter.type = 'highpass';
  snapFilter.frequency.value = 5000;

  const snapGain = ctx.createGain();
  snapGain.gain.setValueAtTime(0, t);
  snapGain.gain.linearRampToValueAtTime(1.5, t + 0.005);
  snapGain.gain.exponentialRampToValueAtTime(EPS, t + 0.1);

  snap.connect(snapFilter);
  snapFilter.connect(snapGain);
  snapGain.connect(dest);
  snap.start(t);

  const crackSize = Math.floor(ctx.sampleRate * 1.5);
  const crackBuf = ctx.createBuffer(1, crackSize, ctx.sampleRate);
  for (let i = 0; i < crackSize; i++) crackBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const crack = ctx.createBufferSource();
  crack.buffer = crackBuf;

  const crackFilter = ctx.createBiquadFilter();
  crackFilter.type = 'lowpass';
  crackFilter.frequency.setValueAtTime(3000, t);
  crackFilter.frequency.exponentialRampToValueAtTime(200, t + 1.0);

  const crackGain = ctx.createGain();
  crackGain.gain.setValueAtTime(0, t);
  crackGain.gain.linearRampToValueAtTime(1.2, t + 0.02);
  crackGain.gain.exponentialRampToValueAtTime(EPS, t + 1.5);

  crack.connect(crackFilter);
  crackFilter.connect(crackGain);
  crackGain.connect(dest);
  crack.start(t);

  const boom = ctx.createOscillator();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(60, t);
  boom.frequency.exponentialRampToValueAtTime(20, t + 1.0);

  const boomGain = ctx.createGain();
  boomGain.gain.setValueAtTime(0, t);
  boomGain.gain.linearRampToValueAtTime(1.0, t + 0.05);
  boomGain.gain.exponentialRampToValueAtTime(EPS, t + 1.5);

  boom.connect(boomGain);
  boomGain.connect(dest);
  boom.start(t);
  boom.stop(t + 1.6);

  [0.15, 0.35, 0.6, 0.9].forEach((delay, idx) => {
    const rumbleSize = Math.floor(ctx.sampleRate * 0.5);
    const rumbleBuf = ctx.createBuffer(1, rumbleSize, ctx.sampleRate);
    for (let i = 0; i < rumbleSize; i++) rumbleBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
    const rumble = ctx.createBufferSource();
    rumble.buffer = rumbleBuf;

    const rFilter = ctx.createBiquadFilter();
    rFilter.type = 'lowpass';
    rFilter.frequency.value = 800 - (idx * 150);

    const rGain = ctx.createGain();
    rGain.gain.setValueAtTime(0, t + delay);
    rGain.gain.linearRampToValueAtTime(0.6 - (idx * 0.1), t + delay + 0.05);
    rGain.gain.exponentialRampToValueAtTime(EPS, t + delay + 0.5);

    rumble.connect(rFilter);
    rFilter.connect(rGain);
    rGain.connect(dest);
    rumble.start(t + delay);
  });
}

function playKatanaSwing(ctx, dest, t) {
  const bufferSize = Math.floor(ctx.sampleRate * 0.15);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3000, t);
  filter.frequency.exponentialRampToValueAtTime(800, t + 0.15);
  filter.Q.value = 2.0;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(EPS, t + 0.15);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  noise.start(t);

  const ring = ctx.createOscillator();
  ring.type = 'sine';
  ring.frequency.setValueAtTime(4000, t);
  ring.frequency.exponentialRampToValueAtTime(1500, t + 0.15);

  const ringGain = ctx.createGain();
  ringGain.gain.setValueAtTime(0, t);
  ringGain.gain.linearRampToValueAtTime(0.1, t + 0.05);
  ringGain.gain.exponentialRampToValueAtTime(EPS, t + 0.15);

  ring.connect(ringGain);
  ringGain.connect(dest);
  ring.start(t);
  ring.stop(t + 0.2);
}

function playKatanaClash(ctx, dest, t) {
  const thud = ctx.createBufferSource();
  const thudBufSize = Math.floor(ctx.sampleRate * 0.1);
  const thudBuf = ctx.createBuffer(1, thudBufSize, ctx.sampleRate);
  for (let i = 0; i < thudBufSize; i++) thudBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  thud.buffer = thudBuf;

  const thudFilter = ctx.createBiquadFilter();
  thudFilter.type = 'lowpass';
  thudFilter.frequency.value = 800;

  const thudGain = ctx.createGain();
  thudGain.gain.setValueAtTime(0.6, t);
  thudGain.gain.exponentialRampToValueAtTime(EPS, t + 0.1);

  thud.connect(thudFilter);
  thudFilter.connect(thudGain);
  thudGain.connect(dest);
  thud.start(t);

  const freqs = [1200, 2750, 3100, 4800];
  freqs.forEach((f) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.01);
    g.gain.exponentialRampToValueAtTime(EPS, t + 0.3);

    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + 0.35);
  });
}

function playYumiRelease(ctx, dest, t) {
  const snap = ctx.createOscillator();
  snap.type = 'square';
  snap.frequency.setValueAtTime(150, t);
  snap.frequency.exponentialRampToValueAtTime(50, t + 0.05);

  const snapFilter = ctx.createBiquadFilter();
  snapFilter.type = 'lowpass';
  snapFilter.frequency.value = 1000;

  const snapGain = ctx.createGain();
  snapGain.gain.setValueAtTime(0, t);
  snapGain.gain.linearRampToValueAtTime(0.6, t + 0.01);
  snapGain.gain.exponentialRampToValueAtTime(EPS, t + 0.08);

  snap.connect(snapFilter);
  snapFilter.connect(snapGain);
  snapGain.connect(dest);
  snap.start(t);
  snap.stop(t + 0.1);

  const flutterSize = Math.floor(ctx.sampleRate * 0.25);
  const flutterBuf = ctx.createBuffer(1, flutterSize, ctx.sampleRate);
  for (let i = 0; i < flutterSize; i++) flutterBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const flutter = ctx.createBufferSource();
  flutter.buffer = flutterBuf;

  const flutterFilter = ctx.createBiquadFilter();
  flutterFilter.type = 'bandpass';
  flutterFilter.frequency.value = 4000;
  flutterFilter.Q.value = 1.0;

  const flutterGain = ctx.createGain();
  flutterGain.gain.setValueAtTime(0, t + 0.02);
  flutterGain.gain.linearRampToValueAtTime(0.15, t + 0.05);
  flutterGain.gain.exponentialRampToValueAtTime(EPS, t + 0.25);

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 25;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.8;
  lfo.connect(lfoGain);

  const tremolo = ctx.createGain();
  tremolo.gain.value = 1.0;
  lfoGain.connect(tremolo.gain);
  lfo.start(t);
  lfo.stop(t + 0.3);

  flutter.connect(flutterFilter);
  flutterFilter.connect(flutterGain);
  flutterGain.connect(tremolo);
  tremolo.connect(dest);
  flutter.start(t + 0.02);
}

function playBambooImpact(ctx, dest, t) {
  const bufSize = Math.floor(ctx.sampleRate * 0.15);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  for (let i = 0; i < bufSize; i++) buf.getChannelData(0)[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buf;

  const freqs = [400, 1100, 1800];
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, t);
  masterGain.gain.linearRampToValueAtTime(0.8, t + 0.01);
  masterGain.gain.exponentialRampToValueAtTime(EPS, t + 0.15);
  masterGain.connect(dest);

  freqs.forEach((f) => {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f;
    bp.Q.value = 5.0;
    noise.connect(bp);
    bp.connect(masterGain);
  });

  noise.start(t);
}

function playMagicSuzu(ctx, dest, t) {
  const bufSize = Math.floor(ctx.sampleRate * 0.4);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  for (let i = 0; i < bufSize; i++) buf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(2000, t);
  noiseFilter.frequency.exponentialRampToValueAtTime(800, t + 0.4);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, t);
  noiseGain.gain.linearRampToValueAtTime(0.2, t + 0.1);
  noiseGain.gain.exponentialRampToValueAtTime(EPS, t + 0.4);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(dest);
  noise.start(t);

  const bellFreqs = [3500, 4200, 4800, 5600, 6200];
  bellFreqs.forEach((f, idx) => {
    const delay = idx * 0.03;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t + delay);
    g.gain.linearRampToValueAtTime(0.1, t + delay + 0.02);
    g.gain.exponentialRampToValueAtTime(EPS, t + delay + 0.25);

    osc.connect(g);
    g.connect(dest);
    osc.start(t + delay);
    osc.stop(t + delay + 0.3);
  });
}

function playHyoshigi(ctx, dest, t) {
  playTone(ctx, dest, t, { freq: 2000, freqTo: 500, type: 'square', duration: 0.15, gain: 0.55 });
}

function playEnemySpawn(ctx, dest, t) {
  const drumOsc = ctx.createOscillator();
  drumOsc.type = 'sine';
  drumOsc.frequency.setValueAtTime(120, t);
  drumOsc.frequency.exponentialRampToValueAtTime(40, t + 0.4);

  const drumGain = ctx.createGain();
  drumGain.gain.setValueAtTime(0, t);
  drumGain.gain.linearRampToValueAtTime(1.2, t + 0.02);
  drumGain.gain.exponentialRampToValueAtTime(EPS, t + 0.8);

  drumOsc.connect(drumGain);
  drumGain.connect(dest);
  drumOsc.start(t);
  drumOsc.stop(t + 1.0);

  const drumNoiseSize = Math.floor(ctx.sampleRate * 0.4);
  const drumNoiseBuffer = ctx.createBuffer(1, drumNoiseSize, ctx.sampleRate);
  const drumNoiseData = drumNoiseBuffer.getChannelData(0);
  for (let i = 0; i < drumNoiseSize; i++) drumNoiseData[i] = Math.random() * 2 - 1;

  const drumNoise = ctx.createBufferSource();
  drumNoise.buffer = drumNoiseBuffer;

  const drumNoiseFilter = ctx.createBiquadFilter();
  drumNoiseFilter.type = 'bandpass';
  drumNoiseFilter.frequency.value = 400;
  drumNoiseFilter.Q.value = 1.0;

  const drumNoiseGain = ctx.createGain();
  drumNoiseGain.gain.setValueAtTime(0, t);
  drumNoiseGain.gain.linearRampToValueAtTime(0.5, t + 0.02);
  drumNoiseGain.gain.exponentialRampToValueAtTime(EPS, t + 0.5);

  drumNoise.connect(drumNoiseFilter);
  drumNoiseFilter.connect(drumNoiseGain);
  drumNoiseGain.connect(dest);
  drumNoise.start(t);
  drumNoise.stop(t + 0.5);

  const drone = ctx.createOscillator();
  drone.type = 'sawtooth';
  drone.frequency.setValueAtTime(55, t);
  drone.frequency.linearRampToValueAtTime(52, t + 2.0);

  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.setValueAtTime(100, t);
  droneFilter.frequency.linearRampToValueAtTime(300, t + 1.0);
  droneFilter.frequency.linearRampToValueAtTime(50, t + 2.5);

  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0, t);
  droneGain.gain.linearRampToValueAtTime(0.4, t + 0.8);
  droneGain.gain.exponentialRampToValueAtTime(EPS, t + 2.5);

  drone.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(dest);
  drone.start(t);
  drone.stop(t + 3.0);

  [0.1, 0.3, 0.45, 0.7].forEach((delay) => {
    const clatterSize = Math.floor(ctx.sampleRate * 0.05);
    const clatterBuffer = ctx.createBuffer(1, clatterSize, ctx.sampleRate);
    const clatterData = clatterBuffer.getChannelData(0);
    for (let i = 0; i < clatterSize; i++) clatterData[i] = Math.random() * 2 - 1;

    const clatter = ctx.createBufferSource();
    clatter.buffer = clatterBuffer;

    const clatterFilter = ctx.createBiquadFilter();
    clatterFilter.type = 'highpass';
    clatterFilter.frequency.value = 3000;

    const clatterGain = ctx.createGain();
    clatterGain.gain.setValueAtTime(0, t + delay);
    clatterGain.gain.linearRampToValueAtTime(0.15, t + delay + 0.01);
    clatterGain.gain.exponentialRampToValueAtTime(EPS, t + delay + 0.08);

    clatter.connect(clatterFilter);
    clatterFilter.connect(clatterGain);
    clatterGain.connect(dest);
    clatter.start(t + delay);
    clatter.stop(t + delay + 0.1);
  });
}

function playFatalUnitDeath(ctx, dest, t) {
  const sliceSize = Math.floor(ctx.sampleRate * 0.1);
  const sliceBuf = ctx.createBuffer(1, sliceSize, ctx.sampleRate);
  for (let i = 0; i < sliceSize; i++) sliceBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const slice = ctx.createBufferSource();
  slice.buffer = sliceBuf;

  const sliceFilter = ctx.createBiquadFilter();
  sliceFilter.type = 'highpass';
  sliceFilter.frequency.setValueAtTime(4000, t);
  sliceFilter.frequency.exponentialRampToValueAtTime(1000, t + 0.1);

  const sliceGain = ctx.createGain();
  sliceGain.gain.setValueAtTime(0, t);
  sliceGain.gain.linearRampToValueAtTime(0.8, t + 0.01);
  sliceGain.gain.exponentialRampToValueAtTime(EPS, t + 0.1);

  slice.connect(sliceFilter);
  sliceFilter.connect(sliceGain);
  sliceGain.connect(dest);
  slice.start(t);

  const fall = ctx.createOscillator();
  fall.type = 'sine';
  fall.frequency.setValueAtTime(100, t + 0.05);
  fall.frequency.exponentialRampToValueAtTime(30, t + 0.3);

  const fallGain = ctx.createGain();
  fallGain.gain.setValueAtTime(0, t + 0.05);
  fallGain.gain.linearRampToValueAtTime(1.0, t + 0.08);
  fallGain.gain.exponentialRampToValueAtTime(EPS, t + 0.3);

  fall.connect(fallGain);
  fallGain.connect(dest);
  fall.start(t + 0.05);
  fall.stop(t + 0.4);

  const rattleSize = Math.floor(ctx.sampleRate * 0.4);
  const rattleBuf = ctx.createBuffer(1, rattleSize, ctx.sampleRate);
  for (let i = 0; i < rattleSize; i++) rattleBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const rattle = ctx.createBufferSource();
  rattle.buffer = rattleBuf;

  const rattleFilter = ctx.createBiquadFilter();
  rattleFilter.type = 'bandpass';
  rattleFilter.frequency.setValueAtTime(800, t + 0.05);
  rattleFilter.frequency.exponentialRampToValueAtTime(200, t + 0.4);

  const rattleGain = ctx.createGain();
  rattleGain.gain.setValueAtTime(0, t + 0.05);
  rattleGain.gain.linearRampToValueAtTime(0.5, t + 0.1);
  rattleGain.gain.exponentialRampToValueAtTime(EPS, t + 0.4);

  rattle.connect(rattleFilter);
  rattleFilter.connect(rattleGain);
  rattleGain.connect(dest);
  rattle.start(t + 0.05);
}

function playSiegeStrike(ctx, dest, t) {
  const boom = ctx.createOscillator();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(120, t);
  boom.frequency.exponentialRampToValueAtTime(20, t + 0.8);

  const boomGain = ctx.createGain();
  boomGain.gain.setValueAtTime(0, t);
  boomGain.gain.linearRampToValueAtTime(1.5, t + 0.02);
  boomGain.gain.exponentialRampToValueAtTime(EPS, t + 1.0);

  boom.connect(boomGain);
  boomGain.connect(dest);
  boom.start(t);
  boom.stop(t + 1.2);

  const crunchSize = Math.floor(ctx.sampleRate * 1.5);
  const crunchBuf = ctx.createBuffer(1, crunchSize, ctx.sampleRate);
  for (let i = 0; i < crunchSize; i++) crunchBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const crunch = ctx.createBufferSource();
  crunch.buffer = crunchBuf;

  const crunchFilter = ctx.createBiquadFilter();
  crunchFilter.type = 'lowpass';
  crunchFilter.frequency.setValueAtTime(1500, t);
  crunchFilter.frequency.exponentialRampToValueAtTime(150, t + 1.2);

  const distNode = ctx.createWaveShaper();
  const curve = new Float32Array(400);
  for (let i = 0; i < 400; i++) {
    const x = i * 2 / 400 - 1;
    curve[i] = (3 + 10) * x * 20 * (Math.PI / 180) / (Math.PI + 10 * Math.abs(x));
  }
  distNode.curve = curve;

  const crunchGain = ctx.createGain();
  crunchGain.gain.setValueAtTime(0, t);
  crunchGain.gain.linearRampToValueAtTime(1.2, t + 0.05);
  crunchGain.gain.linearRampToValueAtTime(0.8, t + 0.3);
  crunchGain.gain.linearRampToValueAtTime(1.0, t + 0.5);
  crunchGain.gain.exponentialRampToValueAtTime(EPS, t + 1.5);

  crunch.connect(crunchFilter);
  crunchFilter.connect(distNode);
  distNode.connect(crunchGain);
  crunchGain.connect(dest);
  crunch.start(t);
}

function playBossPowerAttack(ctx, dest, t) {
  const windupSize = Math.floor(ctx.sampleRate * 0.8);
  const windupBuf = ctx.createBuffer(1, windupSize, ctx.sampleRate);
  for (let i = 0; i < windupSize; i++) windupBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const windup = ctx.createBufferSource();
  windup.buffer = windupBuf;

  const wFilter = ctx.createBiquadFilter();
  wFilter.type = 'bandpass';
  wFilter.frequency.setValueAtTime(200, t);
  wFilter.frequency.exponentialRampToValueAtTime(3000, t + 0.8);

  const wGain = ctx.createGain();
  wGain.gain.setValueAtTime(EPS, t);
  wGain.gain.exponentialRampToValueAtTime(0.8, t + 0.8);

  windup.connect(wFilter);
  wFilter.connect(wGain);
  wGain.connect(dest);
  windup.start(t);

  const impactTime = t + 0.8;

  const boom = ctx.createOscillator();
  boom.type = 'sawtooth';
  boom.frequency.setValueAtTime(200, impactTime);
  boom.frequency.exponentialRampToValueAtTime(20, impactTime + 1.5);

  const boomGain = ctx.createGain();
  boomGain.gain.setValueAtTime(0, impactTime);
  boomGain.gain.linearRampToValueAtTime(1.5, impactTime + 0.05);
  boomGain.gain.exponentialRampToValueAtTime(EPS, impactTime + 1.5);

  boom.connect(boomGain);
  boomGain.connect(dest);
  boom.start(impactTime);
  boom.stop(impactTime + 2.0);

  const explSize = Math.floor(ctx.sampleRate * 2.0);
  const explBuf = ctx.createBuffer(1, explSize, ctx.sampleRate);
  for (let i = 0; i < explSize; i++) explBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const expl = ctx.createBufferSource();
  expl.buffer = explBuf;

  const eFilter = ctx.createBiquadFilter();
  eFilter.type = 'lowpass';
  eFilter.frequency.setValueAtTime(5000, impactTime);
  eFilter.frequency.exponentialRampToValueAtTime(100, impactTime + 2.0);

  const distNode = ctx.createWaveShaper();
  const curve = new Float32Array(400);
  for (let i = 0; i < 400; i++) {
    const x = i * 2 / 400 - 1;
    curve[i] = (3 + 50) * x * 20 * (Math.PI / 180) / (Math.PI + 50 * Math.abs(x));
  }
  distNode.curve = curve;

  const eGain = ctx.createGain();
  eGain.gain.setValueAtTime(0, impactTime);
  eGain.gain.linearRampToValueAtTime(1.2, impactTime + 0.05);
  eGain.gain.exponentialRampToValueAtTime(EPS, impactTime + 2.0);

  expl.connect(eFilter);
  eFilter.connect(distNode);
  distNode.connect(eGain);
  eGain.connect(dest);
  expl.start(impactTime);

  [800, 1050, 1400].forEach((freq) => {
    const ring = ctx.createOscillator();
    ring.type = 'triangle';
    ring.frequency.value = freq;

    const rGain = ctx.createGain();
    rGain.gain.setValueAtTime(0, impactTime);
    rGain.gain.linearRampToValueAtTime(0.2, impactTime + 0.1);
    rGain.gain.exponentialRampToValueAtTime(EPS, impactTime + 2.5);

    ring.connect(rGain);
    rGain.connect(dest);
    ring.start(impactTime);
    ring.stop(impactTime + 3.0);
  });
}

function playSwiftBossAttack(ctx, dest, t) {
  const dashSize = Math.floor(ctx.sampleRate * 0.3);
  const dashBuf = ctx.createBuffer(1, dashSize, ctx.sampleRate);
  for (let i = 0; i < dashSize; i++) dashBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const dash = ctx.createBufferSource();
  dash.buffer = dashBuf;

  const dFilter = ctx.createBiquadFilter();
  dFilter.type = 'bandpass';
  dFilter.frequency.setValueAtTime(500, t);
  dFilter.frequency.exponentialRampToValueAtTime(5000, t + 0.2);

  const dGain = ctx.createGain();
  dGain.gain.setValueAtTime(0, t);
  dGain.gain.linearRampToValueAtTime(0.8, t + 0.1);
  dGain.gain.exponentialRampToValueAtTime(EPS, t + 0.3);

  dash.connect(dFilter);
  dFilter.connect(dGain);
  dGain.connect(dest);
  dash.start(t);

  const flurryTime = t + 0.25;
  [0, 0.1, 0.2].forEach((delay) => {
    const sliceSize = Math.floor(ctx.sampleRate * 0.1);
    const sliceBuf = ctx.createBuffer(1, sliceSize, ctx.sampleRate);
    for (let i = 0; i < sliceSize; i++) sliceBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
    const slice = ctx.createBufferSource();
    slice.buffer = sliceBuf;

    const sFilter = ctx.createBiquadFilter();
    sFilter.type = 'highpass';
    sFilter.frequency.value = 6000;

    const sGain = ctx.createGain();
    sGain.gain.setValueAtTime(0, flurryTime + delay);
    sGain.gain.linearRampToValueAtTime(1.0, flurryTime + delay + 0.01);
    sGain.gain.exponentialRampToValueAtTime(EPS, flurryTime + delay + 0.08);

    slice.connect(sFilter);
    sFilter.connect(sGain);
    sGain.connect(dest);
    slice.start(flurryTime + delay);

    const ring = ctx.createOscillator();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(4500, flurryTime + delay);
    ring.frequency.exponentialRampToValueAtTime(2000, flurryTime + delay + 0.1);

    const rGain = ctx.createGain();
    rGain.gain.setValueAtTime(0, flurryTime + delay);
    rGain.gain.linearRampToValueAtTime(0.3, flurryTime + delay + 0.01);
    rGain.gain.exponentialRampToValueAtTime(EPS, flurryTime + delay + 0.1);

    ring.connect(rGain);
    rGain.connect(dest);
    ring.start(flurryTime + delay);
    ring.stop(flurryTime + delay + 0.15);
  });
}

function playMiningBossAttack(ctx, dest, t) {
  const grindSize = Math.floor(ctx.sampleRate * 0.8);
  const grindBuf = ctx.createBuffer(1, grindSize, ctx.sampleRate);
  for (let i = 0; i < grindSize; i++) grindBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const grind = ctx.createBufferSource();
  grind.buffer = grindBuf;

  const gFilter = ctx.createBiquadFilter();
  gFilter.type = 'lowpass';
  gFilter.frequency.setValueAtTime(300, t);
  gFilter.frequency.linearRampToValueAtTime(800, t + 0.7);

  const gGain = ctx.createGain();
  gGain.gain.setValueAtTime(0, t);
  gGain.gain.linearRampToValueAtTime(0.6, t + 0.4);
  gGain.gain.exponentialRampToValueAtTime(EPS, t + 0.8);

  grind.connect(gFilter);
  gFilter.connect(gGain);
  gGain.connect(dest);
  grind.start(t);

  const impactTime = t + 0.7;

  const freqs = [800, 1500, 2200];
  freqs.forEach((f) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, impactTime);
    gain.gain.linearRampToValueAtTime(0.5, impactTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(EPS, impactTime + 0.4);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(impactTime);
    osc.stop(impactTime + 0.5);
  });

  const boom = ctx.createOscillator();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(80, impactTime);
  boom.frequency.exponentialRampToValueAtTime(10, impactTime + 1.5);

  const bGain = ctx.createGain();
  bGain.gain.setValueAtTime(0, impactTime);
  bGain.gain.linearRampToValueAtTime(2.0, impactTime + 0.05);
  bGain.gain.exponentialRampToValueAtTime(EPS, impactTime + 1.5);

  boom.connect(bGain);
  bGain.connect(dest);
  boom.start(impactTime);
  boom.stop(impactTime + 2.0);

  const earthSize = Math.floor(ctx.sampleRate * 2.0);
  const earthBuf = ctx.createBuffer(1, earthSize, ctx.sampleRate);
  for (let i = 0; i < earthSize; i++) earthBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const earth = ctx.createBufferSource();
  earth.buffer = earthBuf;

  const eFilter = ctx.createBiquadFilter();
  eFilter.type = 'lowpass';
  eFilter.frequency.setValueAtTime(1500, impactTime);
  eFilter.frequency.exponentialRampToValueAtTime(100, impactTime + 1.5);

  const eGain = ctx.createGain();
  eGain.gain.setValueAtTime(0, impactTime);
  eGain.gain.linearRampToValueAtTime(1.0, impactTime + 0.1);
  eGain.gain.linearRampToValueAtTime(0.5, impactTime + 0.5);
  eGain.gain.exponentialRampToValueAtTime(EPS, impactTime + 2.0);

  earth.connect(eFilter);
  eFilter.connect(eGain);
  eGain.connect(dest);
  earth.start(impactTime);
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
    playTone(ctx, dest, t, { freq: 360, type: 'triangle', duration: 0.06, gain: 0.11 });
  },
  ui_hover: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 620, type: 'sine', duration: 0.025, gain: 0.05 });
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
    playTone(ctx, dest, t, { freq: 420, type: 'triangle', duration: 0.08, gain: 0.12 });
  },
  chapter_select: (ctx, dest, t) => {
    playTone(ctx, dest, t, { freq: 420, freqTo: 560, type: 'triangle', duration: 0.15, gain: 0.14 });
  },
  screen_transition: (ctx, dest, t) => {
    playNoise(ctx, dest, t, { duration: 0.22, filterType: 'bandpass', filterFreq: 700, filterFreqTo: 260, Q: 0.8, gain: 0.08 });
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
