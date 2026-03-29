/**
 * @analytics - Central analytics module
 * 
 * Usage:
 *   import { trackEvent, trackScreen, setUserProperty } from '@analytics';
 * 
 * Configuration via environment:
 *   VITE_ENABLE_ANALYTICS='true'  - Enable real analytics (Firebase, etc.)
 *   VITE_ENABLE_ANALYTICS='false' - Use noop stubs (default)
 */

const isAnalyticsEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

let analyticsImpl = null;

async function getAnalyticsImpl() {
  if (analyticsImpl !== null) return analyticsImpl;
  
  if (isAnalyticsEnabled) {
    // Future: load real implementation
    // import('./firebase.js') or './googleAnalytics.js', etc.
    console.warn('[Analytics] Real analytics implementation not yet configured');
    analyticsImpl = await import('./noop.js');
  } else {
    analyticsImpl = await import('./noop.js');
  }
  
  return analyticsImpl;
}

export async function trackEvent(eventName, params = {}) {
  const impl = await getAnalyticsImpl();
  return impl.trackEvent(eventName, params);
}

export async function trackScreen(screenName, params = {}) {
  const impl = await getAnalyticsImpl();
  return impl.trackScreen(screenName, params);
}

export async function setUserProperty(name, value) {
  const impl = await getAnalyticsImpl();
  return impl.setUserProperty(name, value);
}

export async function setUserId(userId) {
  const impl = await getAnalyticsImpl();
  return impl.setUserId ? impl.setUserId(userId) : Promise.resolve();
}

export function isAnalyticsSupported() {
  return isAnalyticsEnabled;
}
