import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr', // French as default language
    debug: false, // Set to true for development debugging
    
    // Language detection options
    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Look for language in localStorage
      lookupLocalStorage: 'i18nextLng',
      
      // Cache user language
      caches: ['localStorage'],
    },
    
    // Backend configuration for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    // Supported languages
    supportedLngs: ['fr', 'en'],
  });

export default i18n;

