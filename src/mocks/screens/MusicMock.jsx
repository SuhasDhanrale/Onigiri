import React, { useState, useEffect, useRef } from 'react';
import { COLORS } from '../../config/colors.js';

// --- SYNTHESIZER ENGINE ---

const mtof = (note) => 440 * Math.pow(2, (note - 69) / 12);

const playTaiko = (ctx, time, intensity = 1) => {
  // Body (Low pitch drop)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100 * intensity, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.3);
  
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.8 * intensity, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.5);

  // Hit noise (Snare/rim effect)
  const bufferSize = ctx.sampleRate * 0.1; 
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
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
  noiseGain.connect(ctx.destination);
  noise.start(time);
};

const playKoto = (ctx, time, note, duration = 0.5, volume = 0.5) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  // Plucked string characteristic: Triangle wave with lowpass filter that closes quickly
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
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + duration);
};

const playShakuhachi = (ctx, time, note, duration, volume = 0.4) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.value = mtof(note);
  
  // Vibrato LFO
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 5; // 5Hz vibrato
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 10; // pitch variation amount
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  lfo.start(time);
  lfo.stop(time + duration + 1);

  // Slow attack, slow release (Breath effect)
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.2); // attack
  gain.gain.setValueAtTime(volume, time + duration - 0.4); // sustain
  gain.gain.linearRampToValueAtTime(0.001, time + duration); // release
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + duration + 0.1);
};

// --- COMPOSITIONS ---

const tracks = {
  ambient: {
    title: 'TRACK 1: Ambient Menu',
    bpm: 60,
    bars: 8,
    compose: (ctx, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;
        if (bar % 4 === 0) playShakuhachi(ctx, barTime, 57, beatLen * 4);
        else if (bar % 4 === 1) playShakuhachi(ctx, barTime, 60, beatLen * 4);
        else if (bar % 4 === 2) playShakuhachi(ctx, barTime, 64, beatLen * 4);
        else if (bar % 4 === 3) playShakuhachi(ctx, barTime, 65, beatLen * 4);
        playKoto(ctx, barTime, 69, 1.0, 0.3);
        playKoto(ctx, barTime + beatLen * 2.5, 72, 1.0, 0.3);
        if (bar % 2 === 1) playKoto(ctx, barTime + beatLen * 3.5, 76, 1.0, 0.3);
        if (bar % 2 === 0) playTaiko(ctx, barTime, 0.5);
      }
    }
  },
  battle: {
    title: 'TRACK 2: Battle March',
    bpm: 120,
    bars: 16,
    compose: (ctx, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;
        playTaiko(ctx, barTime, 1.0);
        playTaiko(ctx, barTime + beatLen * 1.5, 0.6);
        playTaiko(ctx, barTime + beatLen * 2, 0.8);
        playTaiko(ctx, barTime + beatLen * 3.5, 0.7);
        const notes = [45, 45, 48, 45, 52, 48, 47, 45];
        for (let i = 0; i < 8; i++) playKoto(ctx, barTime + (i * 0.5) * beatLen, notes[i], 0.3, 0.6);
        if (bar >= 4) {
          if (bar % 4 === 0) playShakuhachi(ctx, barTime, 69, beatLen * 2);
          if (bar % 4 === 0) playShakuhachi(ctx, barTime + beatLen * 2, 72, beatLen * 2);
          if (bar % 4 === 1) playShakuhachi(ctx, barTime, 76, beatLen * 4);
        }
      }
    }
  },
  boss: {
    title: 'TRACK 3: Boss Encounter',
    bpm: 90,
    bars: 16,
    compose: (ctx, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;
        playTaiko(ctx, barTime, 1.5); 
        playTaiko(ctx, barTime + beatLen * 2.75, 1.2); 
        playTaiko(ctx, barTime + beatLen * 3.5, 1.0);
        playKoto(ctx, barTime, 33, 2.0, 0.8);
        playKoto(ctx, barTime + beatLen * 2, 34, 1.0, 0.8);
        if (bar % 2 === 1) {
          playKoto(ctx, barTime + beatLen * 2, 77, 0.2, 0.5);
          playKoto(ctx, barTime + beatLen * 2.25, 76, 0.2, 0.5);
          playKoto(ctx, barTime + beatLen * 2.5, 72, 0.2, 0.5);
          playKoto(ctx, barTime + beatLen * 2.75, 69, 0.2, 0.5);
        }
        if (bar % 4 === 2) playShakuhachi(ctx, barTime, 65, beatLen * 4, 0.6);
        if (bar % 4 === 3) playShakuhachi(ctx, barTime, 64, beatLen * 4, 0.6);
      }
    }
  },
  charge: {
    title: 'TRACK 4: Cavalry Charge (Aggressive)',
    bpm: 160,
    bars: 16,
    compose: (ctx, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;
        
        // Fast galloping taiko beat
        playTaiko(ctx, barTime, 1.2); // 1
        playTaiko(ctx, barTime + beatLen * 1.5, 0.6); // 2&
        playTaiko(ctx, barTime + beatLen * 2, 1.0); // 3
        playTaiko(ctx, barTime + beatLen * 2.75, 0.8); // 3e
        playTaiko(ctx, barTime + beatLen * 3.5, 0.9); // 4&

        // Driving Power Chords (E minor pentatonic: E G A B D)
        // E2=40, G2=43, A2=45, B2=47, D3=50
        const notes = [40, 40, 47, 40, 40, 43, 45, 40];
        for (let i = 0; i < 8; i++) {
          playKoto(ctx, barTime + (i * 0.5) * beatLen, notes[i], 0.2, 0.8);
        }

        // Staccato aggressive flute blasts on the off-beats
        if (bar % 2 === 1) {
          playShakuhachi(ctx, barTime + beatLen * 1.5, 76, beatLen * 0.5, 0.8); // E5
          playShakuhachi(ctx, barTime + beatLen * 2.5, 79, beatLen * 0.5, 0.8); // G5
        }
      }
    }
  },
  rage: {
    title: "TRACK 5: Oni's Rage (Heavy Metal Taiko)",
    bpm: 140,
    bars: 16,
    compose: (ctx, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;
        
        // Relentless 4-on-the-floor heavy stomps + double kicks
        playTaiko(ctx, barTime, 1.5);
        playTaiko(ctx, barTime + beatLen * 0.75, 0.8);
        playTaiko(ctx, barTime + beatLen * 1, 1.5);
        playTaiko(ctx, barTime + beatLen * 2, 1.5);
        playTaiko(ctx, barTime + beatLen * 2.75, 0.8);
        playTaiko(ctx, barTime + beatLen * 3, 1.5);

        // Low, crunchy repetitive riff
        // E1=28, F1=29 (power/dissonance, but fast and heavy)
        for (let i = 0; i < 4; i++) {
          playKoto(ctx, barTime + i * beatLen, 28, 0.5, 1.0); // Heavy E1 punch
        }
        
        // Fast descending Koto run at the end of every 4th bar
        if (bar % 4 === 3) {
          playKoto(ctx, barTime + beatLen * 2.0, 76, 0.2, 0.6); // E5
          playKoto(ctx, barTime + beatLen * 2.5, 71, 0.2, 0.6); // B4
          playKoto(ctx, barTime + beatLen * 3.0, 67, 0.2, 0.6); // G4
          playKoto(ctx, barTime + beatLen * 3.5, 64, 0.2, 0.6); // E4
        }
      }
    }
  },
  victory: {
    title: 'TRACK 6: Heroic Strike (Upbeat)',
    bpm: 150,
    bars: 16,
    compose: (ctx, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;
        
        // Driving, upbeat rhythm
        playTaiko(ctx, barTime, 1.0);
        playTaiko(ctx, barTime + beatLen * 1, 0.6);
        playTaiko(ctx, barTime + beatLen * 2, 1.0);
        playTaiko(ctx, barTime + beatLen * 3, 0.6);
        playTaiko(ctx, barTime + beatLen * 3.5, 0.8);
        
        // Major pentatonic feel (A Major: A, B, C#, E, F#)
        // A2=45, C#3=49, E3=52, F#3=54, A3=57
        const bassNotes = [45, 52, 45, 54, 45, 52, 49, 45];
        for (let i = 0; i < 8; i++) {
          playKoto(ctx, barTime + (i * 0.5) * beatLen, bassNotes[i], 0.3, 0.6);
        }

        // Heroic flute melody
        if (bar % 4 === 0) playShakuhachi(ctx, barTime, 69, beatLen * 2, 0.6); // A4
        if (bar % 4 === 0) playShakuhachi(ctx, barTime + beatLen * 2, 73, beatLen * 1.5, 0.6); // C#5
        if (bar % 4 === 1) playShakuhachi(ctx, barTime, 76, beatLen * 4, 0.6); // E5
        if (bar % 4 === 2) playShakuhachi(ctx, barTime, 78, beatLen * 2, 0.6); // F#5
        if (bar % 4 === 2) playShakuhachi(ctx, barTime + beatLen * 2, 76, beatLen * 1.5, 0.6); // E5
        if (bar % 4 === 3) playShakuhachi(ctx, barTime, 69, beatLen * 4, 0.6); // A4
      }
    }
  },
  slowRage: {
    title: "TRACK 7: Warlord's Approach (30 BPM Heavy)",
    bpm: 30,
    bars: 8,
    compose: (ctx, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;
        playTaiko(ctx, barTime, 2.0);
        playTaiko(ctx, barTime + beatLen * 2, 1.0);
        playTaiko(ctx, barTime + beatLen * 3.5, 0.5);
        
        playKoto(ctx, barTime, 40, 1.5, 1.0);
        playKoto(ctx, barTime, 47, 1.5, 1.0);
        
        playKoto(ctx, barTime + beatLen * 2, 41, 1.0, 1.0);
        playKoto(ctx, barTime + beatLen * 2, 48, 1.0, 1.0);
      }
    }
  },
  steadyMarch: {
    title: "TRACK 8: Steady Advance (Enhanced Harmony & Melody)",
    bpm: 60,
    bars: 16,
    compose: (ctx, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;
        
        // HORIZONTAL ADDITION: Drum variations
        playTaiko(ctx, barTime, 1.2);
        playTaiko(ctx, barTime + beatLen * 1, 1.0);
        playTaiko(ctx, barTime + beatLen * 2, 1.2);
        
        if (bar % 4 === 3) {
          // Drum fill at the end of a phrase
          playTaiko(ctx, barTime + beatLen * 3.0, 0.8);
          playTaiko(ctx, barTime + beatLen * 3.5, 1.0);
          playTaiko(ctx, barTime + beatLen * 3.75, 1.2);
        } else {
          playTaiko(ctx, barTime + beatLen * 3, 1.0);
        }

        // VERTICAL ADDITION: Low drone pad holding the root note to thicken the sound
        if (bar % 2 === 0) {
           playShakuhachi(ctx, barTime, 40, beatLen * 8, 0.2); // Low E2 drone
        }
        
        // VERTICAL ADDITION: Koto playing chords instead of single notes
        for (let i = 0; i < 16; i++) {
          const time = barTime + (i * 0.25) * beatLen;
          if (i % 4 === 0) {
            // Power chord on the downbeat: E2, B2, E3
            playKoto(ctx, time, 40, 0.3, 0.5);
            playKoto(ctx, time, 47, 0.3, 0.4);
            playKoto(ctx, time, 52, 0.3, 0.5);
          } else {
            playKoto(ctx, time, 40, 0.1, 0.3);
          }
        }

        // HORIZONTAL ADDITION: A soaring B-Section melody that enters halfway through
        if (bar >= 8) {
          if (bar % 4 === 0) playShakuhachi(ctx, barTime, 64, beatLen * 2, 0.5); // E4
          if (bar % 4 === 0) playShakuhachi(ctx, barTime + beatLen * 2, 67, beatLen * 2, 0.5); // G4
          if (bar % 4 === 1) playShakuhachi(ctx, barTime, 71, beatLen * 4, 0.5); // B4
          if (bar % 4 === 2) playShakuhachi(ctx, barTime, 76, beatLen * 3, 0.5); // E5
          if (bar % 4 === 2) playShakuhachi(ctx, barTime + beatLen * 3, 74, beatLen * 1, 0.5); // D5
          if (bar % 4 === 3) {
            if (bar === 15) {
              // RESOLUTION: Resolve the melody to the root note (E4) and add a massive drum fill to restart the loop seamlessly
              playShakuhachi(ctx, barTime, 64, beatLen * 4, 0.5); 
              playTaiko(ctx, barTime + beatLen * 2, 1.5);
              playTaiko(ctx, barTime + beatLen * 3, 1.8);
              playTaiko(ctx, barTime + beatLen * 3.5, 2.0);
              playTaiko(ctx, barTime + beatLen * 3.75, 2.5);
            } else {
              playShakuhachi(ctx, barTime, 71, beatLen * 4, 0.5); // B4
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
    compose: (ctx, t0, beatLen, bars) => {
      for (let bar = 0; bar < bars; bar++) {
        const barTime = t0 + bar * 4 * beatLen;
        
        // Deep menacing taiko heartbeat (echoing war drums)
        playTaiko(ctx, barTime, 1.5);
        if (bar % 2 === 0) {
          playTaiko(ctx, barTime + beatLen * 2.5, 0.6);
          playTaiko(ctx, barTime + beatLen * 3, 0.8);
        } else {
          playTaiko(ctx, barTime + beatLen * 2, 1.0);
          playTaiko(ctx, barTime + beatLen * 3.75, 1.2);
        }

        // Koto creating a tense, creeping atmosphere using traditional Miyako-bushi scale
        // E3=52, F3=53, A3=57, B3=59
        const tenseNotes = [52, 53, 57, 53, 52, 59, 57, 53];
        for (let i = 0; i < 8; i++) {
          playKoto(ctx, barTime + (i * 0.5) * beatLen, tenseNotes[i], 0.2, 0.4);
        }

        // Heavy Bass Koto drop on every downbeat for scale
        playKoto(ctx, barTime, 40, 2.0, 0.7); // E2

        // Shakuhachi melody enters on bar 4, weaving a melancholic war cry
        if (bar >= 4) {
          if (bar % 4 === 0) {
            playShakuhachi(ctx, barTime, 64, beatLen * 2.5, 0.5); // E4
            playShakuhachi(ctx, barTime + beatLen * 3, 65, beatLen * 1, 0.5); // F4
          } else if (bar % 4 === 1) {
            playShakuhachi(ctx, barTime, 69, beatLen * 2, 0.6); // A4
            playShakuhachi(ctx, barTime + beatLen * 2, 71, beatLen * 2, 0.6); // B4
          } else if (bar % 4 === 2) {
            playShakuhachi(ctx, barTime, 72, beatLen * 3, 0.7); // C5 - Peak tension
            playShakuhachi(ctx, barTime + beatLen * 3, 71, beatLen * 1, 0.6); // B4
          } else if (bar % 4 === 3) {
            // Long resolution back to E4
            playShakuhachi(ctx, barTime, 64, beatLen * 4, 0.4);
          }
        }
      }
    }
  }
};

export const MusicMock = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState('ambient');
  const [progress, setProgress] = useState(0);
  
  const ctxRef = useRef(null);
  const animRef = useRef(null);
  const schedulerRef = useRef(null);
  const startTimeRef = useRef(0);
  const durationRef = useRef(0);

  const stopMusic = () => {
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (schedulerRef.current) clearTimeout(schedulerRef.current);
    setIsPlaying(false);
    setProgress(0);
  };

  const playMusic = (trackId) => {
    stopMusic(); 
    
    const track = tracks[trackId];
    setActiveTrack(trackId);
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    
    const beatLen = 60 / track.bpm;
    const loopDuration = track.bars * 4 * beatLen;
    durationRef.current = loopDuration; 
    
    let nextLoopTime = ctx.currentTime + 0.1; 

    const scheduleLoop = () => {
      if (!ctxRef.current) return;
      
      track.compose(ctx, nextLoopTime, beatLen, track.bars);
      nextLoopTime += loopDuration;
      
      const timeUntilNextWakeup = (nextLoopTime - ctx.currentTime - 0.5) * 1000;
      schedulerRef.current = setTimeout(scheduleLoop, timeUntilNextWakeup);
    };

    scheduleLoop();
    
    startTimeRef.current = performance.now() + 100;
    setIsPlaying(true);
    
    const updateProgress = () => {
      if (!ctxRef.current) return;
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const currentLoopElapsed = elapsed % loopDuration;
      setProgress((currentLoopElapsed / loopDuration) * 100);
      animRef.current = requestAnimationFrame(updateProgress);
    };
    animRef.current = requestAnimationFrame(updateProgress);
  };

  // Cleanup on unmount
  useEffect(() => {
    return stopMusic;
  }, []);

  return (
    <div className="w-full h-full bg-[#1b1918] p-8 flex flex-col items-center justify-center font-sans text-white">
      <div className="bg-[#2c2a29] p-8 rounded-xl shadow-2xl border-2 border-[#5c4a3d] max-w-lg w-full">
        
        <h1 className="text-3xl font-black text-[#dfd4ba] mb-2 text-center tracking-widest">AUDIO ENGINE</h1>
        <p className="text-white/50 text-sm text-center mb-8">
          Procedural Web Audio API Synthesis. No MP3s loaded.
          Real-time generation of Taiko, Koto, and Shakuhachi.
        </p>

        <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto pr-2">
          {Object.entries(tracks).map(([id, track]) => (
            <button
              key={id}
              onClick={() => playMusic(id)}
              className={`w-full text-left p-4 rounded-lg flex items-center justify-between border-2 transition-all ${
                isPlaying && activeTrack === id 
                  ? 'bg-[#b84235]/20 border-[#b84235] shadow-[0_0_15px_rgba(184,66,53,0.5)]' 
                  : 'bg-black/20 border-transparent hover:border-white/20'
              }`}
            >
              <div>
                <div className="font-bold text-lg text-[#dfd4ba]">{track.title}</div>
                <div className="text-white/40 text-xs mt-1">Tempo: {track.bpm} BPM | Generated Instruments: Taiko, Koto, Shakuhachi</div>
              </div>
              
              {isPlaying && activeTrack === id ? (
                <div className="flex gap-1 items-center h-6">
                  {/* Fake visualizer bars */}
                  <div className="w-2 bg-[#b84235] h-full animate-[bounce_0.5s_infinite]" />
                  <div className="w-2 bg-[#b84235] h-3/4 animate-[bounce_0.7s_infinite_0.1s]" />
                  <div className="w-2 bg-[#b84235] h-1/2 animate-[bounce_0.6s_infinite_0.2s]" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <div className="w-0 h-0 border-t-6 border-b-6 border-l-8 border-transparent border-l-white ml-1" />
                </div>
              )}
            </button>
          ))}
        </div>

        {isPlaying && (
          <div className="bg-black/30 rounded-lg p-4 mb-6 border border-white/10">
            <div className="h-2 bg-black rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-[#dfd4ba] to-[#b84235]" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <div className="flex justify-between text-xs text-white/40 font-mono">
              <span>Playing...</span>
              <span>Procedural Sequence</span>
            </div>
          </div>
        )}

        <button 
          onClick={stopMusic}
          disabled={!isPlaying}
          className="w-full bg-[#1b1918] text-[#dfd4ba] border-2 border-[#5c4a3d] hover:bg-[#5c4a3d] disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-lg font-bold tracking-widest transition-colors"
        >
          STOP AUDIO
        </button>

      </div>
    </div>
  );
};
