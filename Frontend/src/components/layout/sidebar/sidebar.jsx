// src/components/layout/sidebar/sidebar.jsx

import {
  ChevronLeft,
  LogOut,
  LoaderCircle,
} from "lucide-react";

import { FaBook } from "react-icons/fa";

import {
  useUser,
  useClerk,
} from "@clerk/clerk-react";
import { useAppContext } from "../../../context/user.context.jsx";

import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";

import {
  useState,
  memo,
} from "react";

import { useNavigate } from "react-router-dom";

import Logo
  from "../../common/logo.components.jsx";

import SidebarItem
  from "./sidebarItems.jsx";

import {
  sidebarItems,
} from "./sidebar.data.js";

function Sidebar({

  isCollapsed,
  setIsCollapsed,

}) {
  const { t } = useAppContext();

  const { user } =
    useUser();

  const {
    openUserProfile,
    signOut,
  } = useClerk();

  const navigate = useNavigate();

  const [
    showLogoutPopup,

    setShowLogoutPopup,
  ] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogoutClick = async () => {
    setLoggingOut(true);
    setTimeout(async () => {
      try {
        await signOut();
      } catch (err) {
        console.error(err);
        setLoggingOut(false);
      }
    }, 1500);
  };

  const prefersReducedMotion =
    useReducedMotion();

  const expanded =
    !isCollapsed;

  const sidebarTransition =
    prefersReducedMotion
      ? {
          duration: 0,
        }
      : {
          type: "tween",
          ease: [
            0.25,
            0.1,
            0.25,
            1,
          ],
          duration: 0.38,
        };

  return (
    <>

      <motion.aside
        layout={false}
        initial={false}
        animate={{
          width:
            expanded
              ? 240
              : 85,
        }}
        transition={
          sidebarTransition
        }
        className="
          hidden
          overflow-hidden
          md:flex

          fixed
          left-0
          top-0
          z-50

          h-screen

          shrink-0

          flex-col
          justify-between

          bg-[#041C4A]

          px-3
          py-5
        "
      >

        <div
          className="
            flex
            flex-col

            gap-5
          "
        >

          <div className="flex items-center justify-between h-[56px] px-3">
            <div 
              onClick={() => !expanded && setIsCollapsed(false)}
              className={`flex items-center flex-1 ${!expanded ? "cursor-pointer" : ""}`}
            >
              <div className="flex h-10 w-10 items-center justify-center shrink-0">
                <FaBook className="h-6 w-6 text-blue-600" />
              </div>
              <span className={`
                ml-3
                whitespace-nowrap
                text-lg
                font-bold
                transition-all
                duration-300
                ease-out
                ${
                  expanded
                    ? "opacity-100"
                    : "w-0 overflow-hidden opacity-0 ml-0"
                }
              `}>
                <span className="text-blue-500">Fee</span>
                <span className="text-orange-500">Go</span>
              </span>
            </div>

            {expanded && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="flex items-center justify-center rounded-xl p-2 text-white hover:bg-slate-800 shrink-0"
              >
                <ChevronLeft size={20} />
              </button>
            )}
          </div>

          <nav
            className={`
              flex
              flex-col

              gap-1

              ${
                expanded
                  ? ""
                  : "items-center"
              }
            `}
          >

            {
              sidebarItems.map(
                (item) => (
                  <SidebarItem
                    key={item.path}
                    item={item}
                    expanded={expanded}
                  />
                )
              )
            }

          </nav>

        </div>

        <div
          className="
            border-t
            border-slate-800

            pt-4

            flex
            flex-col

            gap-3
          "
        >

          <button
            onClick={() => navigate("/profile")}
            className={`
              flex
              w-full
              items-center
              rounded-xl
              transition-all
              duration-300
              ease-out
              hover:bg-slate-800
              ${
                expanded
                  ? "gap-3 p-3 bg-[#02112e]"
                  : "pl-3 pr-0 justify-start h-[56px]"
              }
            `}
          >
            <div className="flex h-10 w-10 items-center justify-center shrink-0">
              <img
                src={user?.imageUrl}
                alt="profile"
                className="h-10 w-10 rounded-full object-cover"
              />
            </div>
            <div
              className={`
                transition-all
                duration-300
                ease-out
                ${
                  expanded
                    ? "opacity-100 ml-3"
                    : "opacity-0 w-0 overflow-hidden ml-0"
                }
              `}
            >
              <h3 className="whitespace-nowrap text-sm font-semibold text-white">
                {user?.fullName}
              </h3>
              <p className="text-xs text-slate-400 text-left">
                {t("principal")}
              </p>
            </div>
          </button>

          <button
            onClick={() => setShowLogoutPopup(true)}
            className={`
              flex
              w-full
              items-center
              h-[52px]
              rounded-xl
              border
              border-slate-700
              text-white
              transition-all
              duration-300
              ease-out
              hover:bg-slate-800
              ${
                expanded
                  ? "px-3 justify-start"
                  : "pl-3 pr-0 justify-start"
              }
            `}
          >
            <div className="flex h-10 w-10 items-center justify-center shrink-0">
              <LogOut size={22} />
            </div>
            <span
              className={`
                transition-all
                duration-300
                ease-out
                ${
                  expanded
                    ? "opacity-100 ml-3"
                    : "opacity-0 w-0 overflow-hidden ml-0"
                }
              `}
            >
              {t("logout")}
            </span>
          </button>

        </div>

      </motion.aside>

      <AnimatePresence>

        {
          showLogoutPopup && (

            <motion.div
              key="logout-overlay"
              role="presentation"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration:
                  prefersReducedMotion
                    ? 0
                    : 0.22,
              }}
              className="
                fixed
                inset-0
                z-[100]

                flex
                items-center
                justify-center

                bg-black/40
              "
              onClick={() =>
                setShowLogoutPopup(
                  false
                )
              }
            >

              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="sidebar-logout-title"
                initial={
                  prefersReducedMotion
                    ? false
                    : {
                        opacity: 0,
                        scale: 0.96,
                        y: 8,
                      }
                }
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={
                  prefersReducedMotion
                    ? {
                        opacity: 0,
                      }
                    : {
                        opacity: 0,
                        scale: 0.96,
                        y: 8,
                      }
                }
                transition={
                  prefersReducedMotion
                    ? {
                        duration: 0,
                      }
                    : {
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                        mass: 0.85,
                      }
                }
                onClick={(event) =>
                  event.stopPropagation()
                }
                className="
                  w-[340px]

                  rounded-3xl

                  bg-white

                  p-6
                "
              >

              <h2
                id="sidebar-logout-title"
                className="
                  mb-2

                  text-xl
                  font-semibold
                "
              >
                {t("confirmLogout") || "Confirm Logout"}
              </h2>

              <p
                className="
                  mb-6

                  text-sm
                  text-slate-600
                "
              >
                {t("logoutQuestion") || "Are you sure you want to logout?"}
              </p>

              <div
                className="
                  flex
                  justify-end

                  gap-3
                "
              >

                <button
                  disabled={loggingOut}
                  onClick={() => setShowLogoutPopup(false)}
                  className="rounded-xl border px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("cancel")}
                </button>

                <button
                  disabled={loggingOut}
                  onClick={handleLogoutClick}
                  className="rounded-xl bg-red-500 px-4 py-2 text-white flex items-center justify-center gap-2 min-w-[85px] disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loggingOut ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <span>{t("loggingOut") || "Logging out..."}</span>
                    </>
                  ) : (
                    t("logout")
                  )}
                </button>

              </div>

              </motion.div>

            </motion.div>
          )
        }

      </AnimatePresence>

    </>
  );
}

export default memo(Sidebar);
