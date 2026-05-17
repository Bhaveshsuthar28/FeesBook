// src/pages/classes/components/classCard.jsx

import {
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  LoaderCircle,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  deleteClass as deleteClassApi,
} from "../../lib/api/classapi.js";

const classColors = [
  {
    bg: "bg-blue-100",
    text: "text-blue-700",
  },

  {
    bg: "bg-green-100",
    text: "text-green-700",
  },

  {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
  },

  {
    bg: "bg-purple-100",
    text: "text-purple-700",
  },

  {
    bg: "bg-pink-100",
    text: "text-pink-700",
  },

  {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
  },

  {
    bg: "bg-orange-100",
    text: "text-orange-700",
  },
];

export default function ClassCard({
  singleClass,
  index,
  setDashboardData,
}) {

  const [
    showMenu,

    setShowMenu,
  ] = useState(false);

  const [
    deleteLoading,

    setDeleteLoading,
  ] = useState(false);

  const color =
    classColors[
      index %
      classColors.length
    ];

  const handleDelete =
    async () => {

      try {

        setDeleteLoading(
          true
        );

        await deleteClassApi(
          singleClass.id
        );

        setDashboardData(
          (prev) => ({

            ...prev,

            classes:
              prev.classes.filter(
                (item) =>
                  item.id !==
                  singleClass.id
              ),

            stats: {

              ...prev.stats,

              totalClasses:
                prev.stats
                  .totalClasses - 1,
            },
          })
        );

      } catch (error) {

        console.log(error);

      } finally {

        setDeleteLoading(
          false
        );

        setShowMenu(
          false
        );
      }
    };

  return (
    <div
      className="
        relative

        rounded-2xl

        border
        border-slate-200

        bg-white

        px-4
        py-4
      "
    >

      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <div
          className="
            flex
            items-center

            gap-3
          "
        >

          <div
            className={`
              flex
              h-12
              w-12

              items-center
              justify-center

              rounded-xl

              text-sm
              font-bold

              ${color.bg}
              ${color.text}
            `}
          >
            {
              singleClass.name
            }
          </div>

          <div>

            <h2
              className="
                text-sm
                font-semibold

                text-slate-900
              "
            >
              {
                singleClass.name
              }
            </h2>

            <p
              className="
                mt-1

                text-xs
                text-slate-500
              "
            >
              {
                singleClass.studentsCount
              } Students
            </p>

          </div>

        </div>

        <div
          className="
            flex
            items-center

            gap-3
          "
        >

          <div
            className="
              text-right
            "
          >

            <p
              className="
                text-sm
                font-bold

                text-orange-500
              "
            >
              ₹
              {
                singleClass.pendingFees
              }
            </p>

            <p
              className="
                mt-1

                text-xs
                font-medium

                text-orange-500
              "
            >
              Pending
            </p>

          </div>

          <button

            onClick={() =>
              setShowMenu(
                !showMenu
              )
            }

            className="
              text-slate-500
            "
          >

            <MoreVertical
              size={18}
            />

          </button>

        </div>

      </div>

      {
        showMenu && (

          <div
            className="
              absolute
              right-4
              top-16
              z-30

              w-[150px]

              overflow-hidden

              rounded-2xl

              border
              border-slate-200

              bg-white

              shadow-xl
            "
          >

            <button
              className="
                flex
                w-full
                items-center

                gap-3

                px-4
                py-3

                text-sm
                font-medium

                text-slate-700

                hover:bg-slate-50
              "
            >

              <Eye
                size={16}
              />

              View

            </button>

            <button
              className="
                flex
                w-full
                items-center

                gap-3

                px-4
                py-3

                text-sm
                font-medium

                text-blue-600

                hover:bg-slate-50
              "
            >

              <Pencil
                size={16}
              />

              Edit

            </button>

            <button

              disabled={
                deleteLoading
              }

              onClick={
                handleDelete
              }

              className="
                flex
                w-full
                items-center

                gap-3

                px-4
                py-3

                text-sm
                font-medium

                text-red-500

                hover:bg-red-50
              "
            >

              {
                deleteLoading ? (

                  <LoaderCircle
                    size={16}

                    className="
                      animate-spin
                    "
                  />

                ) : (

                  <Trash2
                    size={16}
                  />
                )
              }

              Delete

            </button>

          </div>
        )
      }

    </div>
  );
}