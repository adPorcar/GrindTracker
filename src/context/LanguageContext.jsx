import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

const STORAGE_LANG_KEY = 'grind_tracker_lang';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved === 'es' || saved === 'en') return saved;
      // Detect browser language
      const navLang = navigator.language || navigator.userLanguage || '';
      return navLang.toLowerCase().startsWith('en') ? 'en' : 'es';
    } catch {
      return 'es';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LANG_KEY, language);
      document.documentElement.lang = language;
    } catch (e) {
      console.warn('Could not save language preference:', e);
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'es' ? 'en' : 'es'));
  };

  /**
   * Helper translation function t(key, params)
   */
  const t = (key, params = {}) => {
    const langDict = translations[language] || translations.es;
    let text = langDict[key] || translations.es[key] || key;

    // Replace {placeholder} with params
    Object.keys(params).forEach(p => {
      text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
