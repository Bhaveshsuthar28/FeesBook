import {
  Plus,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getSectionCatalog,
  getSectionsByClass,
} from "../../lib/api/sectionapi.js";

import AddSectionModal
  from "./addSectionModal.jsx";

import SectionCard
  from "./sectionCard.jsx";

import SectionTable
  from "./sectionTable.jsx";

import {
  CardListSkeleton,
} from "../skeleton/PageSkeletons.jsx";

const tabs = [
  {
    id: "active",
    label: "Active",
  },
  {
    id: "archived",
    label: "Archived",
  },
];

export default function SectionManager({
  selectedClass,
  onClose,
  onRefreshClasses,
}) {
  const [
    activeSections,
    setActiveSections,
  ] = useState([]);

  const [
    archivedSections,
    setArchivedSections,
  ] = useState([]);

  const [
    sectionCatalog,
    setSectionCatalog,
  ] = useState([]);

  const [
    activeTab,
    setActiveTab,
  ] = useState("active");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    showAddModal,
    setShowAddModal,
  ] = useState(false);

  const refreshSections =
    useCallback(async () => {
      const [
        active,
        archived,
        catalog,
      ] =
        await Promise.all([
          getSectionsByClass({
            classId:
              selectedClass.id,
            status: "active",
          }),
          getSectionsByClass({
            classId:
              selectedClass.id,
            status: "archived",
          }),
          getSectionCatalog(
            selectedClass.id
          ),
        ]);

      setActiveSections(
        active
      );

      setArchivedSections(
        archived
      );

      setSectionCatalog(
        catalog
      );

      await onRefreshClasses();
    }, [
      selectedClass.id,
      onRefreshClasses,
    ]);

  useEffect(() => {
    const loadSections =
      async () => {
        try {
          setLoading(true);
          await refreshSections();
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      };

    loadSections();
  }, [refreshSections]);

  const shownSections =
    activeTab === "active"
      ? activeSections
      : archivedSections;

  return (
    <section
      className="
        space-y-5
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-4
        lg:p-5
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wide
              text-blue-600
            "
          >
            {selectedClass.name}
          </p>

          <h2
            className="
              mt-1
              text-xl
              font-bold
              text-slate-900
            "
          >
            Sections
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
            "
          >
            Manage sections A-D inside this class.
          </p>
        </div>

        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <button
            onClick={() =>
              setShowAddModal(
                true
              )
            }
            className="
              hidden
              items-center
              gap-2
              rounded-xl
              bg-orange-500
              px-4
              py-3
              text-sm
              font-medium
              text-white
              sm:flex
            "
          >
            <Plus
              size={18}
            />
            Add Section
          </button>

          <button
            onClick={onClose}
            className="
              rounded-xl
              border
              border-slate-200
              p-3
              text-slate-500
              hover:bg-slate-50
            "
          >
            <X
              size={18}
            />
          </button>
        </div>
      </div>

      <div
        className="
          flex
          w-full
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-1
          sm:w-fit
        "
      >
        {
          tabs.map(
            (tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id
                  )
                }
                className={`
                  flex-1
                  rounded-xl
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  transition-all
                  sm:flex-none
                  ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50"
                  }
                `}
              >
                {tab.label}
              </button>
            )
          )
        }
      </div>

      {
        loading ? (
          <CardListSkeleton />
        ) : (
          <>
            <div
              className="
                hidden
                lg:block
              "
            >
              <SectionTable
                sections={
                  shownSections
                }
                mode={activeTab}
                onRefresh={
                  refreshSections
                }
              />
            </div>

            <div
              className="
                space-y-3
                lg:hidden
              "
            >
              {
                shownSections.length === 0 ? (
                  <div
                    className="
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      p-5
                      text-sm
                      text-slate-500
                    "
                  >
                    No {activeTab} sections found.
                  </div>
                ) : (
                  shownSections.map(
                    (
                      section,
                      index
                    ) => (
                      <SectionCard
                        key={section.id}
                        section={section}
                        index={index}
                        mode={activeTab}
                        onRefresh={
                          refreshSections
                        }
                      />
                    )
                  )
                )
              }
            </div>
          </>
        )
      }

      <button
        onClick={() =>
          setShowAddModal(
            true
          )
        }
        className="
          flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-orange-500
          py-3
          text-sm
          font-semibold
          text-white
          sm:hidden
        "
      >
        <Plus
          size={18}
        />
        Add Section
      </button>

      {
        showAddModal && (
          <AddSectionModal
            selectedClass={
              selectedClass
            }
            sectionCatalog={
              sectionCatalog
            }
            onClose={() =>
              setShowAddModal(
                false
              )
            }
            onRefresh={
              refreshSections
            }
          />
        )
      }
    </section>
  );
}
