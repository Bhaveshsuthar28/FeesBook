// src/pages/classes/components/classTable.jsx

import {
  Eye,
  Pencil,
  Trash2,
  GripVertical,
  X,
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

export default function ClassTable({
  classes,
  setDashboardData,
}) {

  const [
    deleteClass,

    setDeleteClass,
  ] = useState(null);

  const [
    deleteLoading,

    setDeleteLoading,
  ] = useState(false);

  const handleDelete =
    async () => {

      if (!deleteClass) {
        return;
      }

      try {

        setDeleteLoading(
          true
        );

        await deleteClassApi(
          deleteClass.id
        );

        setDashboardData(
          (prev) => ({

            ...prev,

            classes:
              prev.classes.filter(
                (item) =>
                  item.id !==
                  deleteClass.id
              ),
          })
        );

        setDeleteClass(
          null
        );

      } catch (error) {

        console.log(error);

      } finally {

        setDeleteLoading(
          false
        );
      }
    };

  return (
    <>
      <div
        className="
          overflow-hidden

          rounded-2xl

          border
          border-slate-200

          bg-white
        "
      >

        <div
          className="
            border-b
            border-slate-200

            px-5
            py-4
          "
        >

          <h2
            className="
              text-base
              font-semibold

              text-slate-900
            "
          >
            All Classes
          </h2>

        </div>

        <table
          className="
            w-full
          "
        >

          <thead
            className="
              border-b
              border-slate-200

              bg-slate-50
            "
          >

            <tr>

              <th
                className="
                  w-[45px]
                "
              />

              {
                [
                  "Class Name",
                  "Sections / Students",
                  "Pending Fees",
                  "Collected",
                  "Action",
                ].map(
                  (head) => (

                    <th
                      key={head}

                      className="
                        px-4
                        py-3

                        text-left
                        text-[11px]
                        font-semibold

                        uppercase
                        tracking-wide

                        text-slate-500
                      "
                    >
                      {head}
                    </th>
                  )
                )
              }

            </tr>

          </thead>

          <tbody>

            {
              classes.map(
                (
                  singleClass,
                  index
                ) => {

                  const color =
                    classColors[
                      index %
                      classColors.length
                    ];

                  return (

                    <tr
                      key={singleClass.id}

                      className={`
                        transition-all
                        duration-200

                        hover:bg-slate-100

                        ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }
                      `}
                    >

                      <td
                        className="
                          px-3
                          py-4
                        "
                      >

                        <button
                          className="
                            text-slate-400
                          "
                        >

                          <GripVertical
                            size={16}
                          />

                        </button>

                      </td>

                      <td
                        className="
                          px-4
                          py-4
                        "
                      >

                        <span
                          className={`
                            rounded-lg

                            px-3
                            py-1.5

                            text-sm
                            font-semibold

                            ${color.bg}
                            ${color.text}
                          `}
                        >
                          {
                            singleClass.name
                          }
                        </span>

                      </td>

                      <td
                        className="
                          px-4
                          py-4
                        "
                      >

                        <div className="flex gap-2">

                          <p
                            className="
                              text-sm
                              font-bold

                              text-slate-800
                            "
                          >
                            {
                              singleClass.sectionsCount
                            }
                          </p>
                            
                          <p className="text-slate-800 text-sm">/</p>
                          <p
                            className="
                              text-sm
                              font-bold
                              text-slate-800
                            "
                          >
                            {
                              singleClass.studentsCount 
                            }
                          </p>

                        </div>

                      </td>

                      <td
                        className="
                          px-4
                          py-4
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

                      </td>

                      <td
                        className="
                          px-4
                          py-4
                        "
                      >

                        <p
                          className="
                            text-sm
                            font-bold

                            text-green-600
                          "
                        >
                          ₹
                          {
                            singleClass.collectedFees
                          }
                        </p>

                      </td>

                      <td
                        className="
                          px-4
                          py-4
                        "
                      >

                        <div
                          className="
                            flex
                            items-center

                            gap-3
                          "
                        >

                          <button
                            className="
                              text-slate-800
                            "
                          >

                            <Eye
                              size={18}
                            />

                          </button>

                          <button
                            className="
                              text-blue-600
                            "
                          >

                            <Pencil
                              size={18}
                            />

                          </button>

                          <button

                            onClick={() =>
                              setDeleteClass(
                                singleClass
                              )
                            }

                            className="
                              text-red-500
                            "
                          >

                            <Trash2
                              size={18}
                            />

                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                }
              )
            }

          </tbody>

        </table>

      </div>

      {
        deleteClass && (

          <div
            className="
              fixed
              inset-0
              z-50

              flex
              items-center
              justify-center

              bg-black/40

              p-4
            "
          >

            <div
              className="
                w-full
                max-w-md

                rounded-3xl

                bg-white

                shadow-2xl
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between

                  border-b
                  border-slate-200

                  px-6
                  py-5
                "
              >

                <div>

                  <h2
                    className="
                      text-lg
                      font-bold

                      text-slate-900
                    "
                  >
                    Delete Class
                  </h2>

                  <p
                    className="
                      mt-1

                      text-sm
                      text-slate-500
                    "
                  >
                    This action cannot be undone
                  </p>

                </div>

                <button

                  disabled={
                    deleteLoading
                  }

                  onClick={() =>
                    setDeleteClass(
                      null
                    )
                  }

                  className="
                    rounded-xl

                    p-2

                    hover:bg-slate-100
                  "
                >

                  <X
                    size={20}
                  />

                </button>

              </div>

              <div
                className="
                  px-6
                  py-6
                "
              >

                <div
                  className="
                    rounded-2xl

                    border
                    border-red-100

                    bg-red-50

                    p-4
                  "
                >

                  <p
                    className="
                      text-sm
                      text-red-600
                    "
                  >
                    Are you sure you want to delete{" "}

                    <span
                      className="
                        font-bold
                      "
                    >
                      {
                        deleteClass.name
                      }
                    </span>

                    ?
                  </p>

                </div>

              </div>

              <div
                className="
                  flex
                  items-center
                  justify-end

                  gap-3

                  border-t
                  border-slate-200

                  px-6
                  py-5
                "
              >

                <button

                  disabled={
                    deleteLoading
                  }

                  onClick={() =>
                    setDeleteClass(
                      null
                    )
                  }

                  className="
                    rounded-xl

                    border
                    border-slate-200

                    px-5
                    py-3

                    text-sm
                    font-medium

                    text-slate-700
                  "
                >
                  Cancel
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
                    items-center
                    justify-center

                    gap-2

                    rounded-xl

                    bg-red-500

                    px-5
                    py-3

                    text-sm
                    font-semibold
                    text-white

                    hover:bg-red-600
                  "
                >

                  {
                    deleteLoading ? (

                      <LoaderCircle
                        size={18}

                        className="
                          animate-spin
                        "
                      />

                    ) : (
                      "Delete Class"
                    )
                  }

                </button>

              </div>

            </div>

          </div>
        )
      }
    </>
  );
}