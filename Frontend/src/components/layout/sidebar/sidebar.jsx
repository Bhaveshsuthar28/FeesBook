// src/components/layout/sidebar/sidebar.jsx

import {
  ChevronLeft,
  LogOut,
  NotebookText,
} from "lucide-react";

import {
  useUser,
  useClerk,
  SignOutButton,
} from "@clerk/clerk-react";

import {
  useState,
} from "react";

import Logo
  from "../../common/logo.components.jsx";

import SidebarItem
  from "./sidebarItems.jsx";

import {
  sidebarItems,
} from "./sidebar.data.js";

export default function Sidebar({

  isCollapsed,
  setIsCollapsed,

}) {

  const { user } =
    useUser();

  const {
    openUserProfile,
  } = useClerk();

  const [
    showLogoutPopup,

    setShowLogoutPopup,
  ] = useState(false);

  const expanded =
    !isCollapsed;

  return (
    <>

      <aside
        className={`
          hidden
          lg:flex

          fixed
          left-0
          top-0
          z-50

          h-screen

          flex-col
          justify-between

          bg-[#041C4A]

          px-4
          py-5

          transition-all
          duration-300

          ${
            expanded
              ? "w-[240px]"
              : "w-[85px]"
          }
        `}
      >

        <div
          className="
            flex
            flex-col

            gap-5
          "
        >

          <div
            className={`
              flex
              items-center

              ${
                expanded
                  ? "justify-between"
                  : "justify-center"
              }

              px-1
            `}
          >

            {
              expanded ? (

                <>

                  <Logo />

                  <button

                    onClick={() =>
                      setIsCollapsed(
                        true
                      )
                    }

                    className="
                      flex
                      items-center
                      justify-center

                      rounded-xl

                      p-2

                      text-white

                      hover:bg-slate-800
                    "
                  >

                    <ChevronLeft
                      size={20}
                    />

                  </button>

                </>

              ) : (

                <button

                  onClick={() =>
                    setIsCollapsed(
                      false
                    )
                  }

                  className="
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center

                    rounded-2xl
                  "
                >

                  <NotebookText
                    className="
                      h-8
                      w-8

                      text-blue-600
                    "
                  />

                </button>

              )
            }

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

            onClick={() =>
              openUserProfile()
            }

            className={`
              flex
              w-full
              items-center

              ${
                expanded
                  ? "gap-3 p-3 bg-slate-900"
                  : "justify-center"
              }

              rounded-xl
              

              transition-all
              duration-200

              hover:bg-slate-800
            `}
          >

            <img
              src={user?.imageUrl}

              alt="profile"

              className="
                h-11
                w-11

                rounded-full
                object-cover
              "
            />

            <div
              className={`
                overflow-hidden

                transition-all
                duration-200

                ${
                  expanded
                    ? "opacity-100"
                    : "opacity-0 w-0"
                }
              `}
            >

              <h3
                className="
                  whitespace-nowrap

                  text-sm
                  font-semibold

                  text-white
                "
              >
                {user?.fullName}
              </h3>

              <p
                className="
                  text-xs
                  text-slate-400
                "
              >
                Principal
              </p>

            </div>

          </button>

          <button

            onClick={() =>
              setShowLogoutPopup(
                true
              )
            }

            className={`
              flex
              w-full
              items-center

              ${
                expanded
                  ? "justify-center gap-2"
                  : "justify-center"
              }

              h-[52px]

              rounded-xl

              border
              border-slate-700

              text-white

              transition-all
              duration-200

              hover:bg-slate-800
            `}
          >

            <LogOut
              size={22}
            />

            <span
              className={`
                transition-all
                duration-200

                ${
                  expanded
                    ? "opacity-100"
                    : "opacity-0 w-0 overflow-hidden"
                }
              `}
            >
              Logout
            </span>

          </button>

        </div>

      </aside>

      {
        showLogoutPopup && (

          <div
            className="
              fixed
              inset-0
              z-[100]

              flex
              items-center
              justify-center

              bg-black/40
            "
          >

            <div
              className="
                w-[340px]

                rounded-3xl

                bg-white

                p-6
              "
            >

              <h2
                className="
                  mb-2

                  text-xl
                  font-semibold
                "
              >
                Confirm Logout
              </h2>

              <p
                className="
                  mb-6

                  text-sm
                  text-slate-600
                "
              >
                Are you sure you want to logout?
              </p>

              <div
                className="
                  flex
                  justify-end

                  gap-3
                "
              >

                <button

                  onClick={() =>
                    setShowLogoutPopup(
                      false
                    )
                  }

                  className="
                    rounded-xl

                    border

                    px-4
                    py-2
                  "
                >
                  Cancel
                </button>

                <SignOutButton>

                  <button
                    className="
                      rounded-xl

                      bg-red-500

                      px-4
                      py-2

                      text-white
                    "
                  >
                    Logout
                  </button>

                </SignOutButton>

              </div>

            </div>

          </div>
        )
      }

    </>
  );
}