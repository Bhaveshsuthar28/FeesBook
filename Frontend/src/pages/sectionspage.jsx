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

import { useTranslation } from "react-i18next";
import { useAppContext } from "../context/user.context.jsx";

import {
  ArrowLeft,
  IndianRupee,
  Plus,
  School,
  Users,
  WalletCards,
  Info,
} from "lucide-react";

import Tooltip from "../components/common/Tooltip.jsx";

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

import SendWhatsappModal
  from "../components/common/SendWhatsappModal.jsx";

import { FaWhatsapp } from "react-icons/fa";

import { notify } from "../lib/toast.js";

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
  const { t } = useTranslation();
  const { tDb } = useAppContext();
  const {
    className,
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

  const [resolvedClassId, setResolvedClassId] = useState(
    location.state?.selectedClass?.id || null
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

  const [whatsappStudent, setWhatsappStudent] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  const handleSendWhatsappSection = (sec) => {
    setWhatsappStudent({
      id: "section-broadcast",
      sectionId: sec.id,
      fullName: `Section ${selectedClass?.name || ""} - ${sec.name}`,
      phone: "All Section Parents",
      isBroadcast: true
    });
  };

  const handleBroadcastClass = () => {
    setWhatsappStudent({
      id: "class-broadcast",
      classId: resolvedClassId,
      fullName: `Class ${selectedClass?.name || ""}`,
      phone: "All Class Parents",
      isClassBroadcast: true
    });
  };

  const refreshSections =
    useCallback(async () => {
      try {
        setRefreshing(true);
        const classes = await getClassesByStatus("all");
        const foundClass = classes.find(c => c.name === className) || null;
        setSelectedClass(foundClass);

        if (!foundClass) {
          throw new Error("Class not found");
        }

        const classId = foundClass.id;
        setResolvedClassId(classId);

        const [
          active,
          archived,
          catalog,
          stats,
        ] =
          await Promise.all([
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
      } catch (error) {
        console.error(error);
        notify.error(error, "Sections could not be loaded");
      } finally {
        setRefreshing(false);
      }
    }, [className]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await refreshSections();
      } finally {
        setLoading(false);
      }
    };
    init();
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
              classId: resolvedClassId,
              status: "available",
              sectionId: null,
            })),
      [
        resolvedClassId,
        sectionCatalog,
      ]
    );

  const stats =
    useMemo(
      () => {
        return [
          {
            title: t("noOfSections") || "No. of Sections",
            value:
              sectionStats.totalSections,
            subtitle:
              t("activeSections") || "Active sections",
            icon:
              School,
            iconBg:
              "bg-[#d2e5fc]",
            iconColor:
              "text-[#4F46E5]",
            bg:
              "bg-[#eef5fc] border-[#d2e5fc]/60"
          },
          {
            title: t("totalStudents") || "Total Students",
            value:
              sectionStats.totalStudents,
            subtitle:
              t("inAllSections") || "In all sections",
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
            title: t("pendingAmount") || "Pending Amount",
            value:
              `₹${sectionStats.totalPendingFees}`,
            subtitle:
              t("acrossAllSections") || "Across all sections",
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
            title: t("collectedAmount") || "Collected Amount",
            value:
              `₹${sectionStats.totalCollectedFees}`,
            subtitle:
              t("acrossAllSections") || "Across all sections",
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
        t,
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
          {t("backToClasses") || "Back to Classes"}
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
          {t("classNotFound") || "Class not found."}
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
            {t("backToClasses") || "Back to Classes"}
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
                bg-indigo-50
                text-indigo-600
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
          <div className="flex items-center gap-2">
            <h1
              className="
                truncate
                text-2xl
                font-bold
                text-slate-900
              "
            >
              {tDb(selectedClass.name)} {t("sections") || "Sections"}
            </h1>
            <Tooltip content={t("sectionsTooltip") || "Manage sections within this class, track student statistics, and broadcast announcements to sections."}>
              <button type="button" className="text-slate-400 hover:text-slate-600 transition p-1 mt-1">
                <Info size={16} />
              </button>
            </Tooltip>
          </div>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
            "
          >
            {t("manageSectionsDesc") || "Manage active and archived sections inside this class"}
          </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {Number(selectedClass?.studentsCount || 0) > 0 && (
            <button
              type="button"
              onClick={handleBroadcastClass}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-95 w-full sm:w-auto"
            >
              <FaWhatsapp size={18} />
              {t("broadcastToClass") || "Broadcast to Class"}
            </button>
          )}

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
                  ? "bg-[#4F46E5] hover:bg-indigo-750"
                  : "cursor-not-allowed bg-slate-300"
              }
            `}
          >
            <Plus
              size={18}
            />
            {t("addSection") || "Add Section"}
          </button>
        </div>
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
                      ? "bg-[#4F46E5] text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50"
                  }
                `}
              >
                {t(tab.id) || tab.label}
              </button>
            )
          )
        }
      </div>      <div
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
          onSendWhatsapp={handleSendWhatsappSection}
          onViewSection={
            (section) =>
              navigate(
                `/classes/${className}/sections/${section.name}/students`,
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
                  onSendWhatsapp={handleSendWhatsappSection}
                  onViewSection={
                    (section) =>
                      navigate(
                        `/classes/${className}/sections/${section.name}/students`,
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

      {whatsappStudent && (
        <SendWhatsappModal
          isOpen={Boolean(whatsappStudent)}
          onClose={() => setWhatsappStudent(null)}
          student={whatsappStudent}
        />
      )}
    </div>
  );
}
