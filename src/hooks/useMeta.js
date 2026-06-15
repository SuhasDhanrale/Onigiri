import { useState, useRef, useEffect } from 'react';
import { readStorageJson, writeStorageJson } from '../platforms/gameStorage.js';
import { WALL_LEVELS } from '../config/walls.js';

const META_STORAGE_KEY = 'onigiri_meta_v1';

const DEFAULT_META = {
    honor: 0,
    unlockedProvisions: [],
    equippedItem: null,
    conqueredRegions: [],
    totalRuns: 0,
    unlockedBarracks: ['HATAMOTO', 'YUMI'],
    focusMult: 1.2,
    wallLevel: 0
};

function normalizeStringArray(value, fallback = []) {
  return Array.isArray(value)
    ? value.filter(item => typeof item === 'string')
    : fallback;
}

function normalizeSavedMeta(value) {
  if (!value || typeof value !== 'object') return { ...DEFAULT_META };

  return {
    ...DEFAULT_META,
    honor: Number.isFinite(value.honor) ? value.honor : DEFAULT_META.honor,
    unlockedProvisions: normalizeStringArray(value.unlockedProvisions, DEFAULT_META.unlockedProvisions),
    equippedItem: typeof value.equippedItem === 'string' ? value.equippedItem : null,
    conqueredRegions: normalizeStringArray(value.conqueredRegions, DEFAULT_META.conqueredRegions),
    totalRuns: Number.isFinite(value.totalRuns) ? value.totalRuns : DEFAULT_META.totalRuns,
    unlockedBarracks: normalizeStringArray(value.unlockedBarracks, DEFAULT_META.unlockedBarracks),
    focusMult: Number.isFinite(value.focusMult) ? value.focusMult : DEFAULT_META.focusMult,
    wallLevel: Number.isInteger(value.wallLevel)
      ? Math.min(Math.max(value.wallLevel, 0), WALL_LEVELS.length - 1)
      : DEFAULT_META.wallLevel,
  };
}

function readStoredMeta() {
  return normalizeSavedMeta(readStorageJson(META_STORAGE_KEY, DEFAULT_META));
}

function toPersistedMeta(meta) {
  return normalizeSavedMeta(meta);
}

export function useMeta() {
  const [meta, setMeta] = useState(readStoredMeta);
  
  const metaRef = useRef(meta);
  
  useEffect(() => { 
      metaRef.current = meta; 
  }, [meta]);

  useEffect(() => {
      writeStorageJson(META_STORAGE_KEY, toPersistedMeta(meta));
  }, [meta]);

  return { meta, setMeta, metaRef };
}
