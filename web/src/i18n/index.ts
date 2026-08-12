import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enUS from "@/i18n/locales/en-US";
import zhCN from "@/i18n/locales/zh-CN";
import zhTW from "@/i18n/locales/zh-TW";

export type AppLocale = "zh-CN" | "en-US" | "zh-TW";

const LOCALE_STORAGE_KEY = "lumen-canvas:locale";

i18n.use(initReactI18next).init({
    resources: {
        "zh-CN": { translation: zhCN },
        "en-US": { translation: enUS },
        "zh-TW": { translation: zhTW },
    },
    // v0.7.1 預設改繁中台灣（老蔡 user-correction）
    lng: (localStorage.getItem(LOCALE_STORAGE_KEY) as AppLocale) || "zh-TW",
    fallbackLng: "zh-TW",
    supportedLngs: ["zh-TW", "zh-CN", "en-US"],
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
});

export function changeAppLocale(locale: AppLocale) {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    return i18n.changeLanguage(locale);
}

export default i18n;
