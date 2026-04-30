'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    const [locale, setLocale] = useState('fr');
    const [loading, setLoading] = useState(true);

    const changeLocale = (newLocale) => {
        if (!['fr', 'en'].includes(newLocale)) return;

        setLocale(newLocale);
        localStorage.setItem('locale', newLocale);
        document.documentElement.lang = newLocale;

    };

    useEffect(() => {
        const savedLocale = localStorage.getItem('locale');

        if (savedLocale && ['fr', 'en'].includes(savedLocale)) {
            setLocale(savedLocale);
            document.documentElement.lang = savedLocale;
        } else {
            const browserLang = navigator.language.startsWith('en') ? 'en' : 'fr';
            setLocale(browserLang);
            document.documentElement.lang = browserLang;
            localStorage.setItem('locale', browserLang);
        }

        setLoading(false);
    }, []);

    return (
        <LanguageContext.Provider value={{ locale, loading, changeLocale }}>
            {children}
        </LanguageContext.Provider>
    );
};

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
}