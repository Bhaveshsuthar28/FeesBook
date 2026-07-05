import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { translations } from "./translations.js";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: translations.en,
      },
      hi: {
        translation: translations.hi,
      },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already safe from xss
    },
  });

export default i18n;
