import { MUSIC_TRACKS, MUSIC_SLOTS, startTrackLoop } from './MusicEngine.js';
import { SFX_LIBRARY, SFX_MIN_INTERVAL, SFX_DEFAULT_INTERVAL } from './SfxEngine.js';
import { readStorageJson, writeStorageJson } from '../platforms/gameStorage.js';
import { getPublicAssetUrl } from '../platforms/publicAssets.js';

const STORAGE_KEY = 'onigiri_audio_settings';

const MUSIC_FILE_SLOTS = {
  menu: encodeURI(getPublicAssetUrl('assets/music/Main.mp3')),
  battle: encodeURI(getPublicAssetUrl('assets/music/waves 02.mp3')),
  chapterBoss: encodeURI(getPublicAssetUrl('assets/music/Boss 02.mp3')),
};

const SFX_FILE_LIBRARY = {
  region_victory_fanfare: encodeURI(getPublicAssetUrl('assets/sfx/warwon.mp3')),
  campaign_victory_fanfare: encodeURI(getPublicAssetUrl('assets/sfx/warwon.mp3')),
};

const DEFAULT_SETTINGS = {
  muted: false,
  masterVolume: 1,
  musicVolume: 0.4,
  sfxVolume: 0.5,
};

function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...readStorageJson(STORAGE_KEY, DEFAULT_SETTINGS) };
}

function saveSettings(settings) {
  writeStorageJson(STORAGE_KEY, settings);
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
    this.currentMusicAudio = null;
    this.currentMusicId = null;
    this._stingerTimeout = null;

    this._lastSfxTime = {};
    this._activeFileSfx = new Set();
    this.pageHidden = typeof document !== 'undefined' ? document.hidden : false;
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
    if (this.pageHidden) return Promise.resolve();
    const ctx = this.ensureContext();
    const contextResume = ctx?.state === 'suspended'
      ? ctx.resume().catch(() => {})
      : Promise.resolve();
    return Promise.all([contextResume, this._resumeMusicAudio()]).then(() => {});
  }

  /** Suspend without creating a context; used when the page/tab is hidden. */
  suspend() {
    this.currentMusicAudio?.pause();
    this._activeFileSfx.forEach((audio) => audio.pause());
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return Promise.resolve();
    return ctx.suspend().catch(() => {});
  }

  setPageHidden(hidden) {
    this.pageHidden = !!hidden;
    if (this.pageHidden) return this.suspend();
    const contextResume = this.ctx?.state === 'suspended'
      ? this.ctx.resume().catch(() => {})
      : Promise.resolve();
    return Promise.all([contextResume, this._resumeMusicAudio()]).then(() => {});
  }

  // --- Volume / mute ---
  _applyVolumes() {
    const muted = this.settings.muted || this.externalMuted;
    const master = muted ? 0 : this.settings.masterVolume;
    this._syncMusicAudioVolume();
    this._activeFileSfx.forEach((audio) => this._syncFileSfxVolume(audio));

    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

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
  _syncMusicAudioVolume() {
    if (!this.currentMusicAudio) return;
    this.currentMusicAudio.volume = clamp01(this.settings.masterVolume * this.settings.musicVolume);
    this.currentMusicAudio.muted = this.settings.muted || this.externalMuted;
  }

  _syncFileSfxVolume(audio) {
    audio.volume = clamp01(this.settings.masterVolume * this.settings.sfxVolume);
    audio.muted = this.settings.muted || this.externalMuted;
  }

  _resumeMusicAudio() {
    if (this.pageHidden || !this.currentMusicAudio) return Promise.resolve();
    this._syncMusicAudioVolume();
    return this.currentMusicAudio.play().catch(() => {});
  }

  _startFileMusic(slot, url) {
    const musicId = `file:${slot}`;
    if (this.currentMusicId === musicId && this.currentMusicAudio) {
      this._resumeMusicAudio();
      return this.currentMusicAudio;
    }

    this.stopMusic();
    if (typeof Audio === 'undefined') return null;

    const audio = new Audio(url);
    audio.loop = true;
    audio.preload = 'auto';
    this.currentMusicAudio = audio;
    this.currentMusicId = musicId;
    this._syncMusicAudioVolume();
    this._resumeMusicAudio();
    return audio;
  }

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
    const fileUrl = MUSIC_FILE_SLOTS[slot];
    if (fileUrl) {
      this._startFileMusic(slot, fileUrl);
      return;
    }

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
    if (this.currentMusicAudio) {
      this.currentMusicAudio.pause();
      this.currentMusicAudio.currentTime = 0;
      this.currentMusicAudio = null;
      this.currentMusicId = null;
    }
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
  _playFileSfx(url) {
    if (this.pageHidden || typeof Audio === 'undefined') return;
    const audio = new Audio(url);
    audio.preload = 'auto';
    this._syncFileSfxVolume(audio);

    const cleanup = () => {
      this._activeFileSfx.delete(audio);
      audio.removeEventListener('ended', cleanup);
      audio.removeEventListener('error', cleanup);
    };
    audio.addEventListener('ended', cleanup);
    audio.addEventListener('error', cleanup);
    this._activeFileSfx.add(audio);
    audio.play().catch(cleanup);
  }

  /** Play a one-shot SFX by id from SFX_LIBRARY, rate-limited per id. */
  playSfx(id, opts = {}) {
    if (this.pageHidden) return;
    const fileUrl = SFX_FILE_LIBRARY[id];
    if (fileUrl) {
      const nowMs = performance.now() / 1000;
      const minInterval = SFX_MIN_INTERVAL[id] ?? SFX_DEFAULT_INTERVAL;
      const last = this._lastSfxTime[id] ?? -Infinity;
      if (nowMs - last < minInterval) return;
      this._lastSfxTime[id] = nowMs;
      this._playFileSfx(fileUrl);
      return;
    }

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
