// src/pages/classes/components/addClassModal.jsx

import {
  ArchiveRestore,
  Check,
  LoaderCircle,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  createClass,
  unarchiveClass,
} from "../../lib/api/classapi.js";

import {
  notify,
} from "../../lib/toast.js";

export default function AddClassModal({
  setShowAddModal,
  classCatalog,
  onRefresh,
}) {
  const [
    selectedClass,
    setSelectedClass,
  ] = useState("");

  const [
    actionKey,
    setActionKey,
  ] = useState("");

  const loading =
    Boolean(actionKey);

  const handleSubmit =
    async () => {
      if (
        !selectedClass ||
        loading
      ) {
        return;
      }

      try {
        setActionKey(
          `create:${selectedClass}`
        );

        await createClass({
          name:
            selectedClass,
        });

        await onRefresh();

        setShowAddModal(
          false
        );
      } catch (error) {
        notify.error(
          error,
          "Class could not be created"
        );
      } finally {
        setActionKey("");
      }
    };

  const handleRestore =
    async (item) => {
      if (
        !item.classId ||
        loading
      ) {
        return;
      }

      try {
        setActionKey(
          `restore:${item.name}`
        );

        await unarchiveClass(
          item.classId
        );

        await onRefresh();

        setShowAddModal(
          false
        );
      } catch (error) {
        notify.error(
          error,
          "Class could not be restored"
        );
      } finally {
        setActionKey("");
      }
    };

  return (
    <div
      role="presentation"
      onClick={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          setShowAddModal(
            false
          );
        }
      }}
      className="
        fixed
        inset-0
        z-[90]
        flex
        items-end
        justify-center
        bg-black/40
        p-0
        sm:items-center
        sm:p-4
      "
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-class-title"
        onClick={(event) =>
          event.stopPropagation()
        }
        className="
          w-full
          max-w-2xl
          max-h-[92vh]
          flex
          flex-col
          rounded-t-3xl
          bg-white
          shadow-2xl
          sm:rounded-3xl
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-200
            px-5
            py-5
          "
        >
          <div>
            <h2
              id="add-class-title"
              className="
                text-lg
                font-bold
                text-slate-900
              "
            >
              Add Class
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Added classes are locked. Archived classes can be restored.
            </p>
          </div>

          <button
            disabled={loading}
            onClick={() =>
              setShowAddModal(
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
              size={22}
            />
          </button>
        </div>

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            px-5
            py-5
          "
        >
          <div
            className="
              grid
              grid-cols-2
              gap-3
              sm:grid-cols-3
              lg:grid-cols-4
            "
          >
            {
              classCatalog.map(
                (item) => {
                  const selected =
                    selectedClass ===
                    item.name;

                  const isActive =
                    item.status ===
                    "active";

                  const isArchived =
                    item.status ===
                    "archived";

                  const isAvailable =
                    item.status ===
                    "available";

                  const restoreLoading =
                    actionKey ===
                    `restore:${item.name}`;

                  return (
                    <div
                      key={item.name}
                      className={`
                        relative
                        rounded-2xl
                        border
                        p-3
                        transition-all
                        ${
                          selected
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 bg-white"
                        }
                        ${
                          isActive
                            ? "bg-slate-50 text-slate-400"
                            : ""
                        }
                      `}
                    >
                      <button
                        type="button"
                        disabled={
                          loading ||
                          !isAvailable
                        }
                        onClick={() =>
                          setSelectedClass(
                            item.name
                          )
                        }
                        className="
                          flex
                          min-h-[72px]
                          w-full
                          flex-col
                          items-start
                          justify-between
                          text-left
                        "
                      >
                        <span
                          className="
                            text-sm
                            font-semibold
                            text-slate-800
                          "
                        >
                          {item.name}
                        </span>

                        <span
                          className={`
                            rounded-full
                            px-2
                            py-1
                            text-[11px]
                            font-semibold
                            ${
                              isAvailable
                                ? "bg-green-50 text-green-700"
                                : isArchived
                                  ? "bg-orange-50 text-orange-700"
                                  : "bg-slate-200 text-slate-500"
                            }
                          `}
                        >
                          {
                            isAvailable
                              ? "Available"
                              : isArchived
                                ? "Archived"
                                : "Added"
                          }
                        </span>
                      </button>

                      {
                        selected && (
                          <div
                            className="
                              absolute
                              right-2
                              top-2
                              flex
                              h-5
                              w-5
                              items-center
                              justify-center
                              rounded-full
                              bg-blue-600
                              text-white
                            "
                          >
                            <Check
                              size={12}
                            />
                          </div>
                        )
                      }

                      {
                        isArchived && (
                          <button
                            type="button"
                            disabled={
                              loading
                            }
                            onClick={() =>
                              handleRestore(
                                item
                              )
                            }
                            className="
                              mt-3
                              flex
                              w-full
                              items-center
                              justify-center
                              gap-2
                              rounded-xl
                              border
                              border-orange-200
                              px-3
                              py-2
                              text-xs
                              font-semibold
                              text-orange-700
                              hover:bg-orange-50
                            "
                          >
                            {
                              restoreLoading ? (
                                <LoaderCircle
                                  size={14}
                                  className="
                                    animate-spin
                                  "
                                />
                              ) : (
                                <ArchiveRestore
                                  size={14}
                                />
                              )
                            }
                            Restore
                          </button>
                        )
                      }
                    </div>
                  );
                }
              )
            }
          </div>
        </div>

        <div
          className="
            flex
            shrink-0
            items-center
            justify-end
            gap-3
            border-t
            border-slate-200
            bg-white
            px-5
            py-5
          "
        >
          <button
            disabled={loading}
            onClick={() =>
              setShowAddModal(
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
            onClick={handleSubmit}
            disabled={
              !selectedClass ||
              loading
            }
            className={`
              flex
              flex-1
              items-center
              justify-center
              gap-2
              rounded-xl
              py-3
              text-sm
              font-semibold
              text-white
              transition-all
              ${
                selectedClass &&
                !loading
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "cursor-not-allowed bg-slate-300"
              }
            `}
          >
            {
              actionKey.startsWith(
                "create:"
              ) ? (
                <LoaderCircle
                  size={18}
                  className="
                    animate-spin
                  "
                />
              ) : (
                "Create Class"
              )
            }
          </button>
        </div>
      </div>
    </div>
  );
}
