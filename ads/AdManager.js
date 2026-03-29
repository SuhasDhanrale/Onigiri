/**
 * AdManager - Universal Ad Manager System
 * 
 * Usage:
 *   import { AdManager } from './systems/ads/AdManager.js';
 *   await AdManager.init();
 *   await AdManager.showInterstitialAfterLevel(levelNumber);
 */

import { EventBus } from '../src/eventBus.js';
import {
    AD_CONFIG,
    getPlacementId,
    areAdsEnabled,
    shouldShowAdAfterLevel,
    canUseRewardedForUpgrade
} from './adConfig.js';

import { DummyAdapter } from './adapters/DummyAdapter.js';
import { FallbackAdapter } from './adapters/FallbackAdapter.js';

class AdManagerClass {
    constructor() {
        this.initialized = false;
        this.adapter = null;
        this.initPromise = null;
        this._pendingCalls = [];

        this.sessionStats = {
            interstitialsShown: 0,
            rewardedShown: 0,
            gameOvers: 0,
            levelCompletes: 0,
            continuesUsed: 0
        };

        this.attemptStats = {
            continuesUsed: 0
        };

        this.lastAdTime = 0;
        this.lastInterstitialTime = 0;
        this.sessionStartTime = Date.now();
        this.bannerVisible = false;
        this.startupInterstitialShown = false;
        this.startupInterstitialGateInstalled = false;
        this.startupInterstitialInProgress = false;
    }

    _isCrazyGamesSdkOnlyMode() {
        return AD_CONFIG.platform === 'crazygames' && AD_CONFIG.CG_SDK_ONLY === true;
    }

    async init() {
        if (this.initialized && this.adapter) return true;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            const sdkOnlyMode = this._isCrazyGamesSdkOnlyMode();

            if (!areAdsEnabled() && !sdkOnlyMode) {
                console.log('[AdManager] Ads disabled via config');
                this.adapter = new FallbackAdapter();
                await this.adapter.init();
                this.initialized = true;
                return true;
            }

            if (sdkOnlyMode) {
                console.log('[AdManager] CrazyGames SDK-only mode enabled (ads disabled, SDK active)');
            }

            this.adapter = await this._createAdapter();

            const success = await this.adapter.init();
            if (!success) {
                console.log('[AdManager] Adapter failed to init, falling back to FallbackAdapter');
                this.adapter = new FallbackAdapter();
                await this.adapter.init();
            }

            this._setupEventListeners();

            this.initialized = true;
            this._flushPendingCalls();
            console.log(`[AdManager] Initialized with ${this.adapter.name}`);
            return true;
        })();

        try {
            return await this.initPromise;
        } finally {
            this.initPromise = null;
        }
    }

    async _ensureInitialized() {
        if (this.initialized && this.adapter) {
            return true;
        }

        await this.init();

        if (!this.adapter) {
            console.error('[AdManager] No adapter available after init');
            return false;
        }

        return true;
    }

    _callAdapterMethod(methodName, ...args) {
        if (!this.adapter) {
            // Adapter not yet initialized — queue the call for replay after init
            this._pendingCalls.push({ methodName, args });
            return;
        }

        if (typeof this.adapter[methodName] !== 'function') {
            return;
        }

        try {
            return this.adapter[methodName](...args);
        } catch (error) {
            console.warn(`[AdManager] Adapter method failed: ${methodName}`, error);
        }
    }

    _flushPendingCalls() {
        const pending = this._pendingCalls;
        this._pendingCalls = [];
        for (const { methodName, args } of pending) {
            this._callAdapterMethod(methodName, ...args);
        }
    }

    async _createAdapter() {
        // 1. Check if this is the Ad-Free premium build variant
        if (AD_CONFIG.AD_FREE_VERSION && !this._isCrazyGamesSdkOnlyMode()) {
            console.log('[AdManager] Ad-Free mode detected, loading NoOpAdapter');
            const { NoOpAdapter } = await import('./adapters/NoOpAdapter.js');
            return new NoOpAdapter();
        }

        const platform = AD_CONFIG.platform;

        if (AD_CONFIG.debug.forceDummy) {
            console.log('[AdManager] Force using DummyAdapter');
            return new DummyAdapter();
        }

        switch (platform) {
            case 'poki':
                try {
                    const { PokiAdapter } = await import('./adapters/PokiAdapter.js');
                    return new PokiAdapter();
                } catch (e) {
                    console.log('[AdManager] PokiAdapter not available');
                }
                break;

            case 'crazygames':
                try {
                    const { CrazyGamesAdapter } = await import('./adapters/CrazyGamesAdapter.js');
                    return new CrazyGamesAdapter();
                } catch (e) {
                    console.log('[AdManager] CrazyGamesAdapter not available');
                }
                break;

            case 'mobile':
                try {
                    const { AdMobAdapter } = await import('./adapters/AdMobAdapter.js');
                    return new AdMobAdapter();
                } catch (e) {
                    console.log('[AdManager] AdMobAdapter not available');
                }
                break;

            case 'gamedistribution':
                try {
                    const { GameDistributionAdapter } = await import('./adapters/GameDistributionAdapter.js');
                    return new GameDistributionAdapter();
                } catch (e) {
                    console.log('[AdManager] GameDistributionAdapter not available');
                }
                break;

            case 'playgama':
                try {
                    const { PlaygamaAdapter } = await import('./adapters/PlaygamaAdapter.js');
                    return new PlaygamaAdapter();
                } catch (e) {
                    console.log('[AdManager] PlaygamaAdapter not available');
                }
                break;

            case 'web':
            case 'development':
            default:
                return new DummyAdapter();
        }

        return new DummyAdapter();
    }

    _setupEventListeners() {
        EventBus.on('level:fail', () => {
            this.sessionStats.gameOvers++;
        });

        EventBus.on('level:complete', () => {
            this.sessionStats.levelCompletes++;
        });

        EventBus.on('level:start', () => {
            this.attemptStats.continuesUsed = 0;
        });
    }

    async showInterstitial(placement = 'default', options = {}) {
        const force = options?.force === true;

        if (this._isCrazyGamesSdkOnlyMode()) {
            console.log(`[AdManager] SDK-only mode: interstitial blocked (${placement})`);
            return false;
        }

        if (!await this._ensureInitialized()) {
            return false;
        }

        if (!force && !this._canShowAd('interstitial')) {
            console.log('[AdManager] Cannot show interstitial - cooldown or cap reached');
            return false;
        }

        const placementId = getPlacementId('interstitial');
        console.log(`[AdManager] Showing interstitial: ${placement}`);

        EventBus.emit('ad:started', { type: 'interstitial', placement });

        try {
            const result = await this.adapter.showInterstitial(placementId);

            if (result.success) {
                this.sessionStats.interstitialsShown++;
                this.lastAdTime = Date.now();
                this.lastInterstitialTime = Date.now();
                EventBus.emit('ad:completed', { type: 'interstitial', placement });
            } else {
                EventBus.emit('ad:failed', { type: 'interstitial', placement, error: result.error });
            }

            return result.success;
        } catch (error) {
            console.error('[AdManager] Interstitial error:', error);
            EventBus.emit('ad:failed', { type: 'interstitial', placement, error: error.message });
            return false;
        }
    }

    async showStartupInterstitialOnce() {
        if (this.startupInterstitialShown) {
            return false;
        }

        this.startupInterstitialShown = true;
        return await this.showInterstitial('startup_gate', { force: true });
    }

    installStartupInterstitialGate() {
        if (this.startupInterstitialGateInstalled) return false;
        if (!areAdsEnabled()) return false;

        this.startupInterstitialGateInstalled = true;

        const interactionEvents = ['pointerdown', 'mousedown', 'touchstart', 'click'];

        const blockEvent = (event) => {
            if (!this.startupInterstitialInProgress) return;

            if (event.cancelable) event.preventDefault();
            if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
            event.stopPropagation();
        };

        const addBlockers = () => {
            interactionEvents.forEach((type) => {
                window.addEventListener(type, blockEvent, { capture: true, passive: false });
            });
        };

        const removeBlockers = () => {
            interactionEvents.forEach((type) => {
                window.removeEventListener(type, blockEvent, true);
            });
            this.startupInterstitialInProgress = false;
        };

        const clearGate = () => {
            window.removeEventListener('pointerdown', onFirstInteraction, true);
            window.removeEventListener('mousedown', onFirstInteraction, true);
            window.removeEventListener('touchstart', onFirstInteraction, true);
        };

        const onFirstInteraction = async (event) => {
            if (this.startupInterstitialInProgress) {
                blockEvent(event);
                return;
            }

            this.startupInterstitialInProgress = true;
            blockEvent(event);
            addBlockers();

            try {
                await this.showStartupInterstitialOnce();
            } finally {
                removeBlockers();
                clearGate();
            }
        };

        window.addEventListener('pointerdown', onFirstInteraction, { capture: true, passive: false });
        window.addEventListener('mousedown', onFirstInteraction, { capture: true, passive: false });
        window.addEventListener('touchstart', onFirstInteraction, { capture: true, passive: false });

        return true;
    }

    async showRewardedAd(placement = 'default', callback = null) {
        if (this._isCrazyGamesSdkOnlyMode()) {
            console.log(`[AdManager] SDK-only mode: rewarded blocked (${placement})`);
            if (callback) callback(false);
            return false;
        }

        if (!await this._ensureInitialized()) {
            if (callback) callback(false);
            return false;
        }

        if (!this._canShowAd('rewarded')) {
            console.log('[AdManager] Cannot show rewarded - cooldown reached');
            if (callback) callback(false);
            return false;
        }

        const placementId = getPlacementId('rewarded');
        console.log(`[AdManager] Showing rewarded ad: ${placement}`);

        EventBus.emit('ad:started', { type: 'rewarded', placement });

        try {
            const result = await this.adapter.showRewardedAd(placementId);
            console.info('[RewardDebug][AdManager] Adapter rewarded result', {
                placement,
                placementId,
                adapter: this.adapter?.name,
                result
            });

            if (result.success) {
                this.sessionStats.rewardedShown++;
                this.lastAdTime = Date.now();

                if (result.rewarded) {
                    EventBus.emit('ad:rewarded', { type: 'rewarded', placement });
                } else {
                    EventBus.emit('ad:skipped', { type: 'rewarded', placement });
                }

                if (callback) {
                    callback(result.rewarded, {
                        opened: true,
                        placement,
                        placementId,
                        adapter: this.adapter?.name,
                        result
                    });
                }
            } else {
                EventBus.emit('ad:failed', { type: 'rewarded', placement, error: result.error });
                if (callback) {
                    callback(false, {
                        opened: false,
                        placement,
                        placementId,
                        adapter: this.adapter?.name,
                        result
                    });
                }
            }

            return result.success;
        } catch (error) {
            console.error('[AdManager] Rewarded ad error:', error);
            EventBus.emit('ad:failed', { type: 'rewarded', placement, error: error.message });
            if (callback) {
                callback(false, {
                    opened: false,
                    placement,
                    placementId,
                    adapter: this.adapter?.name,
                    error: error?.message || String(error)
                });
            }
            return false;
        }
    }

    async showInterstitialAfterLevel(levelNumber) {
        if (!shouldShowAdAfterLevel(levelNumber)) {
            console.log(`[AdManager] No ad after level ${levelNumber} (per level rules)`);
            return false;
        }

        if (!this._canShowAd('interstitial')) {
            console.log(`[AdManager] Ad eligible after level ${levelNumber} but blocked by cooldown/cap`);
            return false;
        }

        return await this.showInterstitial(`level_${levelNumber}_complete`);
    }

    async showInterstitialOnGameOver() {
        const n = AD_CONFIG.frequencyCaps.interstitialEveryNGameOvers;

        if ((this.sessionStats.gameOvers + 1) % n !== 0) {
            console.log(`[AdManager] No ad on game over (${this.sessionStats.gameOvers + 1} of ${n})`);
            return false;
        }

        return await this.showInterstitial('game_over');
    }

    canUseRewardedForUpgrade(upgradeType) {
        return canUseRewardedForUpgrade(upgradeType);
    }

    async offerRewardedForUpgrade(upgradeType, level, onSuccess = null, onCancel = null) {
        if (!this.canUseRewardedForUpgrade(upgradeType)) {
            console.log(`[AdManager] ${upgradeType} doesn't support rewarded ads`);
            if (onCancel) onCancel();
            return;
        }

        await this.showRewardedAd(`upgrade_${upgradeType}_${level}`, (rewarded) => {
            if (rewarded) {
                if (onSuccess) onSuccess();
            } else {
                if (onCancel) onCancel();
            }
        });
    }

    async offerRewardedForContinue(onContinue = null, onDecline = null) {
        if (!AD_CONFIG.shop.allowContinueWithAd) {
            console.log('[AdManager] Continue with ad is disabled');
            return false;
        }

        if (this.attemptStats.continuesUsed >= AD_CONFIG.shop.maxContinuesPerAttempt) {
            console.log('[AdManager] Max continues reached for this attempt');
            return false;
        }

        await this.showRewardedAd('continue_game', (rewarded) => {
            if (rewarded) {
                this.attemptStats.continuesUsed++;
                this.sessionStats.continuesUsed++;
                if (onContinue) onContinue();
            } else {
                if (onDecline) onDecline();
            }
        });

        return true;
    }

    canOfferContinue() {
        if (!AD_CONFIG.shop.allowContinueWithAd) return false;
        if (this.attemptStats.continuesUsed >= AD_CONFIG.shop.maxContinuesPerAttempt) return false;
        return true;
    }

    async showBanner(position = 'bottom') {
        if (!await this._ensureInitialized()) return false;
        if (!areAdsEnabled()) return false;
        const result = await this.adapter.showBanner(position);
        this.bannerVisible = result.success;
        return result.success;
    }

    async hideBanner() {
        if (!await this._ensureInitialized()) return;
        await this.adapter.hideBanner();
        this.bannerVisible = false;
    }

    isAdAvailable(adType) {
        if (!this.initialized) return false;
        if (!areAdsEnabled()) return false;
        return this.adapter.isAdAvailable(adType);
    }

    async preloadAd(adType) {
        if (!await this._ensureInitialized()) return false;
        return await this.adapter.preloadAd(adType);
    }

    _canShowAd(adType) {
        if (this._isCrazyGamesSdkOnlyMode()) {
            return false;
        }

        if (AD_CONFIG.debug.ignoreCooldowns) {
            return true;
        }

        // Rewarded ads (user-initiated) bypass timing cooldowns
        if (adType === 'rewarded') {
            return this.sessionStats.rewardedShown < AD_CONFIG.frequencyCaps.maxRewardedPerSession;
        }

        const now = Date.now();
        const config = AD_CONFIG;

        const timeSinceStart = now - this.sessionStartTime;
        if (timeSinceStart < config.timing.initialDelay) {
            return false;
        }

        const timeSinceLastAd = now - this.lastAdTime;
        if (timeSinceLastAd < config.timing.globalCooldown) {
            return false;
        }

        if (adType === 'interstitial') {
            const timeSinceLastInterstitial = now - this.lastInterstitialTime;
            if (timeSinceLastInterstitial < config.timing.interstitialCooldown) {
                return false;
            }

            if (this.sessionStats.interstitialsShown >= config.frequencyCaps.maxInterstitialsPerSession) {
                return false;
            }
        }

        if (adType === 'rewarded') {
            if (this.sessionStats.rewardedShown >= config.frequencyCaps.maxRewardedPerSession) {
                return false;
            }
        }

        return true;
    }

    canShowInterstitial() {
        return this._canShowAd('interstitial');
    }

    reportLoadingStart() {
        this._callAdapterMethod('reportLoadingStart');
    }

    reportLoadingStop() {
        this._callAdapterMethod('reportLoadingStop');
        this._callAdapterMethod('reportLoadingFinished');
        this._callAdapterMethod('reportGameReady');
    }

    reportGameplayStart() {
        this._callAdapterMethod('reportGameplayStart');
    }

    reportGameplayStop() {
        this._callAdapterMethod('reportGameplayStop');
    }

    reportHappyTime() {
        this._callAdapterMethod('reportHappyTime');
    }

    resetAttemptStats() {
        this.attemptStats = { continuesUsed: 0 };
    }

    resetSessionStats() {
        this.sessionStats = {
            interstitialsShown: 0,
            rewardedShown: 0,
            gameOvers: 0,
            levelCompletes: 0,
            continuesUsed: 0
        };
        this.lastAdTime = 0;
        this.lastInterstitialTime = 0;
        this.sessionStartTime = Date.now();
    }

    getAdapterName() {
        return this.adapter?.name || 'None';
    }

    getStats() {
        return {
            session: { ...this.sessionStats },
            attempt: { ...this.attemptStats }
        };
    }
}

export const AdManager = new AdManagerClass();
