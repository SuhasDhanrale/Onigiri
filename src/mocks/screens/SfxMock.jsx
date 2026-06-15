import React, { useRef, useEffect } from 'react';

const EPS = 0.0001;

function playRealisticThunder(ctx, dest, time) {
  // The Initial Crack
  const crackSize = Math.floor(ctx.sampleRate * 0.2);
  const crackBuffer = ctx.createBuffer(1, crackSize, ctx.sampleRate);
  const crackData = crackBuffer.getChannelData(0);
  for (let i = 0; i < crackSize; i++) crackData[i] = Math.random() * 2 - 1;
  
  const crack = ctx.createBufferSource();
  crack.buffer = crackBuffer;
  const crackFilter = ctx.createBiquadFilter();
  crackFilter.type = 'highpass';
  crackFilter.frequency.value = 2000;
  
  const crackGain = ctx.createGain();
  crackGain.gain.setValueAtTime(0, time);
  crackGain.gain.linearRampToValueAtTime(0.8, time + 0.01);
  crackGain.gain.exponentialRampToValueAtTime(EPS, time + 0.2);
  
  crack.connect(crackFilter);
  crackFilter.connect(crackGain);
  crackGain.connect(dest);
  crack.start(time);
  
  // The Rumble
  const rumbleSize = Math.floor(ctx.sampleRate * 2.5);
  const rumbleBuffer = ctx.createBuffer(1, rumbleSize, ctx.sampleRate);
  const rumbleData = rumbleBuffer.getChannelData(0);
  for (let i = 0; i < rumbleSize; i++) rumbleData[i] = Math.random() * 2 - 1;
  
  const rumble = ctx.createBufferSource();
  rumble.buffer = rumbleBuffer;
  
  const rumbleFilter = ctx.createBiquadFilter();
  rumbleFilter.type = 'lowpass';
  rumbleFilter.frequency.setValueAtTime(400, time);
  rumbleFilter.frequency.exponentialRampToValueAtTime(80, time + 2.0);
  
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.setValueAtTime(0, time);
  rumbleGain.gain.linearRampToValueAtTime(0.6, time + 0.1);
  // Add some volume modulation for the rolling effect
  rumbleGain.gain.linearRampToValueAtTime(0.3, time + 0.4);
  rumbleGain.gain.linearRampToValueAtTime(0.5, time + 0.8);
  rumbleGain.gain.linearRampToValueAtTime(0.2, time + 1.2);
  rumbleGain.gain.exponentialRampToValueAtTime(EPS, time + 2.5);
  
  rumble.connect(rumbleFilter);
  rumbleFilter.connect(rumbleGain);
  rumbleGain.connect(dest);
  rumble.start(time);

  // Sub-bass thump
  const thump = ctx.createOscillator();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(60, time);
  thump.frequency.exponentialRampToValueAtTime(20, time + 1.0);
  
  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(0, time);
  thumpGain.gain.linearRampToValueAtTime(0.7, time + 0.05);
  thumpGain.gain.exponentialRampToValueAtTime(EPS, time + 1.0);
  
  thump.connect(thumpGain);
  thumpGain.connect(dest);
  thump.start(time);
  thump.stop(time + 1.0);
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
