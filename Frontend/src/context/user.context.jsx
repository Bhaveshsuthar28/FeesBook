import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { getSchoolProfile, updateSchoolProfile } from "../lib/api/settingsapi.js";
import { translations, translateDatabaseText } from "../lib/translations.js";
import i18n from "i18next";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { user, isSignedIn } = useUser();

  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem("feego_lang");
    return saved === "hi" ? "hi" : "en";
  });

  // Sync initial language with i18next
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  const setLanguage = useCallback(async (lang) => {
    const valid = lang === "hi" ? "hi" : "en";
    setLanguageState(valid);
    localStorage.setItem("feego_lang", valid);
    i18n.changeLanguage(valid);

    try {
      await updateSchoolProfile({ language: valid });
    } catch (err) {
      console.error("Failed to sync language to database", err);
    }
  }, []);

  const t = useCallback((key) => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || key;
  }, [language]);

  const tDb = useCallback((text) => {
    return translateDatabaseText(text, language);
  }, [language]);

  const refreshSchoolProfile = useCallback(async () => {
    try {
      const profile = await getSchoolProfile();
      setSchoolProfile(profile);
      if (profile?.language) {
        const dbLang = profile.language === "hi" ? "hi" : "en";
        setLanguageState(dbLang);
        localStorage.setItem("feego_lang", dbLang);
        i18n.changeLanguage(dbLang);
      }
    } catch {
      // Profile not available yet
      setSchoolProfile(null);
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      refreshSchoolProfile();
      if (user) {
        const email = user.primaryEmailAddress?.emailAddress;
        const isGoogle = user.externalAccounts?.some(acc => acc.provider === "google") || false;
        localStorage.setItem("feego_last_login", JSON.stringify({
          email,
          method: isGoogle ? "Google" : "Email",
          avatarUrl: user.imageUrl,
          name: user.fullName
        }));
      }
    } else {
      setSchoolProfile(null);
    }
  }, [isSignedIn, user, refreshSchoolProfile]);

  // Dynamic title
  useEffect(() => {
    const schoolName = schoolProfile?.schoolName;
    const principalName = user?.fullName;

    if (schoolName) {
      document.title = `${schoolName} | FeeGo`;
    } else if (principalName) {
      document.title = `${principalName} | FeeGo`;
    } else {
      document.title = "FeeGo";
    }
  }, [schoolProfile?.schoolName, user?.fullName]);

  // Dynamic favicon from school logo
  useEffect(() => {
    const logoUrl = schoolProfile?.logoUrl;
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    if (logoUrl) {
      link.href = logoUrl;
      link.type = "image/png";
    } else {
      link.href = "/Logo.png";
      link.type = "image/png";
    }
  }, [schoolProfile?.logoUrl]);

  const [contactOpen, setContactOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const value = useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen,
      schoolProfile,
      refreshSchoolProfile,
      contactOpen,
      setContactOpen,
      helpOpen,
      setHelpOpen,
      language,
      setLanguage,
      t,
      profileLoaded,
      tDb,
    }),
    [sidebarOpen, schoolProfile, refreshSchoolProfile, contactOpen, helpOpen, language, setLanguage, t, profileLoaded, tDb]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);