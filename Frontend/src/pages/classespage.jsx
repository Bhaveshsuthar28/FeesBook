import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FolderArchive,
  GraduationCap,
  LoaderCircle,
  Plus,
  Search,
  Info,
} from "lucide-react";

import Tooltip from "../components/common/Tooltip.jsx";

import {
  useNavigate,
} from "react-router-dom";

import {
  getClassCatalog,
  getClassesByStatus,
  getClassesDashboard,
} from "../lib/api/classapi.js";

import ClassStats
  from "../components/class/classStats.jsx";

import ClassTable
  from "../components/class/classTable.jsx";

import ClassCard
  from "../components/class/classCard.jsx";

import AddClassModal
  from "../components/class/addClassModel.jsx";

import SendWhatsappModal
  from "../components/common/SendWhatsappModal.jsx";

import { notify } from "../lib/toast.js";

import {
  PageLoadingSkeleton,
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

export default function ClassesPage() {
  const navigate =
    useNavigate();

  const [
    dashboardData,
    setDashboardData,
  ] = useState(null);

  const [
    classCatalog,
    setClassCatalog,
  ] = useState([]);

  const [
    archivedClasses,
    setArchivedClasses,
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

  const [whatsappStudent, setWhatsappStudent] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  const handleSendWhatsappClass = (cls) => {
    setWhatsappStudent({
      id: "class-broadcast",
      classId: cls.id,
      fullName: `Class ${cls.name}`,
      phone: "All Class Parents",
      isClassBroadcast: true
    });
  };

  const refreshClasses =
    useCallback(async () => {
      try {
        setRefreshing(true);
        const [
          dashboard,
          catalog,
          archived,
        ] =
          await Promise.all([
            getClassesDashboard(),
            getClassCatalog(),
            getClassesByStatus(
              "archived"
            ),
          ]);

        setDashboardData(
          dashboard
        );

        setClassCatalog(
          catalog
        );

        setArchivedClasses(
          archived
        );
      } catch (error) {
        console.error(error);
        notify.error(error, "Classes could not be loaded");
      } finally {
        setRefreshing(false);
      }
    }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await refreshClasses();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [refreshClasses]);

  if (
    loading ||
    !dashboardData
  ) {
    return (
      <PageLoadingSkeleton />
    );
  }

  const shownClasses =
    activeTab === "active"
      ? dashboardData.classes
      : archivedClasses;

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
          items-start
          gap-4
          sm:flex-row
          sm:justify-between
        "
      >
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="
                text-2xl
                font-bold
                text-slate-900
              "
            >
              Classes
            </h1>
            <Tooltip content="Manage all classes, view their sections, archive classes, or broadcast class announcements.">
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
            Manage active and archived classes
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() =>
              setShowAddModal(
                true
              )
            }
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-orange-500
              px-4
              py-3
              text-sm
              font-medium
              text-white
              w-full
              sm:w-auto
            "
          >
            <Plus
              size={18}
            />
            Add Class
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
                  {
                    setActiveTab(
                      tab.id
                    );

                  }
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
        activeTab === "active" && (
          <ClassStats
            stats={
              dashboardData.stats
            }
          />
        )
      }

      <div
        className="
          hidden
          lg:block
        "
      >
        <ClassTable
          classes={shownClasses}
          mode={activeTab}
          onRefresh={refreshClasses}
          onSendWhatsapp={handleSendWhatsappClass}
          onViewClass={
            (singleClass) =>
              navigate(
                `/classes/${singleClass.name}/sections`,
                {
                  state: {
                    selectedClass:
                      singleClass,
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
          shownClasses.length === 0 ? (
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
              No {activeTab} classes found.
            </div>
          ) : (
            shownClasses.map(
              (
                singleClass,
                index
              ) => (
                <ClassCard
                  key={singleClass.id}
                  singleClass={singleClass}
                  index={index}
                  mode={activeTab}
                  onRefresh={refreshClasses}
                  onSendWhatsapp={handleSendWhatsappClass}
                  onViewClass={
                    (singleClass) =>
                      navigate(
                        `/classes/${singleClass.name}/sections`,
                        {
                          state: {
                            selectedClass:
                              singleClass,
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
          <AddClassModal
            setShowAddModal={
              setShowAddModal
            }
            classCatalog={
              classCatalog
            }
            onRefresh={
              refreshClasses
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
