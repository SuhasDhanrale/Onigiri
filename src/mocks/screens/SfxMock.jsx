import React, { useRef, useEffect } from 'react';

const EPS = 0.0001;

function playRealisticThunder(ctx, dest, time) {
  // 1. The Electrical Snap (No pitch sweep, just pure high-frequency noise)
  const snapSize = Math.floor(ctx.sampleRate * 0.1);
  const snapBuf = ctx.createBuffer(1, snapSize, ctx.sampleRate);
  for (let i = 0; i < snapSize; i++) snapBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const snap = ctx.createBufferSource();
  snap.buffer = snapBuf;
  
  const snapFilter = ctx.createBiquadFilter();
  snapFilter.type = 'highpass';
  snapFilter.frequency.value = 5000; // Only high frequencies
  
  const snapGain = ctx.createGain();
  snapGain.gain.setValueAtTime(0, time);
  snapGain.gain.linearRampToValueAtTime(1.5, time + 0.005); // Instant attack
  snapGain.gain.exponentialRampToValueAtTime(EPS, time + 0.1); // Fast decay
  
  snap.connect(snapFilter);
  snapFilter.connect(snapGain);
  snapGain.connect(dest);
  snap.start(time);

  // 2. The Main Thunder Crack (Wide noise explosion, no laser tone)
  const crackSize = Math.floor(ctx.sampleRate * 1.5);
  const crackBuf = ctx.createBuffer(1, crackSize, ctx.sampleRate);
  for (let i = 0; i < crackSize; i++) crackBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const crack = ctx.createBufferSource();
  crack.buffer = crackBuf;
  
  const crackFilter = ctx.createBiquadFilter();
  crackFilter.type = 'lowpass';
  // Start bright, get muffled as the sound decays
  crackFilter.frequency.setValueAtTime(3000, time);
  crackFilter.frequency.exponentialRampToValueAtTime(200, time + 1.0);
  
  const crackGain = ctx.createGain();
  crackGain.gain.setValueAtTime(0, time);
  crackGain.gain.linearRampToValueAtTime(1.2, time + 0.02);
  crackGain.gain.exponentialRampToValueAtTime(EPS, time + 1.5);
  
  crack.connect(crackFilter);
  crackFilter.connect(crackGain);
  crackGain.connect(dest);
  crack.start(time);
  
  // 3. The Deep Sub-Bass Rumble (No high pitch, just floor-shaking low freq)
  const boom = ctx.createOscillator();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(60, time); // Start low, so no "pew" sound
  boom.frequency.exponentialRampToValueAtTime(20, time + 1.0);
  
  const boomGain = ctx.createGain();
  boomGain.gain.setValueAtTime(0, time);
  boomGain.gain.linearRampToValueAtTime(1.0, time + 0.05); 
  boomGain.gain.exponentialRampToValueAtTime(EPS, time + 1.5);
  
  boom.connect(boomGain);
  boomGain.connect(dest);
  boom.start(time);
  boom.stop(time + 1.6);

  // 4. Heavy Rolling Echoes (Randomized lowpass noise bursts)
  [0.15, 0.35, 0.6, 0.9].forEach((delay, idx) => {
    const rumbleSize = Math.floor(ctx.sampleRate * 0.5);
    const rumbleBuf = ctx.createBuffer(1, rumbleSize, ctx.sampleRate);
    for (let i = 0; i < rumbleSize; i++) rumbleBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
    const rumble = ctx.createBufferSource();
    rumble.buffer = rumbleBuf;
    
    const rFilter = ctx.createBiquadFilter();
    rFilter.type = 'lowpass';
    rFilter.frequency.value = 800 - (idx * 150); // Gets more muffled
    
    const rGain = ctx.createGain();
    rGain.gain.setValueAtTime(0, time + delay);
    rGain.gain.linearRampToValueAtTime(0.6 - (idx * 0.1), time + delay + 0.05);
    rGain.gain.exponentialRampToValueAtTime(EPS, time + delay + 0.5);
    
    rumble.connect(rFilter);
    rFilter.connect(rGain);
    rGain.connect(dest);
    rumble.start(time + delay);
  });
}

function playKatanaSwing(ctx, dest, time) {
  // Fast sweeping bandpass noise
  const bufferSize = Math.floor(ctx.sampleRate * 0.15);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3000, time);
  filter.frequency.exponentialRampToValueAtTime(800, time + 0.15);
  filter.Q.value = 2.0;
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.4, time + 0.05);
  gain.gain.exponentialRampToValueAtTime(EPS, time + 0.15);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  noise.start(time);
  
  // High metallic ringing sine that sweeps down
  const ring = ctx.createOscillator();
  ring.type = 'sine';
  ring.frequency.setValueAtTime(4000, time);
  ring.frequency.exponentialRampToValueAtTime(1500, time + 0.15);
  
  const ringGain = ctx.createGain();
  ringGain.gain.setValueAtTime(0, time);
  ringGain.gain.linearRampToValueAtTime(0.1, time + 0.05);
  ringGain.gain.exponentialRampToValueAtTime(EPS, time + 0.15);
  
  ring.connect(ringGain);
  ringGain.connect(dest);
  ring.start(time);
  ring.stop(time + 0.2);
}

function playKatanaClash(ctx, dest, time) {
  // Impact thud
  const thud = ctx.createBufferSource();
  const thudBufSize = Math.floor(ctx.sampleRate * 0.1);
  const thudBuf = ctx.createBuffer(1, thudBufSize, ctx.sampleRate);
  for (let i = 0; i < thudBufSize; i++) thudBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  thud.buffer = thudBuf;
  
  const thudFilter = ctx.createBiquadFilter();
  thudFilter.type = 'lowpass';
  thudFilter.frequency.value = 800;
  
  const thudGain = ctx.createGain();
  thudGain.gain.setValueAtTime(0.6, time);
  thudGain.gain.exponentialRampToValueAtTime(EPS, time + 0.1);
  
  thud.connect(thudFilter);
  thudFilter.connect(thudGain);
  thudGain.connect(dest);
  thud.start(time);
  
  // Metallic Clang using multiple inharmonic oscillators
  const freqs = [1200, 2750, 3100, 4800];
  freqs.forEach((f) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.15, time + 0.01);
    g.gain.exponentialRampToValueAtTime(EPS, time + 0.3);
    
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.35);
  });
}

function playYumiRelease(ctx, dest, time) {
  // The wooden snap
  const snap = ctx.createOscillator();
  snap.type = 'square';
  snap.frequency.setValueAtTime(150, time);
  snap.frequency.exponentialRampToValueAtTime(50, time + 0.05);
  
  const snapFilter = ctx.createBiquadFilter();
  snapFilter.type = 'lowpass';
  snapFilter.frequency.value = 1000;
  
  const snapGain = ctx.createGain();
  snapGain.gain.setValueAtTime(0, time);
  snapGain.gain.linearRampToValueAtTime(0.6, time + 0.01);
  snapGain.gain.exponentialRampToValueAtTime(EPS, time + 0.08);
  
  snap.connect(snapFilter);
  snapFilter.connect(snapGain);
  snapGain.connect(dest);
  snap.start(time);
  snap.stop(time + 0.1);
  
  // The feather flutter
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
  flutterGain.gain.setValueAtTime(0, time + 0.02);
  flutterGain.gain.linearRampToValueAtTime(0.15, time + 0.05);
  flutterGain.gain.exponentialRampToValueAtTime(EPS, time + 0.25);
  
  // Apply LFO for tremolo (fluttering)
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 25; // 25 Hz flutter
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.8;
  lfo.connect(lfoGain);
  
  const tremolo = ctx.createGain();
  tremolo.gain.value = 1.0;
  lfoGain.connect(tremolo.gain);
  lfo.start(time);
  lfo.stop(time + 0.3);
  
  flutter.connect(flutterFilter);
  flutterFilter.connect(flutterGain);
  flutterGain.connect(tremolo);
  tremolo.connect(dest);
  flutter.start(time + 0.02);
}

function playBambooImpact(ctx, dest, time) {
  const bufSize = Math.floor(ctx.sampleRate * 0.15);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  for (let i = 0; i < bufSize; i++) buf.getChannelData(0)[i] = Math.random() * 2 - 1;
  
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  
  // Multiple tight bandpass filters for hollow wood resonance
  const freqs = [400, 1100, 1800];
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, time);
  masterGain.gain.linearRampToValueAtTime(0.8, time + 0.01);
  masterGain.gain.exponentialRampToValueAtTime(EPS, time + 0.15);
  masterGain.connect(dest);
  
  freqs.forEach(f => {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f;
    bp.Q.value = 5.0; // High resonance
    noise.connect(bp);
    bp.connect(masterGain);
  });
  
  noise.start(time);
}

function playMagicSuzu(ctx, dest, time) {
  // A burst of magic noise
  const bufSize = Math.floor(ctx.sampleRate * 0.4);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  for (let i = 0; i < bufSize; i++) buf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(2000, time);
  noiseFilter.frequency.exponentialRampToValueAtTime(800, time + 0.4);
  
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, time);
  noiseGain.gain.linearRampToValueAtTime(0.2, time + 0.1);
  noiseGain.gain.exponentialRampToValueAtTime(EPS, time + 0.4);
  
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(dest);
  noise.start(time);
  
  // Suzu bells (shimmering high-pitched sine chords)
  const bellFreqs = [3500, 4200, 4800, 5600, 6200];
  bellFreqs.forEach((f, idx) => {
    const delay = idx * 0.03;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, time + delay);
    g.gain.linearRampToValueAtTime(0.1, time + delay + 0.02);
    g.gain.exponentialRampToValueAtTime(EPS, time + delay + 0.25);
    
    osc.connect(g);
    g.connect(dest);
    osc.start(time + delay);
    osc.stop(time + delay + 0.3);
  });
}

function playHyoshigi(ctx, dest, time) {
  // Kabuki Wooden Clapper
  const osc = ctx.createOscillator();
  osc.type = 'square';
  // Fast descending pitch for the "clack"
  osc.frequency.setValueAtTime(2000, time);
  osc.frequency.exponentialRampToValueAtTime(500, time + 0.03);
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1500;
  filter.Q.value = 1.5;
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(1.0, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(EPS, time + 0.15);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.2);
}

function playEnemySpawn(ctx, dest, time) {
  // 1. Heavy War Drum (Taiko) Strike
  const drumOsc = ctx.createOscillator();
  drumOsc.type = 'sine';
  drumOsc.frequency.setValueAtTime(120, time);
  drumOsc.frequency.exponentialRampToValueAtTime(40, time + 0.4);
  
  const drumGain = ctx.createGain();
  drumGain.gain.setValueAtTime(0, time);
  drumGain.gain.linearRampToValueAtTime(1.2, time + 0.02);
  drumGain.gain.exponentialRampToValueAtTime(EPS, time + 0.8);
  
  drumOsc.connect(drumGain);
  drumGain.connect(dest);
  drumOsc.start(time);
  drumOsc.stop(time + 1.0);
  
  // Drum Noise (the skin of the drum)
  const noiseSize = Math.floor(ctx.sampleRate * 0.4);
  const noiseBuf = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
  for (let i = 0; i < noiseSize; i++) noiseBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const drumNoise = ctx.createBufferSource();
  drumNoise.buffer = noiseBuf;
  
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 400;
  noiseFilter.Q.value = 1.0;
  
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, time);
  noiseGain.gain.linearRampToValueAtTime(0.5, time + 0.02);
  noiseGain.gain.exponentialRampToValueAtTime(EPS, time + 0.5);
  
  drumNoise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(dest);
  drumNoise.start(time);

  // 2. Ominous Low Drone (Danger revealing)
  const drone = ctx.createOscillator();
  drone.type = 'sawtooth';
  drone.frequency.setValueAtTime(55, time); // Low A or G
  drone.frequency.linearRampToValueAtTime(52, time + 2.0); // Slight pitch bend down
  
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.setValueAtTime(100, time);
  droneFilter.frequency.linearRampToValueAtTime(300, time + 1.0); // Opens up slowly
  droneFilter.frequency.linearRampToValueAtTime(50, time + 2.5); // Closes
  
  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0, time);
  droneGain.gain.linearRampToValueAtTime(0.4, time + 0.8); // Swells up ominously
  droneGain.gain.exponentialRampToValueAtTime(EPS, time + 2.5);
  
  drone.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(dest);
  drone.start(time);
  drone.stop(time + 3.0);
  
  // 3. Subtle Armor / Movement Clatter
  [0.1, 0.3, 0.45, 0.7].forEach((delay) => {
    const clatterSize = Math.floor(ctx.sampleRate * 0.05);
    const clatterBuf = ctx.createBuffer(1, clatterSize, ctx.sampleRate);
    for (let i = 0; i < clatterSize; i++) clatterBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
    const clatter = ctx.createBufferSource();
    clatter.buffer = clatterBuf;
    
    const cFilter = ctx.createBiquadFilter();
    cFilter.type = 'highpass';
    cFilter.frequency.value = 3000;
    
    const cGain = ctx.createGain();
    cGain.gain.setValueAtTime(0, time + delay);
    cGain.gain.linearRampToValueAtTime(0.15, time + delay + 0.01);
    cGain.gain.exponentialRampToValueAtTime(EPS, time + delay + 0.08);
    
    clatter.connect(cFilter);
    cFilter.connect(cGain);
    cGain.connect(dest);
    clatter.start(time + delay);
  });
}

function playUnitDeath(ctx, dest, time) {
  // The fatal slice
  const sliceSize = Math.floor(ctx.sampleRate * 0.1);
  const sliceBuf = ctx.createBuffer(1, sliceSize, ctx.sampleRate);
  for (let i = 0; i < sliceSize; i++) sliceBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const slice = ctx.createBufferSource();
  slice.buffer = sliceBuf;
  
  const sliceFilter = ctx.createBiquadFilter();
  sliceFilter.type = 'highpass';
  sliceFilter.frequency.setValueAtTime(4000, time);
  sliceFilter.frequency.exponentialRampToValueAtTime(1000, time + 0.1);
  
  const sliceGain = ctx.createGain();
  sliceGain.gain.setValueAtTime(0, time);
  sliceGain.gain.linearRampToValueAtTime(0.8, time + 0.01);
  sliceGain.gain.exponentialRampToValueAtTime(EPS, time + 0.1);
  
  slice.connect(sliceFilter);
  sliceFilter.connect(sliceGain);
  sliceGain.connect(dest);
  slice.start(time);
  
  // The heavy fall (Thud)
  const fall = ctx.createOscillator();
  fall.type = 'sine';
  fall.frequency.setValueAtTime(100, time + 0.05);
  fall.frequency.exponentialRampToValueAtTime(30, time + 0.3);
  
  const fallGain = ctx.createGain();
  fallGain.gain.setValueAtTime(0, time + 0.05);
  fallGain.gain.linearRampToValueAtTime(1.0, time + 0.08);
  fallGain.gain.exponentialRampToValueAtTime(EPS, time + 0.3);
  
  fall.connect(fallGain);
  fallGain.connect(dest);
  fall.start(time + 0.05);
  fall.stop(time + 0.4);
  
  // The crumbling armor / death rattle
  const rattleSize = Math.floor(ctx.sampleRate * 0.4);
  const rattleBuf = ctx.createBuffer(1, rattleSize, ctx.sampleRate);
  for (let i = 0; i < rattleSize; i++) rattleBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const rattle = ctx.createBufferSource();
  rattle.buffer = rattleBuf;
  
  const rattleFilter = ctx.createBiquadFilter();
  rattleFilter.type = 'bandpass';
  rattleFilter.frequency.setValueAtTime(800, time + 0.05);
  rattleFilter.frequency.exponentialRampToValueAtTime(200, time + 0.4);
  
  const rattleGain = ctx.createGain();
  rattleGain.gain.setValueAtTime(0, time + 0.05);
  rattleGain.gain.linearRampToValueAtTime(0.5, time + 0.1);
  rattleGain.gain.exponentialRampToValueAtTime(EPS, time + 0.4);
  
  rattle.connect(rattleFilter);
  rattleFilter.connect(rattleGain);
  rattleGain.connect(dest);
  rattle.start(time + 0.05);
}

function playSiegeStrike(ctx, dest, time) {
  // Massive Concussive Boom
  const boom = ctx.createOscillator();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(120, time);
  boom.frequency.exponentialRampToValueAtTime(20, time + 0.8);
  
  const boomGain = ctx.createGain();
  boomGain.gain.setValueAtTime(0, time);
  boomGain.gain.linearRampToValueAtTime(1.5, time + 0.02); // Very loud
  boomGain.gain.exponentialRampToValueAtTime(EPS, time + 1.0);
  
  boom.connect(boomGain);
  boomGain.connect(dest);
  boom.start(time);
  boom.stop(time + 1.2);
  
  // Heavy Crushing Rocks (Long, low-pass noise)
  const crunchSize = Math.floor(ctx.sampleRate * 1.5);
  const crunchBuf = ctx.createBuffer(1, crunchSize, ctx.sampleRate);
  for (let i = 0; i < crunchSize; i++) crunchBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const crunch = ctx.createBufferSource();
  crunch.buffer = crunchBuf;
  
  const crunchFilter = ctx.createBiquadFilter();
  crunchFilter.type = 'lowpass';
  crunchFilter.frequency.setValueAtTime(1500, time);
  crunchFilter.frequency.exponentialRampToValueAtTime(150, time + 1.2);
  
  // WaveShaper for slight overdrive on the rock crushing
  const distNode = ctx.createWaveShaper();
  const curve = new Float32Array(400);
  for(let i = 0; i < 400; i++) {
    const x = i * 2 / 400 - 1;
    curve[i] = ( 3 + 10 ) * x * 20 * (Math.PI / 180) / ( Math.PI + 10 * Math.abs(x) );
  }
  distNode.curve = curve;
  
  const crunchGain = ctx.createGain();
  crunchGain.gain.setValueAtTime(0, time);
  crunchGain.gain.linearRampToValueAtTime(1.2, time + 0.05);
  // Volume wavers to sound like tumbling boulders
  crunchGain.gain.linearRampToValueAtTime(0.8, time + 0.3);
  crunchGain.gain.linearRampToValueAtTime(1.0, time + 0.5);
  crunchGain.gain.exponentialRampToValueAtTime(EPS, time + 1.5);
  
  crunch.connect(crunchFilter);
  crunchFilter.connect(distNode);
  distNode.connect(crunchGain);
  crunchGain.connect(dest);
  crunch.start(time);
}

function playBossPowerAttack(ctx, dest, time) {
  // 1. The Windup (Sucking in air/energy)
  const windupSize = Math.floor(ctx.sampleRate * 0.8);
  const windupBuf = ctx.createBuffer(1, windupSize, ctx.sampleRate);
  for (let i = 0; i < windupSize; i++) windupBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const windup = ctx.createBufferSource();
  windup.buffer = windupBuf;
  
  const wFilter = ctx.createBiquadFilter();
  wFilter.type = 'bandpass';
  wFilter.frequency.setValueAtTime(200, time);
  wFilter.frequency.exponentialRampToValueAtTime(3000, time + 0.8); // Sweeps UP
  
  const wGain = ctx.createGain();
  wGain.gain.setValueAtTime(EPS, time);
  wGain.gain.exponentialRampToValueAtTime(0.8, time + 0.8); // Volume swells up
  
  windup.connect(wFilter);
  wFilter.connect(wGain);
  wGain.connect(dest);
  windup.start(time);
  
  const impactTime = time + 0.8;
  
  // 2. The Devastating Impact
  const boom = ctx.createOscillator();
  boom.type = 'sawtooth'; // Harsh sawtooth for the boss
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
  
  // Distorted Explosion
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
  for(let i = 0; i < 400; i++) {
    const x = i * 2 / 400 - 1;
    curve[i] = ( 3 + 50 ) * x * 20 * (Math.PI / 180) / ( Math.PI + 50 * Math.abs(x) ); // Heavy distortion
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
  
  // 3. The Ringing Aftermath (Discordant bell)
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

function playSwiftBossAttack(ctx, dest, time) {
  // 1. The Swift Dash (Fast upwards whoosh)
  const dashSize = Math.floor(ctx.sampleRate * 0.3);
  const dashBuf = ctx.createBuffer(1, dashSize, ctx.sampleRate);
  for (let i = 0; i < dashSize; i++) dashBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const dash = ctx.createBufferSource();
  dash.buffer = dashBuf;
  
  const dFilter = ctx.createBiquadFilter();
  dFilter.type = 'bandpass';
  dFilter.frequency.setValueAtTime(500, time);
  dFilter.frequency.exponentialRampToValueAtTime(5000, time + 0.2); // Fast sweep up
  
  const dGain = ctx.createGain();
  dGain.gain.setValueAtTime(0, time);
  dGain.gain.linearRampToValueAtTime(0.8, time + 0.1);
  dGain.gain.exponentialRampToValueAtTime(EPS, time + 0.3);
  
  dash.connect(dFilter);
  dFilter.connect(dGain);
  dGain.connect(dest);
  dash.start(time);

  // 2. Multi-hit Flurry (3 fast slices)
  const flurryTime = time + 0.25;
  [0, 0.1, 0.2].forEach((delay) => {
    // Sharp noise burst
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
    
    // High metallic ringing sine
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

function playMiningBossAttack(ctx, dest, time) {
  // 1. Heavy Pickaxe Windup (Grinding Rocks)
  const grindSize = Math.floor(ctx.sampleRate * 0.8);
  const grindBuf = ctx.createBuffer(1, grindSize, ctx.sampleRate);
  for (let i = 0; i < grindSize; i++) grindBuf.getChannelData(0)[i] = Math.random() * 2 - 1;
  const grind = ctx.createBufferSource();
  grind.buffer = grindBuf;
  
  const gFilter = ctx.createBiquadFilter();
  gFilter.type = 'lowpass';
  gFilter.frequency.setValueAtTime(300, time);
  gFilter.frequency.linearRampToValueAtTime(800, time + 0.7);
  
  const gGain = ctx.createGain();
  gGain.gain.setValueAtTime(0, time);
  gGain.gain.linearRampToValueAtTime(0.6, time + 0.4);
  gGain.gain.exponentialRampToValueAtTime(EPS, time + 0.8);
  
  grind.connect(gFilter);
  gFilter.connect(gGain);
  gGain.connect(dest);
  grind.start(time);
  
  const impactTime = time + 0.7;

  // 2. The Strike (Metallic Clang + Earthquake)
  // Metallic Clang
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
  
  // Sub-Bass Earthquake
  const boom = ctx.createOscillator();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(80, impactTime);
  boom.frequency.exponentialRampToValueAtTime(10, impactTime + 1.5);
  
  const bGain = ctx.createGain();
  bGain.gain.setValueAtTime(0, impactTime);
  bGain.gain.linearRampToValueAtTime(2.0, impactTime + 0.05); // Huge impact
  bGain.gain.exponentialRampToValueAtTime(EPS, impactTime + 1.5);
  
  boom.connect(bGain);
  bGain.connect(dest);
  boom.start(impactTime);
  boom.stop(impactTime + 2.0);
  
  // Crumbling Earth Aftermath
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

export function SfxMock() {
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  
  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = 0.5; // Master volume
    gain.connect(ctx.destination);
    
    audioCtxRef.current = ctx;
    gainNodeRef.current = gain;
    
    return () => {
      ctx.close();
    };
  }, []);

  const play = (sfxFn) => {
    if (!audioCtxRef.current) return;
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    sfxFn(audioCtxRef.current, gainNodeRef.current, audioCtxRef.current.currentTime);
  };

  const buttonStyle = {
    padding: '10px 20px',
    margin: '10px',
    background: '#333',
    color: '#fff',
    border: '1px solid #666',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'monospace'
  };

  return (
    <div style={{ padding: '20px', color: '#fff', background: '#111', minHeight: '100vh', overflowY: 'auto', paddingBottom: '100px' }}>
      <h2>New SFX Mockup Lab</h2>
      <p>Click buttons to test the new, realistic Japanese-style synthesized sound effects.</p>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Realistic Thunder</h3>
        <button style={buttonStyle} onClick={() => play(playRealisticThunder)}>
          Thunder Strike
        </button>

        <h3>Units & Environment</h3>
        <button style={buttonStyle} onClick={() => play(playEnemySpawn)}>
          Enemy Spawn (Ominous War Drum)
        </button>
        <button style={buttonStyle} onClick={() => play(playUnitDeath)}>
          Unit Death (Fatal Blow)
        </button>
        <button style={buttonStyle} onClick={() => play(playSiegeStrike)}>
          Siege Strike (Boulders)
        </button>
        <button style={buttonStyle} onClick={() => play(playSwiftBossAttack)}>
          Swift Boss (Dash & Flurry)
        </button>
        <button style={buttonStyle} onClick={() => play(playMiningBossAttack)}>
          Mining Boss (Grind & Quake)
        </button>

        <h3>Melee Combat (Katana)</h3>
        <button style={buttonStyle} onClick={() => play(playKatanaSwing)}>
          Katana Swing (Air)
        </button>
        <button style={buttonStyle} onClick={() => play(playKatanaClash)}>
          Katana Clash (Metal Hit)
        </button>

        <h3>Archery & Impacts</h3>
        <button style={buttonStyle} onClick={() => play(playYumiRelease)}>
          Yumi Bow Release
        </button>
        <button style={buttonStyle} onClick={() => play(playBambooImpact)}>
          Bamboo/Wood Shield Block
        </button>

        <h3>Magic & Rituals</h3>
        <button style={buttonStyle} onClick={() => play(playMagicSuzu)}>
          Magic Cast (Suzu Bells)
        </button>
        <button style={buttonStyle} onClick={() => play(playHyoshigi)}>
          Hyoshigi (Kabuki Clapper)
        </button>
      </div>
    </div>
  );
}
