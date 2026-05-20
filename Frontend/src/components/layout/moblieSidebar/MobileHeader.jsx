import {
  useUser,
  useClerk,
  SignOutButton,
} from "@clerk/clerk-react";

import {
  useState,
} from "react";

import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";

import Logo
  from "../../common/logo.components.jsx";

import {
  LogOut,
  User,
} from "lucide-react";

export default function MobileHeader() {

  const { user } =
    useUser();

  const {
    openUserProfile,
  } = useClerk();

  const [
    showProfileMenu,

    setShowProfileMenu,
  ] = useState(false);

  const [
    showLogoutPopup,

    setShowLogoutPopup,
  ] = useState(false);

  const prefersReducedMotion =
    useReducedMotion();

  return (
    <>

      <header
        className="
          sticky
          top-0
          z-40

          relative

          flex
          h-[64px]
          items-center
          justify-center

          border-b
          border-slate-200

          bg-white

          px-4

          md:hidden
        "
      >

        <div
          className="
            flex
            justify-center
          "
        >

          <Logo />

        </div>

        <div
          className="
            absolute
            right-4
            top-1/2
            -translate-y-1/2
          "
        >

          <div
            className="
              relative
            "
          >

            <button

              type="button"

              onClick={() =>
                setShowProfileMenu(
                  !showProfileMenu
                )
              }
            >

              <img
                src={user?.imageUrl}

                alt="Account"

                className="
                  h-10
                  w-10

                  rounded-full
                  object-cover
                "
              />

            </button>

            {
              showProfileMenu && (

                <div
                  className="
                    absolute
                    right-0
                    top-14

                    z-50

                    w-[180px]

                    rounded-2xl

                    border
                    border-slate-200

                    bg-white

                    p-2

                    shadow-lg
                  "
                >

                  <button

                    type="button"

                    onClick={() => {

                      openUserProfile();

                      setShowProfileMenu(
                        false
                      );
                    }}

                    className="
                      flex
                      w-full
                      items-center

                      gap-3

                      rounded-xl

                      px-3
                      py-3

                      text-sm
                      font-medium

                      hover:bg-slate-100
                    "
                  >

                    <User
                      size={18}
                    />

                    Profile

                  </button>

                  <button

                    type="button"

                    onClick={() => {

                      setShowProfileMenu(
                        false
                      );

                      setShowLogoutPopup(
                        true
                      );
                    }}

                    className="
                      flex
                      w-full
                      items-center

                      gap-3

                      rounded-xl

                      px-3
                      py-3

                      text-sm
                      font-medium

                      text-red-500

                      hover:bg-red-50
                    "
                  >

                    <LogOut
                      size={18}
                    />

                    Logout

                  </button>

                </div>
              )
            }

          </div>

        </div>

      </header>

      <AnimatePresence>

        {
          showLogoutPopup && (

            <motion.div
              key="mobile-logout-overlay"
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

                md:hidden
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
                aria-labelledby="mobile-logout-title"
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
                  w-[320px]

                  rounded-3xl

                  bg-white

                  p-6
                "
              >

              <div
                className="
                  mb-4

                  flex
                  items-center
                  justify-between
                "
              >

                <h2
                  id="mobile-logout-title"
                  className="
                    text-lg
                    font-semibold
                  "
                >
                  Confirm Logout
                </h2>

              </div>

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

                  type="button"

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
                    type="button"
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

              </motion.div>

            </motion.div>
          )
        }

      </AnimatePresence>

    </>
  );
}
