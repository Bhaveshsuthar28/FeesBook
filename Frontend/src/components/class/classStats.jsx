// src/pages/classes/components/classStats.jsx

import {
  School,
  Users,
  IndianRupee,
  WalletCards,
} from "lucide-react";

export default function ClassStats({
  stats,
}) {

  const cards = [
    {
      title: "Total Classes",
      value: stats.totalClasses,
      subtitle: "Active classes",
      icon: School,
      iconBg: "bg-[#d2e5fc]",
      iconColor: "text-blue-600",
      bg: "bg-[#eef5fc] border-[#d2e5fc]/60"
    },
    {
      title: "Total Students",
      value: stats.totalStudents,
      subtitle: "Across all classes",
      icon: Users,
      iconBg: "bg-[#d3f4dd]",
      iconColor: "text-green-600",
      bg: "bg-[#ebfaf0] border-[#d3f4dd]/60"
    },
    {
      title: "Total Pending Fees",
      value: `₹${stats.totalPendingFees}`,
      subtitle: "Across all classes",
      icon: IndianRupee,
      iconBg: "bg-[#fee5cd]",
      iconColor: "text-orange-600",
      bg: "bg-[#fff8ed] border-[#fee5cd]/60"
    },
    {
      title: "Collected (This Month)",
      value: `₹${stats.totalCollectedFees}`,
      subtitle: "+18% from last month",
      icon: WalletCards,
      iconBg: "bg-[#ebdcfc]",
      iconColor: "text-purple-600",
      bg: "bg-[#fbf7fe] border-[#ebdcfc]/60"
    },
  ];

  return (
    <div
      className="
        grid
        grid-cols-2
        gap-3
        md:gap-4
        lg:grid-cols-4
      "
    >
      {
        cards.map(
          (item) => {
            const Icon = item.icon;
            const isCollected = item.title === "Collected (This Month)" || item.subtitle.startsWith("+");

            return (
              <div
                key={item.title}
                className={`
                  rounded-[24px]
                  border
                  ${item.bg}
                  p-4
                  md:p-5
                  shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]
                  transition-all
                  duration-300
                  hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.08)]
                  flex
                  items-center
                  gap-3
                  md:gap-4
                `}
              >
                <div
                  className={`
                    flex
                    h-12
                    w-12
                    md:h-14
                    md:w-14
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    ${item.iconBg}
                    transition-transform
                    duration-300
                    group-hover:scale-105
                  `}
                >
                  <Icon
                    size={22}
                    className={item.iconColor}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="
                      text-[11px]
                      md:text-xs
                      font-semibold
                      text-slate-500
                      tracking-wide
                    "
                  >
                    {item.title}
                  </p>

                  <h2
                    className="
                      mt-0.5
                      text-lg
                      md:text-2xl
                      font-bold
                      tracking-tight
                      text-slate-900
                    "
                  >
                    {item.value}
                  </h2>

                  <p
                    className={`
                      mt-0.5
                      text-[10px]
                      md:text-xs
                      font-bold
                      ${
                        isCollected
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }
                    `}
                  >
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          }
        )
      }
    </div>
  );
}
