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
      value:
        stats.totalClasses,

      subtitle:
        "Active classes",

      icon:
        School,

      iconBg:
        "bg-blue-200",

      iconColor:
        "text-blue-800",

      bg : 
        "bg-blue-100"
    },

    {
      title: "Total Students",
      value:
        stats.totalStudents,

      subtitle:
        "Across all classes",

      icon:
        Users,

      iconBg:
        "bg-green-200",

      iconColor:
        "text-green-800",

      bg : 
        "bg-green-100"
    },

    {
      title: "Total Pending Fees",
      value:
        `₹${stats.totalPendingFees}`,

      subtitle:
        "Across all classes",

      icon:
        IndianRupee,

      iconBg:
        "bg-orange-200",

      iconColor:
        "text-orange-800",

      bg : 
        "bg-orange-100"
    },

    {
      title: "Collected (This Month)",
      value:
        `₹${stats.totalCollectedFees}`,

      subtitle:
        "+18% from last month",

      icon:
        WalletCards,

      iconBg:
        "bg-purple-200",

      iconColor:
        "text-purple-800",

      bg : 
        "bg-purple-100"
    },
  ];

  return (
    <div
      className="
        grid
        grid-cols-2

        gap-4

        lg:grid-cols-4
      "
    >

      {
        cards.map(
          (item) => {

            const Icon =
              item.icon;

            return (

              <div
                key={item.title}

                className={`
                  rounded-2xl

                  border
                  border-slate-200

                  
                  ${item.bg}
                  p-5
                `}
              >

                <div
                  className="
                    flex
                    items-start

                    gap-4
                  "
                >

                  <div
                    className={`
                      flex
                      h-12
                      w-12

                      items-center
                      justify-center

                      rounded-2xl

                      ${item.iconBg}
                    `}
                  >

                    <Icon
                      size={24}

                      className={
                        item.iconColor
                      }
                    />

                  </div>

                  <div
                    className="
                      flex-1
                    "
                  >

                    <p
                      className="
                        text-xs
                        font-medium

                        text-slate-500
                      "
                    >
                      {item.title}
                    </p>

                    <h2
                      className="
                        mt-1

                        text-2xl
                        font-bold

                        text-slate-900
                      "
                    >
                      {item.value}
                    </h2>

                    <p
                      className={`
                        mt-1

                        text-xs

                        ${
                          item.title ===
                          "Collected (This Month)"
                            ? "text-green-600"
                            : "text-slate-500"
                        }
                      `}
                    >
                      {item.subtitle}
                    </p>

                  </div>

                </div>

              </div>
            );
          }
        )
      }

    </div>
  );
}
