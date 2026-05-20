import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  IndianRupee,
  Plus,
  School,
  Users,
  WalletCards,
} from "lucide-react";

import {
  getClassesByStatus,
} from "../lib/api/classapi.js";

import {
  getSectionCatalog,
  getSectionStats,
  getSectionsByClass,
} from "../lib/api/sectionapi.js";

import AddSectionModal
  from "../components/section/addSectionModal.jsx";

import SectionCard
  from "../components/section/sectionCard.jsx";

import SectionTable
  from "../components/section/sectionTable.jsx";

import {
  PageLoadingSkeleton,
  SectionGridSkeleton,
} from "../components/skeleton/PageSkeletons.jsx";

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

export default function SectionsPage() {
  const {
    classId,
  } = useParams();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    selectedClass,
    setSelectedClass,
  ] = useState(
    location.state?.selectedClass ||
      null
  );

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
    sectionStats,
    setSectionStats,
  ] = useState({
    totalSections: 0,
    totalStudents: 0,
    totalPendingFees: 0,
    totalCollectedFees: 0,
  });

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
        classes,
        active,
        archived,
        catalog,
        stats,
      ] =
        await Promise.all([
          getClassesByStatus(
            "all"
          ),
          getSectionsByClass({
            classId,
            status: "active",
          }),
          getSectionsByClass({
            classId,
            status: "archived",
          }),
          getSectionCatalog(
            classId
          ),
          getSectionStats(
            classId
          ),
        ]);

      const foundClass =
        classes.find(
          (item) =>
            item.id === classId
        );

      setSelectedClass(
        foundClass || null
      );

      setActiveSections(
        active
      );

      setArchivedSections(
        archived
      );

      setSectionCatalog(
        catalog
      );

      setSectionStats(
        stats
      );
    }, [classId]);

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

  const sectionCatalogItems =
    useMemo(
      () =>
        sectionCatalog.length
          ? sectionCatalog
          : [
              "A",
              "B",
              "C",
              "D",
            ].map((name) => ({
              name,
              classId,
              status: "available",
              sectionId: null,
            })),
      [
        classId,
        sectionCatalog,
      ]
    );

  const stats =
    useMemo(
      () => {
        return [
          {
            title: "No. of Sections",
            value:
              sectionStats.totalSections,
            subtitle:
              "Active sections",
            icon:
              School,
            iconBg:
              "bg-[#d2e5fc]",
            iconColor:
              "text-blue-600",
            bg:
              "bg-[#eef5fc] border-[#d2e5fc]/60"
          },
          {
            title: "Total Students",
            value:
              sectionStats.totalStudents,
            subtitle:
              "In all sections",
            icon:
              Users,
            iconBg:
              "bg-[#d3f4dd]",
            iconColor:
              "text-green-600",
            bg:
              "bg-[#ebfaf0] border-[#d3f4dd]/60"
          },
          {
            title: "Pending Amount",
            value:
              `₹${sectionStats.totalPendingFees}`,
            subtitle:
              "Across all sections",
            icon:
              IndianRupee,
            iconBg:
              "bg-[#fee5cd]",
            iconColor:
              "text-orange-600",
            bg:
              "bg-[#fff8ed] border-[#fee5cd]/60"
          },
          {
            title: "Collected Amount",
            value:
              `₹${sectionStats.totalCollectedFees}`,
            subtitle:
              "Across all sections",
            icon:
              WalletCards,
            iconBg:
              "bg-[#ebdcfc]",
            iconColor:
              "text-purple-600",
            bg:
              "bg-[#fbf7fe] border-[#ebdcfc]/60"
          },
        ];
      },
      [
        sectionStats,
      ]
    );

  if (loading) {
    return (
      <PageLoadingSkeleton />
    );
  }

  if (!selectedClass) {
    return (
      <div
        className="
          space-y-4
        "
      >
        <button
          onClick={() =>
            navigate(
              "/classes"
            )
          }
          className="
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            py-3
            text-sm
            font-semibold
            text-slate-700
          "
        >
          <ArrowLeft
            size={18}
          />
          Back to Classes
        </button>

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
          Class not found.
        </div>
      </div>
    );
  }

  const canManageSections =
    !selectedClass.isArchived;

  return (
    <div
      className="
        space-y-6
      "
    >
      <div
        className="
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-start
          lg:justify-between
        "
      >
        <div
          className="
            min-w-0
          "
        >
          <button
            onClick={() =>
              navigate(
                "/classes"
              )
            }
            className="
              mb-4
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              font-semibold
              text-slate-700
              hover:bg-slate-50
            "
          >
            <ArrowLeft
              size={18}
            />
            Back to Classes
          </button>

          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-blue-100
                text-blue-600
              "
            >
              <School
                size={24}
              />
            </div>

            <div
              className="
                min-w-0
              "
            >
          <h1
            className="
              truncate
              text-2xl
              font-bold
              text-slate-900
            "
          >
            {selectedClass.name} Sections
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
            "
          >
            Manage active and archived sections inside this class
          </p>
            </div>
          </div>
        </div>

        <button
          disabled={
            !canManageSections
          }
          onClick={() =>
            setShowAddModal(
              true
            )
          }
          className={`
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            px-4
            py-3
            text-sm
            font-medium
            text-white
            w-full
            sm:w-auto
            ${
              canManageSections
                ? "bg-orange-500 hover:bg-orange-600"
                : "cursor-not-allowed bg-slate-300"
            }
          `}
        >
          <Plus
            size={18}
          />
          Add Section
        </button>
      </div>

      <div
        className="
          grid
          grid-cols-2
          gap-3
          lg:grid-cols-4
          lg:gap-4
        "
      >
        {
          stats.map(
            (item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className={`
                    rounded-[24px]
                    border
                    ${item.bg}
                    p-4
                    md:p-5
                    shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]
                    transition-all
                    duration-300
                    hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.08)]
                    flex
                    items-center
                    gap-3
                    md:gap-4
                  `}
                >
                  <div
                    className={`
                      flex
                      h-12
                      w-12
                      md:h-14
                      md:w-14
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      ${item.iconBg}
                    `}
                  >
                    <Icon
                      size={22}
                      className={item.iconColor}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="
                        text-[11px]
                        md:text-xs
                        font-semibold
                        text-slate-500
                        tracking-wide
                      "
                    >
                      {item.title}
                    </p>

                    <h2
                      className="
                        mt-0.5
                        text-lg
                        md:text-2xl
                        font-bold
                        tracking-tight
                        text-slate-900
                      "
                    >
                      {item.value}
                    </h2>

                    <p
                      className="
                        mt-0.5
                        text-[10px]
                        md:text-xs
                        font-bold
                        text-slate-500
                      "
                    >
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );
            }
          )
        }
      </div>

      {
        !canManageSections && (
          <div
            className="
              rounded-2xl
              border
              border-orange-100
              bg-orange-50
              p-4
              text-sm
              font-medium
              text-orange-700
            "
          >
            This class is archived. Restore the class before changing sections.
          </div>
        )
      }

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

      <div
        className="
          hidden
          lg:block
        "
      >
        <SectionTable
          sections={shownSections}
          mode={activeTab}
          onRefresh={
            refreshSections
          }
          onViewSection={
            (section) =>
              navigate(
                `/classes/${classId}/sections/${section.id}/students`,
                {
                  state: {
                    selectedClass,
                    selectedSection:
                      section,
                  },
                }
              )
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
                  onViewSection={
                    (section) =>
                      navigate(
                        `/classes/${classId}/sections/${section.id}/students`,
                        {
                          state: {
                            selectedClass,
                            selectedSection:
                              section,
                          },
                        }
                      )
                  }
                />
              )
            )
          )
        }
      </div>

      {
        showAddModal && (
          <AddSectionModal
            selectedClass={
              selectedClass
            }
            sectionCatalog={
              sectionCatalogItems
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

    </div>
  );
}
