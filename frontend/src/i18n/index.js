import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.js';
import he from './he.js';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
