import {
  NavLink,
} from "react-router-dom";

export default function SidebarItem({
  item,
  expanded,
}) {

  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}

      className={({ isActive }) =>
        `
          flex
          items-center

          ${
            expanded
              ? "justify-start px-4"
              : "justify-center px-0"
          }

          h-[56px]
          w-full

          rounded-2xl

          transition-all
          duration-300
          ease-out

          ${
            isActive
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
        {item.label}
      </span>

    </NavLink>
  );
}