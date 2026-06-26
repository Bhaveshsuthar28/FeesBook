// src/pages/classes/components/classCard.jsx

import {
  Archive,
  ArchiveRestore,
  Eye,
  LoaderCircle,
  MoreVertical,
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

import { FaWhatsapp } from "react-icons/fa";

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
  mode,
  onRefresh,
  onViewClass,
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
    classColors[
      index %
        classColors.length
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

        await archiveClass(
          singleClass.id
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

        await unarchiveClass(
          singleClass.id
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
            gap-3
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <div
              className={`
                flex
                h-12
                w-12
                shrink-0
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

            <div
              className="
                min-w-0
              "
            >
              <h2
                className="
                  truncate
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
                  mode === "archived"
                    ? "Archived"
                    : `${singleClass.studentsCount} Students`
                }
              </p>
            </div>
          </div>

          <div
            className="
              flex
              shrink-0
              items-center
              gap-3
            "
          >
            {
              mode === "active" && (
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
                    ₹{singleClass.pendingFees}
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
              )
            }

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
                w-[160px]
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-xl
              "
            >
              {
                mode === "active" && (
                  <>
                    <button
                      onClick={() => {
                        onViewClass(
                          singleClass
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

                    {Number(singleClass.studentsCount || 0) > 0 && (
                      <button
                        onClick={() => {
                          onSendWhatsapp && onSendWhatsapp(singleClass);
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
                  </>
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
                  Archive Class
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
                Archive {singleClass.name}? It will be hidden from active classes and can be restored later.
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
