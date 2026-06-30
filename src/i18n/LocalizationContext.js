import { createContext, useContext } from 'react';

export const LocalizationContext = createContext({
  locale: 'en',
  setLocale: () => {},
  t: value => value,
});

export const useLocalization = () => useContext(LocalizationContext);

