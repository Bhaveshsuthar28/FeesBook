import {
  NavLink,
} from "react-router-dom";
import { useAppContext } from "../../../context/user.context.jsx";
import { memo } from "react";

function SidebarItem({
  item,
  expanded,
}) {
  const { schoolProfile, t } = useAppContext();
  const Icon = item.icon;
  const isProfileComplete = schoolProfile ? schoolProfile.isProfileComplete : true;
  const isDisabled = !isProfileComplete && item.path !== "/settings";

  return (
    <NavLink
      to={isDisabled ? "#" : item.path}
      onClick={(e) => {
        if (isDisabled) {
          e.preventDefault();
        }
      }}
      className={({ isActive }) =>
        `
          flex
          items-center

          ${
            expanded
              ? "justify-start px-3"
              : "justify-start pl-3 pr-0"
          }

          h-[56px]
          w-full

          rounded-2xl

          transition-all
          duration-300
          ease-out

          ${
            isDisabled
              ? "opacity-40 cursor-not-allowed pointer-events-none"
              : isActive
                ? "bg-blue-600 text-white"
                : "text-slate-200 hover:bg-slate-800"
          }
        `
      }
    >

      <div
        className="
          flex
          h-10
          w-10
          items-center
          justify-center

          shrink-0
        "
      >

        <Icon
          size={24}
          strokeWidth={2.2}
        />

      </div>

      <span
        className={`
          whitespace-nowrap

          text-[15px]
          font-medium

          transition-all
          duration-300
          ease-out

          ${
            expanded
              ? "ml-3 opacity-100"
              : "ml-0 w-0 overflow-hidden opacity-0"
          }
        `}
      >
        {t(item.label.toLowerCase())}
      </span>

    </NavLink>
  );
}

export default memo(SidebarItem);