import { Languages } from 'lucide-react';
import { useLocalization } from './LocalizationContext.js';
import { SUPPORTED_LOCALES } from './translations.js';

export function LanguageSelector() {
  const { locale, setLocale } = useLocalization();

  return (
    <label
      data-no-i18n
      className="absolute right-5 top-5 z-20 flex items-center gap-2 rounded border border-[#dfd4ba]/30 bg-[#1b1918]/80 px-2 py-1.5 text-[#dfd4ba] shadow-lg backdrop-blur-sm"
    >
      <Languages size={15} aria-hidden="true" />
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={event => setLocale(event.target.value)}
        aria-label="Language"
        className="cursor-pointer bg-transparent text-xs font-bold outline-none"
      >
        {SUPPORTED_LOCALES.map(option => (
          <option key={option.code} value={option.code} className="bg-[#1b1918] text-[#dfd4ba]">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
