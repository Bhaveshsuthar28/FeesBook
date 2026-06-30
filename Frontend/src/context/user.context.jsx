import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { getSchoolProfile } from "../lib/api/settingsapi.js";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const { user, isSignedIn } = useUser();

  const refreshSchoolProfile = useCallback(async () => {
    try {
      const profile = await getSchoolProfile();
      setSchoolProfile(profile);
    } catch {
      // Profile not available yet
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      refreshSchoolProfile();
      if (user) {
        const email = user.primaryEmailAddress?.emailAddress;
        const isGoogle = user.externalAccounts?.some(acc => acc.provider === "google") || false;
        localStorage.setItem("feesbook_last_login", JSON.stringify({
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
      document.title = `${schoolName} | FeesBook`;
    } else if (principalName) {
      document.title = `${principalName} | FeesBook`;
    } else {
      document.title = "FeesBook";
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

  const value = useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen,
      schoolProfile,
      refreshSchoolProfile,
    }),
    [sidebarOpen, schoolProfile, refreshSchoolProfile]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);