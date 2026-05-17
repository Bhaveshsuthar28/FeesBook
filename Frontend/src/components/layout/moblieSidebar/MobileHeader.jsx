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

import {
  LogOut,
  User,
  X,
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

  return (
    <>

      <header
        className="
          sticky
          top-0
          z-40

          flex
          h-[64px]
          items-center
          justify-between

          border-b
          border-slate-200

          bg-white

          px-4

          lg:hidden
        "
      >

        <Logo />

        <div
          className="
            relative
          "
        >

          <button

            onClick={() =>
              setShowProfileMenu(
                !showProfileMenu
              )
            }
          >

            <img
              src={user?.imageUrl}

              alt="profile"

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

      </header>

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

              lg:hidden
            "
          >

            <div
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