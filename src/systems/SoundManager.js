class SoundManagerClass {
  constructor() {
    this.externalMuted = false;
  }

  setExternalMuted(muted) {
    this.externalMuted = !!muted;

    if (typeof document === 'undefined') return;

    document.querySelectorAll('audio, video').forEach((element) => {
      element.muted = this.externalMuted;
    });

    window.dispatchEvent(new CustomEvent('game:external-mute-change', {
      detail: { muted: this.externalMuted }
    }));
  }

  isExternalMuted() {
    return this.externalMuted;
  }
}

export const SoundManager = new SoundManagerClass();
