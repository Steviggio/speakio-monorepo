'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from './en.json';
import fr from './fr.json';

export type Locale = 'en' | 'fr';

const translations: Record<Locale, Record<string, any>> = { en, fr };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => { },
  t: (key: string) => key,
});

/**
 * Resolve a dot-separated key like "nav.resources" from a nested object.
 */
function resolve(obj: Record<string, any>, path: string): string {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return path;
    current = current[part];
  }
  return typeof current === 'string' ? current : path;
}

// Provides locale state and translation function, persists preference in localStorage.
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {

    try {
      const prefs = localStorage.getItem('speakio_preferences');
      if (prefs) {
        const parsed = JSON.parse(prefs);
        if (parsed.interfaceLang && translations[parsed.interfaceLang as Locale]) {
          setLocaleState(parsed.interfaceLang as Locale);
        }
      }
    } catch { /* */ }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);

    try {
      const prefs = JSON.parse(localStorage.getItem('speakio_preferences') || '{}');
      prefs.interfaceLang = newLocale;
      localStorage.setItem('speakio_preferences', JSON.stringify(prefs));
    } catch { /* */ }
  }, []);

  const t = useCallback((key: string): string => {
    return resolve(translations[locale], key);
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// Returns the current locale, setLocale function, and t() translation helper.
export function useTranslation() {
  return useContext(I18nContext);
}
