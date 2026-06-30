import { NavLink } from "react-router-dom";
import { mobileNavItems } from "./moblieNav.data.js";
import { useAppContext } from "../../../context/user.context.jsx";
import { memo } from "react";

function MobileBottomBar() {
  const { schoolProfile } = useAppContext();

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

        md:hidden
      "
    >
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isProfileComplete = schoolProfile ? schoolProfile.isProfileComplete : true;
        const isDisabled = !isProfileComplete && item.path !== "/settings";

        return (
          <NavLink
            key={item.path}
            to={isDisabled ? "#" : item.path}
            onClick={(e) => {
              if (isDisabled) {
                e.preventDefault();
              }
            }}
            className={({ isActive }) =>
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
                  isDisabled
                    ? "opacity-40 cursor-not-allowed pointer-events-none"
                    : isActive
                      ? "text-blue-600"
                      : "text-slate-500"
                }
              `
            }
          >
            <Icon size={20} strokeWidth={2.2} />
            <span className="text-[11px] font-medium">{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}

export default memo(MobileBottomBar);
