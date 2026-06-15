import { SoundManager } from '../systems/SoundManager.js';

const isCrazyGamesSdkOnly =
  import.meta.env.VITE_PLATFORM === 'crazygames' &&
  import.meta.env.VITE_CG_SDK_ONLY === 'true';

let adManager = null;
let adManagerPromise = null;

async function getAdManager() {
  if (!isCrazyGamesSdkOnly) return null;

  if (adManager) return adManager;

  adManagerPromise ??= import('../../ads/AdManager.js')
    .then((module) => module.AdManager);

  adManager = await adManagerPromise;
  return adManager;
}

export async function bootCrazyGamesSdkOnly() {
  if (!isCrazyGamesSdkOnly) return false;

  try {
    SoundManager.setMuted(false);

    const manager = await getAdManager();
    manager.reportLoadingStart();
    await manager.init();
    manager.reportLoadingStop();
    return true;
  } catch (error) {
    console.warn('[CrazyGames] SDK-only boot failed', error);
    return false;
  }
}

export function reportCrazyGamesGameplayStart() {
  if (isCrazyGamesSdkOnly) {
    void getAdManager().then((manager) => manager?.reportGameplayStart());
  }
}

export function reportCrazyGamesGameplayStop() {
  if (isCrazyGamesSdkOnly) {
    void getAdManager().then((manager) => manager?.reportGameplayStop());
  }
}

export function reportCrazyGamesHappyTime() {
  if (isCrazyGamesSdkOnly) {
    void getAdManager().then((manager) => manager?.reportHappyTime());
  }
}
