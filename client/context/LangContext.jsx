import React, { createContext, useContext, useState } from 'react';
import fr from '../i18n/fr.json';
import en from '../i18n/en.json';

const translations = { fr, en };

const LangContext = createContext();

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState('fr');

  const t = (key) => {
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) {
      val = val?.[k];
    }
    return val || key;
  };

  const toggleLang = () => setLang(prev => prev === 'fr' ? 'en' : 'fr');

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
