import {
  Archive,
  ArchiveRestore,
  Eye,
  LoaderCircle,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  archiveSection,
  unarchiveSection,
} from "../../lib/api/sectionapi.js";

const sectionColors = [
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
];

export default function SectionTable({
  sections,
  mode,
  onRefresh,
  onViewSection,
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

        await archiveSection(
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
    async (section) => {
      if (actionLoading) {
        return;
      }

      try {
        setActionLoading(
          section.id
        );

        await unarchiveSection(
          section.id
        );

        await onRefresh();
      } catch (error) {
        console.log(error);
      } finally {
        setActionLoading("");
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
            {
              mode === "archived"
                ? "Archived Sections"
                : "Active Sections"
            }
          </h2>
        </div>

        {
          sections.length === 0 ? (
            <div
              className="
                px-5
                py-8
                text-sm
                text-slate-500
              "
            >
              No {mode} sections found.
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
                  {
                    [
                      "Section",
                      "Status",
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
                  sections.map(
                    (
                      section,
                      index
                    ) => {
                      const color =
                        sectionColors[
                          index %
                            sectionColors.length
                        ];

                      const isBusy =
                        actionLoading ===
                        section.id;

                      return (
                        <tr
                          key={section.id}
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
                              Section {section.name}
                            </span>
                          </td>

                          <td
                            className="
                              px-4
                              py-4
                            "
                          >
                            <span
                              className={`
                                rounded-full
                                px-3
                                py-1
                                text-xs
                                font-semibold
                                ${
                                  mode === "archived"
                                    ? "bg-orange-50 text-orange-700"
                                    : "bg-green-50 text-green-700"
                                }
                              `}
                            >
                              {
                                mode === "archived"
                                  ? "Archived"
                                  : "Active"
                              }
                            </span>
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
                                  onViewSection(
                                    section
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

                              {
                                mode === "active" ? (
                                  <button
                                    disabled={isBusy}
                                    onClick={() =>
                                      setArchiveTarget(
                                        section
                                      )
                                    }
                                    className="
                                      text-orange-600
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
                                ) : (
                                  <button
                                    disabled={isBusy}
                                    onClick={() =>
                                      handleRestore(
                                        section
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
                                )
                              }
                            </div>
                          </td>
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
                    Archive Section
                  </h2>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    This hides the section. You can restore it later.
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
                    Archive Section{" "}
                    <span
                      className="
                        font-bold
                      "
                    >
                      {
                        archiveTarget.name
                      }
                    </span>
                    ? It will move to Archived sections.
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
                      "Archive Section"
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
