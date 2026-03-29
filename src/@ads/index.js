/**
 * @ads - Central ad module
 * 
 * Usage:
 *   import { loadAds, showRewardedVideo, showInterstitial } from '@ads';
 * 
 * Configuration via environment:
 *   VITE_ENABLE_ADS='true'  - Enable real ad implementation
 *   VITE_ENABLE_ADS='false' - Use noop stubs (default)
 */

const isAdsEnabled = import.meta.env.VITE_ENABLE_ADS === 'true';

let adsImpl = null;

async function getAdsImpl() {
  if (adsImpl !== null) return adsImpl;
  
  if (isAdsEnabled) {
    // Future: load real platform-specific implementation
    // import('./platforms/crazygames.js') or './platforms/poki.js', etc.
    console.warn('[Ads] Real ad implementation not yet configured');
    adsImpl = await import('./noop.js');
  } else {
    adsImpl = await import('./noop.js');
  }
  
  return adsImpl;
}

export async function loadAds() {
  const impl = await getAdsImpl();
  return impl.loadAds();
}

export async function showRewardedVideo(options = {}) {
  const impl = await getAdsImpl();
  return impl.showRewardedVideo(options);
}

export async function showInterstitial(options = {}) {
  const impl = await getAdsImpl();
  return impl.showInterstitial(options);
}

export async function showPlayable() {
  const impl = await getAdsImpl();
  return impl.showPlayable ? impl.showPlayable() : Promise.resolve();
}

export function isAdsSupported() {
  return isAdsEnabled;
}
