// src/pages/classes/components/classTable.jsx

import {
  Archive,
  ArchiveRestore,
  Eye,
  GripVertical,
  LoaderCircle,
  Pencil,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  archiveClass,
  unarchiveClass,
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
  mode,
  onRefresh,
  onViewClass,
}) {
  const [
    archiveTarget,
    setArchiveTarget,
  ] = useState(null);

  const [
    actionLoading,
    setActionLoading,
  ] = useState("");

  const handleArchive =
    async () => {
      if (
        !archiveTarget ||
        actionLoading
      ) {
        return;
      }

      try {
        setActionLoading(
          archiveTarget.id
        );

        await archiveClass(
          archiveTarget.id
        );

        await onRefresh();

        setArchiveTarget(
          null
        );
      } catch (error) {
        console.log(error);
      } finally {
        setActionLoading("");
      }
    };

  const handleRestore =
    async (singleClass) => {
      if (actionLoading) {
        return;
      }

      try {
        setActionLoading(
          singleClass.id
        );

        await unarchiveClass(
          singleClass.id
        );

        await onRefresh();
      } catch (error) {
        console.log(error);
      } finally {
        setActionLoading("");
      }
    };

  const headings =
    mode === "archived"
      ? [
          "Class Name",
          "Status",
          "Action",
        ]
      : [
          "Class Name",
          "Sections / Students",
          "Pending Fees",
          "Collected",
          "Action",
        ];

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
            {
              mode === "archived"
                ? "Archived Classes"
                : "Active Classes"
            }
          </h2>
        </div>

        {
          classes.length === 0 ? (
            <div
              className="
                px-5
                py-8
                text-sm
                text-slate-500
              "
            >
              No {mode} classes found.
            </div>
          ) : (
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
                    headings.map(
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

                      const isBusy =
                        actionLoading ===
                        singleClass.id;

                      return (
                        <tr
                          key={singleClass.id}
                          className={`
                            transition-all
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
                            <GripVertical
                              size={16}
                              className="
                                text-slate-400
                              "
                            />
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

                          {
                            mode === "archived" ? (
                              <>
                                <td
                                  className="
                                    px-4
                                    py-4
                                  "
                                >
                                  <span
                                    className="
                                      rounded-full
                                      bg-orange-50
                                      px-3
                                      py-1
                                      text-xs
                                      font-semibold
                                      text-orange-700
                                    "
                                  >
                                    Archived
                                  </span>
                                </td>

                                <td
                                  className="
                                    px-4
                                    py-4
                                  "
                                >
                                  <button
                                    disabled={isBusy}
                                    onClick={() =>
                                      handleRestore(
                                        singleClass
                                      )
                                    }
                                    className="
                                      flex
                                      items-center
                                      gap-2
                                      rounded-xl
                                      border
                                      border-blue-200
                                      px-3
                                      py-2
                                      text-sm
                                      font-semibold
                                      text-blue-700
                                      hover:bg-blue-50
                                    "
                                  >
                                    {
                                      isBusy ? (
                                        <LoaderCircle
                                          size={16}
                                          className="
                                            animate-spin
                                          "
                                        />
                                      ) : (
                                        <ArchiveRestore
                                          size={16}
                                        />
                                      )
                                    }
                                    Restore
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td
                                  className="
                                    px-4
                                    py-4
                                  "
                                >
                                  <div
                                    className="
                                      flex
                                      gap-2
                                    "
                                  >
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
                                    <p
                                      className="
                                        text-sm
                                        text-slate-800
                                      "
                                    >
                                      /
                                    </p>
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
                                    ₹{singleClass.pendingFees}
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
                                    ₹{singleClass.collectedFees}
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
                                      onClick={() =>
                                        onViewClass(
                                          singleClass
                                        )
                                      }
                                      className="
                                        text-slate-800
                                      "
                                    >
                                      <Eye
                                        size={18}
                                      />
                                    </button>

                                    

                                    <button
                                      disabled={isBusy}
                                      onClick={() =>
                                        setArchiveTarget(
                                          singleClass
                                        )
                                      }
                                      className="
                                        text-red-500
                                      "
                                    >
                                      {
                                        isBusy ? (
                                          <LoaderCircle
                                            size={18}
                                            className="
                                              animate-spin
                                            "
                                          />
                                        ) : (
                                          <Archive
                                            size={18}
                                          />
                                        )
                                      }
                                    </button>
                                  </div>
                                </td>
                              </>
                            )
                          }
                        </tr>
                      );
                    }
                  )
                }
              </tbody>
            </table>
          )
        }
      </div>

      {
        archiveTarget && (
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
                    Archive Class
                  </h2>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    This hides the class. You can restore it later.
                  </p>
                </div>

                <button
                  disabled={Boolean(
                    actionLoading
                  )}
                  onClick={() =>
                    setArchiveTarget(
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
                    border-orange-100
                    bg-orange-50
                    p-4
                  "
                >
                  <p
                    className="
                      text-sm
                      text-orange-700
                    "
                  >
                    Archive{" "}
                    <span
                      className="
                        font-bold
                      "
                    >
                      {
                        archiveTarget.name
                      }
                    </span>
                    ? It will move to Archived classes.
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
                  disabled={Boolean(
                    actionLoading
                  )}
                  onClick={() =>
                    setArchiveTarget(
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
                  disabled={Boolean(
                    actionLoading
                  )}
                  onClick={
                    handleArchive
                  }
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-orange-500
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    hover:bg-orange-600
                  "
                >
                  {
                    actionLoading ? (
                      <LoaderCircle
                        size={18}
                        className="
                          animate-spin
                        "
                      />
                    ) : (
                      "Archive Class"
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
