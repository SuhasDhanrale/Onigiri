/**
 * No-op ad implementation (default when VITE_ENABLE_ADS !== 'true')
 * All functions are stubs that do nothing and return safe defaults.
 */

/**
 * Initialize ad systems. No-op in stub mode.
 * @returns {Promise<void>}
 */
export async function loadAds() {
  console.debug('[Ads] Noop: loadAds()');
  return Promise.resolve();
}

/**
 * Show a rewarded video ad.
 * @param {Object} options - Configuration options
 * @param {string} options.placement - Where the reward is from (e.g., 'revive', 'bonus')
 * @returns {Promise<boolean>} - Resolves false (no ad shown in stub mode)
 */
export async function showRewardedVideo(options = {}) {
  console.debug('[Ads] Noop: showRewardedVideo()', options);
  return Promise.resolve(false);
}

/**
 * Show an interstitial ad.
 * @param {Object} options - Configuration options
 * @param {string} options.placement - Where the interstitial appears (e.g., 'level_end', 'checkpoint')
 * @returns {Promise<boolean>} - Resolves false (no ad shown in stub mode)
 */
export async function showInterstitial(options = {}) {
  console.debug('[Ads] Noop: showInterstitial()', options);
  return Promise.resolve(false);
}

/**
 * Show Poki/portal playable ad (typically a 30-second gameplay clip).
 * @returns {Promise<boolean>}
 */
export async function showPlayable() {
  console.debug('[Ads] Noop: showPlayable()');
  return Promise.resolve(false);
}
