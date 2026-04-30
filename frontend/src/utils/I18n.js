// utils/i18n.ts (ajoute cette fonction utilitaire)
import enMessages from '@/locales/en.json';
import frMessages from '@/locales/fr.json';

export const defaultLocale = 'fr';
export const locales = ['fr', 'en'];

export const messages = {
  en: enMessages,
  fr: frMessages,
};

export const getMessages = (locale) => {
  return messages[locale] || messages[defaultLocale];
};

export const getNestedValue = (obj, path) => {
  if (!obj) return undefined;

  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return undefined;
    }
  }

  return result;
};