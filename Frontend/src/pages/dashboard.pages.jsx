// src/layouts/DashboardLayout.jsx

import {
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  useState,
  useEffect,
} from "react";

import {
  useReducedMotion,
} from "framer-motion";

import Sidebar
  from "../components/layout/sidebar/sidebar.jsx";

import MobileHeader
  from "../components/layout/moblieSidebar/MobileHeader.jsx";

import MobileBottomBar
  from "../components/layout/moblieSidebar/mobileBottomBar.jsx";

import { useAppContext } from "../context/user.context.jsx";

export default function DashboardLayout() {
  const { schoolProfile, profileLoaded } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (profileLoaded) {
      if (!schoolProfile || !schoolProfile.isProfileComplete) {
        if (location.pathname !== "/settings") {
          navigate("/settings", { replace: true });
        }
      }
    }
  }, [schoolProfile, profileLoaded, location.pathname, navigate]);

  const [
    isCollapsed,

    setIsCollapsed,
  ] = useState(false);

  const prefersReducedMotion =
    useReducedMotion();

  return (
    <div
      className="
        min-h-screen
        bg-[#F8F9FA]
      "
    >

      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <MobileHeader />

      <main
        className={`
          min-h-screen

          px-4
          py-4

          pb-[90px]

          md:pb-6

          ${
            prefersReducedMotion
              ? ""
              : "transition-[margin] duration-[380ms] ease-out"
          }

          ${
            isCollapsed
              ? "md:ml-[85px]"
              : "md:ml-[240px]"
          }
        `}
      >

        <Outlet />

      </main>

      <MobileBottomBar />

    </div>
  );
}
