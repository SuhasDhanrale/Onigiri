import { SoundManager } from '../systems/SoundManager.js';

const isCrazyGamesPlatform = import.meta.env.VITE_PLATFORM === 'crazygames';
const isCrazyGamesSdkOnly = isCrazyGamesPlatform && import.meta.env.VITE_CG_SDK_ONLY === 'true';
const shouldBootCrazyGamesSdk =
  isCrazyGamesPlatform &&
  (isCrazyGamesSdkOnly || import.meta.env.VITE_ENABLE_ADS === 'true');

let adManager = null;
let adManagerPromise = null;

async function getAdManager() {
  if (!shouldBootCrazyGamesSdk) return null;

  if (adManager) return adManager;

  adManagerPromise ??= import('../../ads/AdManager.js')
    .then((module) => module.AdManager);

  adManager = await adManagerPromise;
  return adManager;
}

export async function bootCrazyGamesSdk() {
  if (!shouldBootCrazyGamesSdk) return false;

  try {
    SoundManager.setMuted(false);

    const manager = await getAdManager();
    manager.reportLoadingStart();
    await manager.init();
    manager.reportLoadingStop();
    return true;
  } catch (error) {
    console.warn('[CrazyGames] SDK boot failed', error);
    return false;
  }
}

export function reportCrazyGamesGameplayStart() {
  if (shouldBootCrazyGamesSdk) {
    void getAdManager().then((manager) => manager?.reportGameplayStart());
  }
}

export function reportCrazyGamesGameplayStop() {
  if (shouldBootCrazyGamesSdk) {
    void getAdManager().then((manager) => manager?.reportGameplayStop());
  }
}

export function reportCrazyGamesHappyTime() {
  if (shouldBootCrazyGamesSdk) {
    void getAdManager().then((manager) => manager?.reportHappyTime());
  }
}
