/**
 * No-op analytics implementation (default when VITE_ENABLE_ANALYTICS !== 'true')
 * All functions are stubs that do nothing and return safe defaults.
 */

/**
 * Track a custom event.
 * @param {string} eventName - Name of the event (e.g., 'level_complete', 'item_purchased')
 * @param {Object} params - Event parameters
 * @returns {Promise<void>}
 */
export async function trackEvent(eventName, params = {}) {
  console.debug('[Analytics] Noop: trackEvent()', eventName, params);
  return Promise.resolve();
}

/**
 * Track a screen view.
 * @param {string} screenName - Name of the screen (e.g., 'MainMenu', 'Battle')
 * @param {Object} params - Additional parameters
 * @returns {Promise<void>}
 */
export async function trackScreen(screenName, params = {}) {
  console.debug('[Analytics] Noop: trackScreen()', screenName, params);
  return Promise.resolve();
}

/**
 * Set a user property.
 * @param {string} name - Property name (e.g., 'player_level', 'platform')
 * @param {string} value - Property value
 * @returns {Promise<void>}
 */
export async function setUserProperty(name, value) {
  console.debug('[Analytics] Noop: setUserProperty()', name, value);
  return Promise.resolve();
}

/**
 * Set the user ID for analytics.
 * @param {string} userId - Unique user identifier
 * @returns {Promise<void>}
 */
export async function setUserId(userId) {
  console.debug('[Analytics] Noop: setUserId()', userId);
  return Promise.resolve();
}
