// src/components/layout/mobile/mobileBottomBar.jsx

import {
  NavLink,
} from "react-router-dom";

import {
  mobileNavItems,
} from "./moblieNav.data.js";

export default function MobileBottomBar() {

  return (
    <div
      className="
        fixed
        bottom-0
        left-0
        z-50

        flex
        h-[70px]
        w-full

        items-center
        justify-around

        border-t
        border-slate-200

        bg-white

        px-2

        lg:hidden
      "
    >

      {
        mobileNavItems.map(
          (item) => {

            const Icon =
              item.icon;

            return (
              <NavLink
                key={item.path}

                to={item.path}

                className={({
                  isActive,
                }) =>
                  `
                    flex
                    flex-col
                    items-center
                    justify-center

                    gap-1

                    rounded-xl

                    px-3
                    py-2

                    transition-all
                    duration-200

                    ${
                      isActive
                        ? "text-blue-600"
                        : "text-slate-500"
                    }
                  `
                }
              >

                <Icon
                  size={20}
                  strokeWidth={2.2}
                />

                <span
                  className="
                    text-[11px]
                    font-medium
                  "
                >
                  {item.label}
                </span>

              </NavLink>
            );
          }
        )
      }

    </div>
  );
}