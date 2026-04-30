'use client';

import { useLanguage } from '@/context/LanguageContext';
import { getNestedValue } from '@/utils/I18n';
import fr from '@/locales/fr.json';
import en from '@/locales/en.json';

const translations = { fr, en };

export function useTranslation() {
  const { locale } = useLanguage();

  const t = (key, fallback = null) => {
    let value = getNestedValue(translations[locale], key);

    if (value === undefined) {
      value = getNestedValue(translations.fr, key);
    }

    if (value === undefined) {
      return fallback !== null ? fallback : key;
    }

    return value;
  };

  return { t, locale };
}