import { useCallback, useEffect, useMemo, useState } from 'react';
import { detectLocale, LOCALE_STORAGE_KEY, setActiveLocale, translateText } from './i18n.js';
import { LocalizationContext } from './LocalizationContext.js';

const originalText = new WeakMap();
const renderedText = new WeakMap();
const originalAttributes = new WeakMap();
const LOCALIZED_ATTRIBUTES = ['aria-label', 'placeholder', 'title'];

const isIgnored = node => node.parentElement?.closest('[data-no-i18n], script, style');

function localizeTextNode(node, locale) {
  if (!node.nodeValue?.trim() || isIgnored(node)) return;
  const previousRender = renderedText.get(node);
  if (!originalText.has(node) || (previousRender != null && node.nodeValue !== previousRender)) {
    originalText.set(node, node.nodeValue);
  }
  const translated = translateText(originalText.get(node), locale);
  renderedText.set(node, translated);
  if (node.nodeValue !== translated) node.nodeValue = translated;
}

function localizeElement(element, locale) {
  if (element.closest?.('[data-no-i18n]')) return;
  const originals = originalAttributes.get(element) ?? {};
  for (const attribute of LOCALIZED_ATTRIBUTES) {
    if (!element.hasAttribute?.(attribute)) continue;
    const current = element.getAttribute(attribute);
    if (!(attribute in originals)) originals[attribute] = current;
    element.setAttribute(attribute, translateText(originals[attribute], locale));
  }
  originalAttributes.set(element, originals);
}

function localizeTree(root, locale) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    localizeTextNode(root, locale);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) localizeElement(root, locale);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) localizeTextNode(node, locale);
    else localizeElement(node, locale);
    node = walker.nextNode();
  }
}

export function LocalizationProvider({ children }) {
  const [locale, updateLocale] = useState(detectLocale);

  const setLocale = useCallback((nextLocale) => {
    updateLocale(nextLocale);
    try { window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale); } catch { /* optional */ }
  }, []);

  useEffect(() => {
    setActiveLocale(locale);
    const root = document.getElementById('root');
    localizeTree(root, locale);
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') localizeTextNode(mutation.target, locale);
        mutation.addedNodes.forEach(node => localizeTree(node, locale));
      }
    });
    observer.observe(root, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [locale]);

  const t = useCallback(value => translateText(value, locale), [locale]);
  const context = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <LocalizationContext.Provider value={context}>
      {children}
    </LocalizationContext.Provider>
  );
}
