import { PHRASES, SUPPORTED_LOCALES } from './translations.js';

export const LOCALE_STORAGE_KEY = 'onigiri_locale';
const localeCodes = new Set(SUPPORTED_LOCALES.map(({ code }) => code));
let activeLocale = 'en';

const normalizeLocale = (value = '') => {
  const locale = String(value).toLowerCase();
  if (locale.startsWith('ja')) return 'ja';
  if (locale.startsWith('zh')) return 'zh-CN';
  if (locale.startsWith('ko')) return 'ko';
  if (locale.startsWith('pt')) return 'pt-BR';
  return 'en';
};

export function detectLocale() {
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && localeCodes.has(saved)) return saved;
  } catch { /* Storage can be unavailable in embedded builds. */ }

  const candidates = typeof navigator === 'undefined'
    ? []
    : [...(navigator.languages ?? []), navigator.language];
  return normalizeLocale(candidates.find(Boolean));
}

export function setActiveLocale(locale) {
  activeLocale = localeCodes.has(locale) ? locale : 'en';
  if (typeof document !== 'undefined') document.documentElement.lang = activeLocale;
}

export function getActiveLocale() {
  return activeLocale;
}

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactPhrases = new Map(
  Object.entries(PHRASES).map(([english, translations]) => [english.toLocaleLowerCase('en-US'), translations])
);
const phraseEntries = Object.entries(PHRASES)
  .sort(([a], [b]) => b.length - a.length)
  .map(([english, translations]) => {
    const boundaryStart = /^[\p{L}\p{N}]/u.test(english) ? '(?<![\\p{L}\\p{N}_])' : '';
    const boundaryEnd = /[\p{L}\p{N}]$/u.test(english) ? '(?![\\p{L}\\p{N}_])' : '';
    return {
      matcher: new RegExp(`${boundaryStart}${escapeRegExp(english)}${boundaryEnd}`, 'giu'),
      translations,
    };
  });
const translationCache = new Map();
const MAX_CACHE_ENTRIES = 2000;

export function translateText(value, locale = activeLocale) {
  if (locale === 'en' || value == null) return String(value ?? '');
  const source = String(value);
  const cacheKey = `${locale}\u0000${source}`;
  const cached = translationCache.get(cacheKey);
  if (cached != null) return cached;

  const exact = exactPhrases.get(source.trim().toLocaleLowerCase('en-US'))?.[locale];
  if (exact) return source.replace(source.trim(), exact);

  let result = source;
  for (const { matcher, translations } of phraseEntries) {
    const translated = translations[locale];
    if (!translated) continue;
    result = result.replace(matcher, translated);
  }

  if (translationCache.size >= MAX_CACHE_ENTRIES) translationCache.clear();
  translationCache.set(cacheKey, result);
  return result;
}
