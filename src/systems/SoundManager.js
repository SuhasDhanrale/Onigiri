import { MUSIC_TRACKS, MUSIC_SLOTS, startTrackLoop } from './MusicEngine.js';
import { SFX_LIBRARY, SFX_MIN_INTERVAL, SFX_DEFAULT_INTERVAL } from './SfxEngine.js';

const STORAGE_KEY = 'onigiri_audio_settings';

const DEFAULT_SETTINGS = {
  muted: false,
  masterVolume: 1,
  musicVolume: 0.6,
  sfxVolume: 0.8,
};

function loadSettings() {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore (private mode / storage disabled)
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value)));
}

class SoundManagerClass {
  constructor() {
    this.externalMuted = false;
    this.settings = loadSettings();

    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    this.currentMusic = null;
    this.currentMusicId = null;
    this._stingerTimeout = null;

    this._lastSfxTime = {};
  }

  // --- Ad-break muting (existing API, preserved for ad adapters) ---
  setExternalMuted(muted) {
    this.externalMuted = !!muted;

    if (typeof document !== 'undefined') {
      document.querySelectorAll('audio, video').forEach((element) => {
        element.muted = this.externalMuted;
      });

      window.dispatchEvent(new CustomEvent('game:external-mute-change', {
        detail: { muted: this.externalMuted }
      }));
    }

    this._applyVolumes();
  }

  isExternalMuted() {
    return this.externalMuted;
  }

  // --- AudioContext lifecycle ---
  ensureContext() {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this._applyVolumes();
    return this.ctx;
  }

  /** Resume a suspended AudioContext — call on first user gesture (autoplay policy). */
  resume() {
    const ctx = this.ensureContext();
    if (!ctx) return Promise.resolve();
    if (ctx.state === 'suspended') return ctx.resume().catch(() => {});
    return Promise.resolve();
  }

  // --- Volume / mute ---
  _applyVolumes() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const muted = this.settings.muted || this.externalMuted;
    const master = muted ? 0 : this.settings.masterVolume;

    this.masterGain.gain.setTargetAtTime(master, now, 0.01);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume, now, 0.01);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, now, 0.01);
  }

  setMuted(muted) {
    this.settings.muted = !!muted;
    saveSettings(this.settings);
    this._applyVolumes();
  }

  setMasterVolume(value) {
    this.settings.masterVolume = clamp01(value);
    saveSettings(this.settings);
    this._applyVolumes();
  }

  setMusicVolume(value) {
    this.settings.musicVolume = clamp01(value);
    saveSettings(this.settings);
    this._applyVolumes();
  }

  setSfxVolume(value) {
    this.settings.sfxVolume = clamp01(value);
    saveSettings(this.settings);
    this._applyVolumes();
  }

  getSettings() {
    return { ...this.settings, externalMuted: this.externalMuted };
  }

  // --- Music ---
  /** Shared setup for playMusic/playStinger: swap in a new track and start its loop. */
  _startTrack(trackId, { loop }) {
    const ctx = this.ensureContext();
    if (!ctx) return null;
    const track = MUSIC_TRACKS[trackId];
    if (!track) return null;

    this._clearStinger();
    this.stopMusic();
    this.resume();
    this.currentMusic = startTrackLoop(ctx, this.musicGain, track, { loop });
    this.currentMusicId = trackId;
    return this.currentMusic;
  }

  /** Play a track by id from MUSIC_TRACKS (loops by default). No-op if already playing. */
  playMusic(trackId, { loop = true } = {}) {
    if (this.currentMusicId === trackId && this.currentMusic) return;
    this._startTrack(trackId, { loop });
  }

  /** Play the track mapped to a role in MUSIC_SLOTS (e.g. 'menu', 'battle', 'chapterBoss'). */
  playMusicSlot(slot) {
    const trackId = MUSIC_SLOTS[slot];
    if (trackId) this.playMusic(trackId);
  }

  /**
   * Play a music slot once (no loop) as a sting, then optionally return to
   * another slot afterwards — e.g. a short alert sting before resuming battle.
   */
  playStinger(slot, { returnTo = null } = {}) {
    const trackId = MUSIC_SLOTS[slot];
    if (!trackId) return;
    // Already playing this sting (e.g. back-to-back wave alerts) — let the
    // running copy and its returnTo timeout play out instead of restarting it.
    if (this.currentMusicId === trackId && this.currentMusic) return;

    const music = this._startTrack(trackId, { loop: false });
    if (!music) return;

    if (returnTo) {
      this._stingerTimeout = setTimeout(() => {
        this._stingerTimeout = null;
        if (this.currentMusicId === trackId) this.playMusicSlot(returnTo);
      }, music.loopDuration * 1000);
    }
  }

  stopMusic() {
    this._clearStinger();
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
      this.currentMusicId = null;
    }
  }

  _clearStinger() {
    if (this._stingerTimeout) {
      clearTimeout(this._stingerTimeout);
      this._stingerTimeout = null;
    }
  }

  // --- SFX ---
  /** Play a one-shot SFX by id from SFX_LIBRARY, rate-limited per id. */
  playSfx(id, opts = {}) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const generator = SFX_LIBRARY[id];
    if (!generator) return;

    const now = ctx.currentTime;
    const minInterval = SFX_MIN_INTERVAL[id] ?? SFX_DEFAULT_INTERVAL;
    const last = this._lastSfxTime[id] ?? -Infinity;
    if (now - last < minInterval) return;
    this._lastSfxTime[id] = now;

    this.resume();
    generator(ctx, this.sfxGain, now, opts);
  }
}

export const SoundManager = new SoundManagerClass();
