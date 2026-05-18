// src/layouts/DashboardLayout.jsx

import {
  Outlet,
} from "react-router-dom";

import {
  useState,
} from "react";

import Sidebar
  from "../components/layout/sidebar/sidebar.jsx";

import MobileHeader
  from "../components/layout/moblieSidebar/MobileHeader.jsx";

import MobileBottomBar
  from "../components/layout/moblieSidebar/mobileBottomBar.jsx";

export default function DashboardLayout() {

  const [
    isCollapsed,

    setIsCollapsed,
  ] = useState(false);

  const [
    isMobileSidebarOpen,

    setIsMobileSidebarOpen,
  ] = useState(false);

  return (
    <div
      className="
        min-h-screen
        bg-slate-100
      "
    >

      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <MobileHeader
        setIsMobileSidebarOpen={
          setIsMobileSidebarOpen
        }
      />

      <main
        className={`
          min-h-screen

          px-4
          py-4

          pb-[90px]

          transition-all
          duration-300

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
