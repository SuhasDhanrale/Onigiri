// Procedural Japanese-instrument music engine (Taiko / Koto / Shakuhachi).
// Ported from src/mocks/screens/MusicMock.jsx so SoundManager can drive the
// same 9 tracks in production. Every voice connects to a `dest` GainNode
// (SoundManager's musicGain) instead of ctx.destination directly.

const mtof = (note) => 440 * Math.pow(2, (note - 69) / 12);

function playTaiko(ctx, dest, time, intensity = 1) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100 * intensity, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.3);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.8 * intensity, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.5);

  const bufferSize = ctx.sampleRate * 0.1;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 1000;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.3 * intensity, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(dest);
  noise.start(time);
}

function playKoto(ctx, dest, time, note, duration = 0.5, volume = 0.5) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.value = mtof(note);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, time);
  filter.frequency.exponentialRampToValueAtTime(300, time + 0.3);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + duration);
}

function playShakuhachi(ctx, dest, time, note, duration, volume = 0.4) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = mtof(note);

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 5; // 5Hz vibrato
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 10; // pitch variation amount
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  lfo.start(time);
  lfo.stop(time + duration + 1);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.2); // attack
  gain.gain.setValueAtTime(volume, time + duration - 0.4); // sustain
  gain.gain.linearRampToValueAtTime(0.001, time + duration); // release

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + duration + 0.1);
}

// --- Track compositions (1:1 port of MusicMock.jsx) ---

export const MUSIC_TRACKS = {
  ambient: {
    title: 'TRACK 1: Ambient Menu',
    bpm: 60,
    bars: 8,
    compose: (ctx, dest, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;
        if (bar % 4 === 0) playShakuhachi(ctx, dest, barTime, 57, beatLen * 4);
        else if (bar % 4 === 1) playShakuhachi(ctx, dest, barTime, 60, beatLen * 4);
        else if (bar % 4 === 2) playShakuhachi(ctx, dest, barTime, 64, beatLen * 4);
        else if (bar % 4 === 3) playShakuhachi(ctx, dest, barTime, 65, beatLen * 4);
        playKoto(ctx, dest, barTime, 69, 1.0, 0.3);
        playKoto(ctx, dest, barTime + beatLen * 2.5, 72, 1.0, 0.3);
        if (bar % 2 === 1) playKoto(ctx, dest, barTime + beatLen * 3.5, 76, 1.0, 0.3);
        if (bar % 2 === 0) playTaiko(ctx, dest, barTime, 0.5);
      }
    }
  },
  battle: {
    title: 'TRACK 2: Battle March',
    bpm: 120,
    bars: 16,
    compose: (ctx, dest, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;
        playTaiko(ctx, dest, barTime, 1.0);
        playTaiko(ctx, dest, barTime + beatLen * 1.5, 0.6);
        playTaiko(ctx, dest, barTime + beatLen * 2, 0.8);
        playTaiko(ctx, dest, barTime + beatLen * 3.5, 0.7);
        const notes = [45, 45, 48, 45, 52, 48, 47, 45];
        for (let i = 0; i < 8; i++) playKoto(ctx, dest, barTime + (i * 0.5) * beatLen, notes[i], 0.3, 0.6);
        if (bar >= 4) {
          if (bar % 4 === 0) playShakuhachi(ctx, dest, barTime, 69, beatLen * 2);
          if (bar % 4 === 0) playShakuhachi(ctx, dest, barTime + beatLen * 2, 72, beatLen * 2);
          if (bar % 4 === 1) playShakuhachi(ctx, dest, barTime, 76, beatLen * 4);
        }
      }
    }
  },
  boss: {
    title: 'TRACK 3: Boss Encounter',
    bpm: 90,
    bars: 16,
    compose: (ctx, dest, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;
        playTaiko(ctx, dest, barTime, 1.5);
        playTaiko(ctx, dest, barTime + beatLen * 2.75, 1.2);
        playTaiko(ctx, dest, barTime + beatLen * 3.5, 1.0);
        playKoto(ctx, dest, barTime, 33, 2.0, 0.8);
        playKoto(ctx, dest, barTime + beatLen * 2, 34, 1.0, 0.8);
        if (bar % 2 === 1) {
          playKoto(ctx, dest, barTime + beatLen * 2, 77, 0.2, 0.5);
          playKoto(ctx, dest, barTime + beatLen * 2.25, 76, 0.2, 0.5);
          playKoto(ctx, dest, barTime + beatLen * 2.5, 72, 0.2, 0.5);
          playKoto(ctx, dest, barTime + beatLen * 2.75, 69, 0.2, 0.5);
        }
        if (bar % 4 === 2) playShakuhachi(ctx, dest, barTime, 65, beatLen * 4, 0.6);
        if (bar % 4 === 3) playShakuhachi(ctx, dest, barTime, 64, beatLen * 4, 0.6);
      }
    }
  },
  charge: {
    title: 'TRACK 4: Cavalry Charge (Aggressive)',
    bpm: 160,
    bars: 16,
    compose: (ctx, dest, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;

        playTaiko(ctx, dest, barTime, 1.2); // 1
        playTaiko(ctx, dest, barTime + beatLen * 1.5, 0.6); // 2&
        playTaiko(ctx, dest, barTime + beatLen * 2, 1.0); // 3
        playTaiko(ctx, dest, barTime + beatLen * 2.75, 0.8); // 3e
        playTaiko(ctx, dest, barTime + beatLen * 3.5, 0.9); // 4&

        // E minor pentatonic: E G A B D (E2=40, G2=43, A2=45, B2=47, D3=50)
        const notes = [40, 40, 47, 40, 40, 43, 45, 40];
        for (let i = 0; i < 8; i++) {
          playKoto(ctx, dest, barTime + (i * 0.5) * beatLen, notes[i], 0.2, 0.8);
        }

        if (bar % 2 === 1) {
          playShakuhachi(ctx, dest, barTime + beatLen * 1.5, 76, beatLen * 0.5, 0.8); // E5
          playShakuhachi(ctx, dest, barTime + beatLen * 2.5, 79, beatLen * 0.5, 0.8); // G5
        }
      }
    }
  },
  rage: {
    title: "TRACK 5: Oni's Rage (Heavy Metal Taiko)",
    bpm: 140,
    bars: 16,
    compose: (ctx, dest, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;

        playTaiko(ctx, dest, barTime, 1.5);
        playTaiko(ctx, dest, barTime + beatLen * 0.75, 0.8);
        playTaiko(ctx, dest, barTime + beatLen * 1, 1.5);
        playTaiko(ctx, dest, barTime + beatLen * 2, 1.5);
        playTaiko(ctx, dest, barTime + beatLen * 2.75, 0.8);
        playTaiko(ctx, dest, barTime + beatLen * 3, 1.5);

        for (let i = 0; i < 4; i++) {
          playKoto(ctx, dest, barTime + i * beatLen, 28, 0.5, 1.0); // Heavy E1 punch
        }

        if (bar % 4 === 3) {
          playKoto(ctx, dest, barTime + beatLen * 2.0, 76, 0.2, 0.6); // E5
          playKoto(ctx, dest, barTime + beatLen * 2.5, 71, 0.2, 0.6); // B4
          playKoto(ctx, dest, barTime + beatLen * 3.0, 67, 0.2, 0.6); // G4
          playKoto(ctx, dest, barTime + beatLen * 3.5, 64, 0.2, 0.6); // E4
        }
      }
    }
  },
  victory: {
    title: 'TRACK 6: Heroic Strike (Upbeat)',
    bpm: 150,
    bars: 16,
    compose: (ctx, dest, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;

        playTaiko(ctx, dest, barTime, 1.0);
        playTaiko(ctx, dest, barTime + beatLen * 1, 0.6);
        playTaiko(ctx, dest, barTime + beatLen * 2, 1.0);
        playTaiko(ctx, dest, barTime + beatLen * 3, 0.6);
        playTaiko(ctx, dest, barTime + beatLen * 3.5, 0.8);

        // A Major pentatonic: A2=45, C#3=49, E3=52, F#3=54, A3=57
        const bassNotes = [45, 52, 45, 54, 45, 52, 49, 45];
        for (let i = 0; i < 8; i++) {
          playKoto(ctx, dest, barTime + (i * 0.5) * beatLen, bassNotes[i], 0.3, 0.6);
        }

        if (bar % 4 === 0) playShakuhachi(ctx, dest, barTime, 69, beatLen * 2, 0.6); // A4
        if (bar % 4 === 0) playShakuhachi(ctx, dest, barTime + beatLen * 2, 73, beatLen * 1.5, 0.6); // C#5
        if (bar % 4 === 1) playShakuhachi(ctx, dest, barTime, 76, beatLen * 4, 0.6); // E5
        if (bar % 4 === 2) playShakuhachi(ctx, dest, barTime, 78, beatLen * 2, 0.6); // F#5
        if (bar % 4 === 2) playShakuhachi(ctx, dest, barTime + beatLen * 2, 76, beatLen * 1.5, 0.6); // E5
        if (bar % 4 === 3) playShakuhachi(ctx, dest, barTime, 69, beatLen * 4, 0.6); // A4
      }
    }
  },
  slowRage: {
    title: "TRACK 7: Warlord's Approach (30 BPM Heavy)",
    bpm: 30,
    bars: 8,
    compose: (ctx, dest, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;
        playTaiko(ctx, dest, barTime, 2.0);
        playTaiko(ctx, dest, barTime + beatLen * 2, 1.0);
        playTaiko(ctx, dest, barTime + beatLen * 3.5, 0.5);

        playKoto(ctx, dest, barTime, 40, 1.5, 1.0);
        playKoto(ctx, dest, barTime, 47, 1.5, 1.0);

        playKoto(ctx, dest, barTime + beatLen * 2, 41, 1.0, 1.0);
        playKoto(ctx, dest, barTime + beatLen * 2, 48, 1.0, 1.0);
      }
    }
  },
  steadyMarch: {
    title: 'TRACK 8: Steady Advance (Enhanced Harmony & Melody)',
    bpm: 60,
    bars: 16,
    compose: (ctx, dest, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;

        playTaiko(ctx, dest, barTime, 1.2);
        playTaiko(ctx, dest, barTime + beatLen * 1, 1.0);
        playTaiko(ctx, dest, barTime + beatLen * 2, 1.2);

        if (bar % 4 === 3) {
          playTaiko(ctx, dest, barTime + beatLen * 3.0, 0.8);
          playTaiko(ctx, dest, barTime + beatLen * 3.5, 1.0);
          playTaiko(ctx, dest, barTime + beatLen * 3.75, 1.2);
        } else {
          playTaiko(ctx, dest, barTime + beatLen * 3, 1.0);
        }

        if (bar % 2 === 0) {
          playShakuhachi(ctx, dest, barTime, 40, beatLen * 8, 0.2); // Low E2 drone
        }

        for (let i = 0; i < 16; i++) {
          const time = barTime + (i * 0.25) * beatLen;
          if (i % 4 === 0) {
            // Power chord on the downbeat: E2, B2, E3
            playKoto(ctx, dest, time, 40, 0.3, 0.5);
            playKoto(ctx, dest, time, 47, 0.3, 0.4);
            playKoto(ctx, dest, time, 52, 0.3, 0.5);
          } else {
            playKoto(ctx, dest, time, 40, 0.1, 0.3);
          }
        }

        if (bar >= 8) {
          if (bar % 4 === 0) playShakuhachi(ctx, dest, barTime, 64, beatLen * 2, 0.5); // E4
          if (bar % 4 === 0) playShakuhachi(ctx, dest, barTime + beatLen * 2, 67, beatLen * 2, 0.5); // G4
          if (bar % 4 === 1) playShakuhachi(ctx, dest, barTime, 71, beatLen * 4, 0.5); // B4
          if (bar % 4 === 2) playShakuhachi(ctx, dest, barTime, 76, beatLen * 3, 0.5); // E5
          if (bar % 4 === 2) playShakuhachi(ctx, dest, barTime + beatLen * 3, 74, beatLen * 1, 0.5); // D5
          if (bar % 4 === 3) {
            if (bar === 15) {
              playShakuhachi(ctx, dest, barTime, 64, beatLen * 4, 0.5);
              playTaiko(ctx, dest, barTime + beatLen * 2, 1.5);
              playTaiko(ctx, dest, barTime + beatLen * 3, 1.8);
              playTaiko(ctx, dest, barTime + beatLen * 3.5, 2.0);
              playTaiko(ctx, dest, barTime + beatLen * 3.75, 2.5);
            } else {
              playShakuhachi(ctx, dest, barTime, 71, beatLen * 4, 0.5); // B4
            }
          }
        }
      }
    }
  },
  warBackground: {
    title: 'TRACK 9: Distant Battlefield (War Background)',
    bpm: 80,
    bars: 16,
    compose: (ctx, dest, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;

        playTaiko(ctx, dest, barTime, 1.5);
        if (bar % 2 === 0) {
          playTaiko(ctx, dest, barTime + beatLen * 2.5, 0.6);
          playTaiko(ctx, dest, barTime + beatLen * 3, 0.8);
        } else {
          playTaiko(ctx, dest, barTime + beatLen * 2, 1.0);
          playTaiko(ctx, dest, barTime + beatLen * 3.75, 1.2);
        }

        // Miyako-bushi scale: E3=52, F3=53, A3=57, B3=59
        const tenseNotes = [52, 53, 57, 53, 52, 59, 57, 53];
        for (let i = 0; i < 8; i++) {
          playKoto(ctx, dest, barTime + (i * 0.5) * beatLen, tenseNotes[i], 0.2, 0.4);
        }

        playKoto(ctx, dest, barTime, 40, 2.0, 0.7); // E2

        if (bar >= 4) {
          if (bar % 4 === 0) {
            playShakuhachi(ctx, dest, barTime, 64, beatLen * 2.5, 0.5); // E4
            playShakuhachi(ctx, dest, barTime + beatLen * 3, 65, beatLen * 1, 0.5); // F4
          } else if (bar % 4 === 1) {
            playShakuhachi(ctx, dest, barTime, 69, beatLen * 2, 0.6); // A4
            playShakuhachi(ctx, dest, barTime + beatLen * 2, 71, beatLen * 2, 0.6); // B4
          } else if (bar % 4 === 2) {
            playShakuhachi(ctx, dest, barTime, 72, beatLen * 3, 0.7); // C5
            playShakuhachi(ctx, dest, barTime + beatLen * 3, 71, beatLen * 1, 0.6); // B4
          } else if (bar % 4 === 3) {
            playShakuhachi(ctx, dest, barTime, 64, beatLen * 4, 0.4);
          }
        }
      }
    }
  }
};

// In-game music roles → tracks (per doc/AUDIO_SFX_PLAN.md)
export const MUSIC_SLOTS = {
  menu: 'slowRage',             // Track 7 — Warlord's Approach (outer menu / map)
  battle: 'steadyMarch',        // Track 8 — Steady Advance (normal wave battles)
  chapterBoss: 'warBackground', // Track 9 — Distant Battlefield (chapter boss fight)
};

/**
 * Starts a looping (or one-shot) scheduler for a track, scheduling each
 * loop iteration ahead of time via setTimeout (same pattern as MusicMock).
 * @returns {{ stop(): void }}
 */
export function startTrackLoop(ctx, dest, track, { loop = true, startDelay = 0.05 } = {}) {
  const beatLen = 60 / track.bpm;
  const loopDuration = track.bars * 4 * beatLen;
  let nextLoopTime = ctx.currentTime + startDelay;
  let stopped = false;
  let timeoutId = null;
  // Every iteration gets its own gain node so `stop()` can silence its notes —
  // individual oscillators/buffer sources are scheduled `loopDuration` seconds
  // ahead and can't be cancelled once started. While the AudioContext is still
  // suspended (autoplay policy), ctx.currentTime stays ~0 so the setTimeout-based
  // lookahead below can fire repeatedly before the user's first gesture, queuing
  // up several iterations at once. The iteration that ends up audible once the
  // context resumes may not be the most recent one, so stop() must silence ALL
  // gain nodes ever created for this track, not just the latest.
  const gains = [];

  const scheduleLoop = () => {
    if (stopped) return;
    const gain = ctx.createGain();
    gain.connect(dest);
    gains.push(gain);
    track.compose(ctx, gain, nextLoopTime, beatLen, track.bars);
    nextLoopTime += loopDuration;
    if (!loop) return;
    const wakeupMs = Math.max(0, (nextLoopTime - ctx.currentTime - 0.5) * 1000);
    timeoutId = setTimeout(scheduleLoop, wakeupMs);
  };
  scheduleLoop();

  return {
    stop() {
      stopped = true;
      if (timeoutId) clearTimeout(timeoutId);
      const now = ctx.currentTime;
      for (const gain of gains) {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
      }
      setTimeout(() => {
        for (const gain of gains) gain.disconnect();
      }, 100);
    },
    loopDuration,
  };
}
