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
  createSection,
  unarchiveSection,
} from "../../lib/api/sectionapi.js";

export default function AddSectionModal({
  selectedClass,
  sectionCatalog,
  onClose,
  onRefresh,
}) {
  const [
    selectedSection,
    setSelectedSection,
  ] = useState("");

  const [
    actionKey,
    setActionKey,
  ] = useState("");

  const loading =
    Boolean(actionKey);

  const catalogItems =
    sectionCatalog.length
      ? sectionCatalog
      : [
          "A",
          "B",
          "C",
          "D",
        ].map((name) => ({
          name,
          status: "available",
          sectionId: null,
        }));

  const handleCreate =
    async () => {
      if (
        !selectedSection ||
        loading
      ) {
        return;
      }

      try {
        setActionKey(
          `create:${selectedSection}`
        );

        await createSection({
          classId:
            selectedClass.id,
          name:
            selectedSection,
        });

        await onRefresh();
        onClose();
      } catch (error) {
        console.log(error);
      } finally {
        setActionKey("");
      }
    };

  const handleRestore =
    async (item) => {
      if (
        !item.sectionId ||
        loading
      ) {
        return;
      }

      try {
        setActionKey(
          `restore:${item.name}`
        );

        await unarchiveSection(
          item.sectionId
        );

        await onRefresh();
        onClose();
      } catch (error) {
        console.log(error);
      } finally {
        setActionKey("");
      }
    };

  return (
    <div
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
        className="
          w-full
          max-w-xl
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
              className="
                text-lg
                font-bold
                text-slate-900
              "
            >
              Add Section
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              {selectedClass.name} supports sections A, B, C, and D.
            </p>
          </div>

          <button
            disabled={loading}
            onClick={onClose}
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
              sm:grid-cols-4
            "
          >
          {
            catalogItems.map(
              (item) => {
                const selected =
                  selectedSection ===
                  item.name;

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
                    `}
                  >
                    <button
                      type="button"
                      disabled={
                        loading ||
                        !isAvailable
                      }
                      onClick={() =>
                        setSelectedSection(
                          item.name
                        )
                      }
                      className="
                        flex
                        min-h-[78px]
                        w-full
                        flex-col
                        items-start
                        justify-between
                        text-left
                      "
                    >
                      <span
                        className="
                          text-xl
                          font-bold
                          text-slate-900
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
                          disabled={loading}
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
            onClick={onClose}
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
              !selectedSection ||
              loading
            }
            onClick={handleCreate}
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
              ${
                selectedSection &&
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
                "Create Section"
              )
            }
          </button>
        </div>
      </div>
    </div>
  );
}
