import { createContext, useContext, useState, useEffect, useCallback } from "react";
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
    } else {
      setSchoolProfile(null);
    }
  }, [isSignedIn, refreshSchoolProfile]);

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

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        schoolProfile,
        refreshSchoolProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);