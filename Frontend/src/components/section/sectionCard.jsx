import {
  Archive,
  ArchiveRestore,
  Eye,
  LoaderCircle,
  MoreVertical,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  archiveSection,
  unarchiveSection,
} from "../../lib/api/sectionapi.js";

import { FaWhatsapp } from "react-icons/fa";

const sectionColors = [
  {
    bg: "bg-blue-200",
    text: "text-blue-800",
    bg2:"bg-blue-100"
  },
  {
    bg: "bg-green-200",
    text: "text-green-800",
    bg2:"bg-green-100"
  },
  {
    bg: "bg-yellow-200",
    text: "text-yellow-800",
    bg2:"bg-yellow-100"
  },
  {
    bg: "bg-purple-200",
    text: "text-purple-800",
    bg2:"bg-purple-100"
  },
];

export default function SectionCard({
  section,
  index,
  mode,
  onRefresh,
  onViewSection,
  onSendWhatsapp,
}) {
  const [
    showMenu,
    setShowMenu,
  ] = useState(false);

  const [
    showArchiveConfirm,
    setShowArchiveConfirm,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const color =
    sectionColors[
      index %
        sectionColors.length
    ];

  const handleArchive =
    async () => {
      if (actionLoading) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        await archiveSection(
          section.id
        );

        await onRefresh();
        setShowArchiveConfirm(
          false
        );
      } catch (error) {
        console.log(error);
      } finally {
        setActionLoading(
          false
        );
        setShowMenu(
          false
        );
      }
    };

  const handleRestore =
    async () => {
      if (actionLoading) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        await unarchiveSection(
          section.id
        );

        await onRefresh();
      } catch (error) {
        console.log(error);
      } finally {
        setActionLoading(
          false
        );
        setShowMenu(
          false
        );
      }
    };

  return (
    <>
      <div
        className={`
          relative
          rounded-2xl
          border
          border-slate-200
          bg-white
          px-4
          py-4
          ${color.bg2}
        `}
      >
        <div
          className={`
            flex
            items-center
            justify-between
            
          `}
        >
          <div
            className={`
              flex
              items-center
              gap-3
              
            `}
          >
            <div
              className={`
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-xl
                text-base
                font-bold
                ${color.bg}
                ${color.text}
              `}
            >
              {section.name}
            </div>

            <div>
              <h2
                className="
                  text-sm
                  font-semibold
                  text-slate-900
                "
              >
                Section {section.name}
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-500
                "
              >
                {Number(section.studentsCount || 0)} Students •{" "}
                {
                  mode === "archived"
                    ? "Archived"
                    : "Active"
                }
              </p>
            </div>
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

        {
          showMenu && (
            <div
              className="
                absolute
                right-4
                top-16
                z-30
                w-[160px]
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-xl
              "
            >
              <button
                onClick={() => {
                  onViewSection(
                    section
                  );
                  setShowMenu(
                    false
                  );
                }}
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

              {mode === "active" && Number(section.studentsCount || 0) > 0 && (
                <button
                  onClick={() => {
                    onSendWhatsapp && onSendWhatsapp(section);
                    setShowMenu(false);
                  }}
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-emerald-600
                    hover:bg-emerald-50
                  "
                >
                  <FaWhatsapp
                    size={16}
                  />
                  Broadcast
                </button>
              )}

              {
                mode === "active" && (
                    <button
                      disabled={
                        actionLoading
                      }
                      onClick={() => {
                        setShowArchiveConfirm(
                          true
                        );
                        setShowMenu(
                          false
                        );
                      }}
                      className="
                        flex
                        w-full
                        items-center
                        gap-3
                        px-4
                        py-3
                        text-sm
                        font-medium
                        text-orange-600
                        hover:bg-orange-50
                      "
                    >
                      <Archive
                        size={16}
                      />
                      Archive
                    </button>
                )
              }

              {
                mode === "archived" && (
                  <button
                    disabled={
                      actionLoading
                    }
                    onClick={
                      handleRestore
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
                      text-blue-700
                      hover:bg-blue-50
                    "
                  >
                    {
                      actionLoading ? (
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
          )
        }
      </div>

      {
        showArchiveConfirm && (
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
                max-w-sm
                rounded-3xl
                bg-white
                p-5
                shadow-2xl
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >
                <h2
                  className="
                    text-lg
                    font-bold
                    text-slate-900
                  "
                >
                  Archive Section
                </h2>

                <button
                  disabled={
                    actionLoading
                  }
                  onClick={() =>
                    setShowArchiveConfirm(
                      false
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

              <p
                className="
                  mt-3
                  text-sm
                  text-slate-600
                "
              >
                Archive Section {section.name}? It will be hidden and can be restored later.
              </p>

              <div
                className="
                  mt-6
                  flex
                  gap-3
                "
              >
                <button
                  disabled={
                    actionLoading
                  }
                  onClick={() =>
                    setShowArchiveConfirm(
                      false
                    )
                  }
                  className="
                    flex-1
                    rounded-xl
                    border
                    border-slate-200
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
                    actionLoading
                  }
                  onClick={
                    handleArchive
                  }
                  className="
                    flex
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-orange-500
                    py-3
                    text-sm
                    font-semibold
                    text-white
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
                      "Archive"
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
