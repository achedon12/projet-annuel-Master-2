'use client';

import { useLanguage } from '@/context/LanguageContext';
import { getNestedValue } from '@/utils/I18n';
import fr from '@/locales/fr.json';
import en from '@/locales/en.json';

const translations = { fr, en };

const interpolate = (value, params) => {
    if (typeof value !== 'string' || !params) return value;
    return value.replace(/\{(\w+)\}/g, (match, key) =>
        params[key] !== undefined && params[key] !== null ? String(params[key]) : match
    );
};

export function useTranslation() {
    const { locale } = useLanguage();

    const t = (key, paramsOrFallback = null, maybeFallback = null) => {
        const isParams = paramsOrFallback && typeof paramsOrFallback === 'object';
        const params = isParams ? paramsOrFallback : null;
        const fallback = isParams ? maybeFallback : paramsOrFallback;

        let value = getNestedValue(translations[locale], key);

        if (value === undefined) {
            value = getNestedValue(translations.fr, key);
        }

        if (value === undefined) {
            return fallback !== null ? fallback : key;
        }

        return interpolate(value, params);
    };

    return { t, locale };
}
