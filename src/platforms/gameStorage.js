const isCrazyGamesBuild = import.meta.env.VITE_PLATFORM === 'crazygames';

function getLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

function getCrazyGamesDataStorage() {
  if (!isCrazyGamesBuild || typeof window === 'undefined') return null;

  const data = window.CrazyGames?.SDK?.data;
  if (
    data &&
    typeof data.getItem === 'function' &&
    typeof data.setItem === 'function' &&
    typeof data.removeItem === 'function'
  ) {
    return data;
  }

  return null;
}

function readLocalStorageItem(key) {
  const localStorage = getLocalStorage();
  if (!localStorage) return null;

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readStorageItem(key) {
  const dataStorage = getCrazyGamesDataStorage();

  if (dataStorage) {
    try {
      const value = dataStorage.getItem(key);
      if (value !== null && value !== undefined) return value;

      const migratedValue = readLocalStorageItem(key);
      if (migratedValue !== null && migratedValue !== undefined) {
        dataStorage.setItem(key, migratedValue);
        return migratedValue;
      }

      return null;
    } catch (error) {
      console.warn('[Storage] CrazyGames data read failed, falling back to localStorage', error);
    }
  }

  return readLocalStorageItem(key);
}

export function writeStorageItem(key, value) {
  const dataStorage = getCrazyGamesDataStorage();

  if (dataStorage) {
    try {
      dataStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('[Storage] CrazyGames data write failed, falling back to localStorage', error);
    }
  }

  const localStorage = getLocalStorage();
  if (!localStorage) return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorageItem(key) {
  const dataStorage = getCrazyGamesDataStorage();

  if (dataStorage) {
    try {
      dataStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('[Storage] CrazyGames data remove failed, falling back to localStorage', error);
    }
  }

  const localStorage = getLocalStorage();
  if (!localStorage) return false;

  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readStorageJson(key, fallback) {
  const raw = readStorageItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStorageJson(key, value) {
  try {
    return writeStorageItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export function isUsingCrazyGamesDataStorage() {
  return !!getCrazyGamesDataStorage();
}
