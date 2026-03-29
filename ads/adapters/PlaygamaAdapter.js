import { BaseAdapter } from './BaseAdapter.js'
import { SoundManager } from '../../src/systems/SoundManager.js'
import { State } from '../../src/state.js'
import { createPlaygamaAdsModule } from '../../src/integrations/playgama/modules/adsModule.js'
import { ensurePlaygamaIntegration } from '../../src/integrations/playgama/playgamaIntegration.js'
import { wirePlaygamaEvents } from '../../src/integrations/playgama/playgamaFacade.js'

function normalizeState(value) {
  return String(value || '').toLowerCase()
}

export class PlaygamaAdapter extends BaseAdapter {
  constructor() {
    super('PlaygamaAdapter')

    this.bridge = null
    this.facade = null
    this.ads = null

    this.isGameplayActive = false
    this.eventsWired = false
    this.forcePauseForAd = false
  }

  async init() {
    this.log('Initializing Playgama Bridge...')

    try {
      const integration = await ensurePlaygamaIntegration()

      if (!integration?.bridge || !integration?.facade) {
        this.log('Playgama integration unavailable for current platform')
        return false
      }

      this.bridge = integration.bridge
      this.facade = integration.facade
      this.ads = createPlaygamaAdsModule(this.bridge)

      this.ads.setMinimumDelayBetweenInterstitial(30)

      this._wireEvents()
      this._syncRuntimeGuards()

      this.initialized = true

      this.log('Playgama Bridge initialized', {
        platformId: this.facade.platformId,
        language: this.facade.language
      })

      return true
    } catch (error) {
      this.log('Failed to initialize Playgama Bridge', {
        error: error?.message || error
      })
      return false
    }
  }

  _isBridgeAvailable() {
    return Boolean(this.initialized && this.bridge && this.facade && this.ads)
  }

  _wireEvents() {
    if (this.eventsWired || !this.bridge) return

    wirePlaygamaEvents(this.bridge, {
      onAudioStateChanged: () => this._syncRuntimeGuards(),
      onPauseStateChanged: () => this._syncRuntimeGuards(),
      onVisibilityChanged: () => this._syncRuntimeGuards(),
      onInterstitialState: () => this._syncRuntimeGuards(),
      onRewardedState: () => this._syncRuntimeGuards()
    })

    this.eventsWired = true
  }

  _isVisibilityBlocking() {
    const visibilityState = normalizeState(this.bridge?.game?.visibilityState)
    return visibilityState === 'hidden' || visibilityState === 'paused' || visibilityState === 'blurred'
  }

  _isAdBlockingState(rawState) {
    const state = normalizeState(rawState)
    if (!state) return false

    return (
      state.includes('open') ||
      state.includes('show') ||
      state.includes('play') ||
      state.includes('run') ||
      state.includes('start')
    )
  }

  _syncRuntimeGuards() {
    if (!this.bridge) return

    const audioEnabled = this.bridge?.platform?.isAudioEnabled
    const pauseState = Boolean(this.bridge?.platform?.pauseState)

    const interstitialBlocking = this._isAdBlockingState(this.ads?.interstitialState)
    const rewardedBlocking = this._isAdBlockingState(this.ads?.rewardedState)
    const adBlocking = interstitialBlocking || rewardedBlocking || this.forcePauseForAd

    const shouldPause = pauseState || this._isVisibilityBlocking() || adBlocking
    State.isPaused = shouldPause

    const shouldMute = audioEnabled === false || shouldPause
    SoundManager.setExternalMuted(shouldMute)
  }

  _placement(placement) {
    const normalized = String(placement || '').trim()
    return normalized || 'default'
  }

  async showInterstitial(placement) {
    if (!this._isBridgeAvailable()) {
      return { success: false, error: 'Playgama Bridge not available' }
    }

    if (!this.ads.isInterstitialSupported) {
      return { success: false, error: 'Interstitial ads are not supported' }
    }

    const shouldResume = this.isGameplayActive
    this.reportGameplayStop()

    this.forcePauseForAd = true
    this._syncRuntimeGuards()

    let result
    try {
      result = await this.ads.showInterstitial(this._placement(placement))
    } finally {
      this.forcePauseForAd = false
      this._syncRuntimeGuards()
    }

    if (shouldResume) {
      this.reportGameplayStart()
    }

    if (!result.success) {
      return { success: false, error: result.error || 'Interstitial ad failed' }
    }

    return { success: true }
  }

  async showRewardedAd(placement) {
    if (!this._isBridgeAvailable()) {
      return { success: false, rewarded: false, error: 'Playgama Bridge not available' }
    }

    if (!this.ads.isRewardedSupported) {
      return { success: false, rewarded: false, error: 'Rewarded ads are not supported' }
    }

    const shouldResume = this.isGameplayActive
    this.reportGameplayStop()

    this.forcePauseForAd = true
    this._syncRuntimeGuards()

    let result
    try {
      result = await this.ads.showRewarded(this._placement(placement))
    } finally {
      this.forcePauseForAd = false
      this._syncRuntimeGuards()
    }

    if (shouldResume) {
      this.reportGameplayStart()
    }

    if (!result.success) {
      return {
        success: false,
        rewarded: false,
        error: result.error || 'Rewarded ad failed'
      }
    }

    return {
      success: true,
      rewarded: Boolean(result.rewarded)
    }
  }

  async showBanner(position = 'bottom') {
    if (!this._isBridgeAvailable()) {
      return { success: false, error: 'Playgama Bridge not available' }
    }

    return await this.ads.showBanner(position)
  }

  async hideBanner() {
    if (!this._isBridgeAvailable()) return
    await this.ads.hideBanner()
  }

  isAdAvailable(adType) {
    if (!this._isBridgeAvailable()) return false

    switch (adType) {
      case 'interstitial':
        return this.ads.isInterstitialSupported
      case 'rewarded':
        return this.ads.isRewardedSupported
      case 'banner':
        return this.ads.isBannerSupported
      default:
        return false
    }
  }

  async preloadAd(adType) {
    return this.isAdAvailable(adType)
  }

  reportLoadingStart() {
    this.facade?.reportLoadingStart()
  }

  reportLoadingStop() {
    this.facade?.reportLoadingStop()
  }

  reportGameReady() {
    this.facade?.reportGameReadyOnce()
  }

  reportGameplayStart() {
    if (!this._isBridgeAvailable() || this.isGameplayActive) return

    this.facade.reportGameplayStart()
    this.isGameplayActive = true
    this._syncRuntimeGuards()
  }

  reportGameplayStop() {
    if (!this._isBridgeAvailable() || !this.isGameplayActive) return

    this.facade.reportGameplayStop()
    this.isGameplayActive = false
    this._syncRuntimeGuards()
  }

  reportHappyTime() {
    this.facade?.reportMilestone()
  }
}
