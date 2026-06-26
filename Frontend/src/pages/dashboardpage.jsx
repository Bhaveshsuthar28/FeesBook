import {
  useUser,
} from "@clerk/clerk-react";

import {
  Bell,
  Building2,
  FileText,
  Layers,
  LoaderCircle,
  Megaphone,
  Search,
  UserPlus,
  Users,
  Wallet,
  X,
  School,
  IndianRupee,
  WalletCards,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Area,
  AreaChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AddStudentModal from "../components/students/AddStudentModal.jsx";

import AddClassModal from "../components/class/addClassModel.jsx";

import AddSectionModal from "../components/section/addSectionModal.jsx";

import RecordPaymentModal from "../components/payments/RecordPaymentModal.jsx";

import {
  getClassesDashboard,
  getDashboardInsights,
  getClassCatalog,
  getClassesByStatus,
} from "../lib/api/classapi.js";

import {
  getSectionCatalog,
} from "../lib/api/sectionapi.js";

import {
  getStudentDirectory,
} from "../lib/api/studentapi.js";

import {
  notify,
} from "../lib/toast.js";

import toast from "react-hot-toast";

import {
  PageLoadingSkeleton,
} from "../components/skeleton/PageSkeletons.jsx";

const DONUT_COLORS = [
  "#3b82f6",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#eab308",
  "#64748b",
];

const formatCurrency =
  (value) =>
    new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value || 0)
    );

const formatShortCurrency =
  (value) => {
    const n =
      Number(value || 0);

    if (n >= 100000) {
      return `₹${(n / 100000).toFixed(1)}L`;
    }

    if (n >= 1000) {
      return `₹${(n / 1000).toFixed(1)}k`;
    }

    return formatCurrency(n);
  };

const formatRelativeTime =
  (timestampMs) => {

    const delta =
      Date.now() - Number(timestampMs);

    const sec =
      Math.floor(delta / 1000);

    if (sec < 60) {
      return `${sec}s ago`;
    }

    const min =
      Math.floor(sec / 60);

    if (min < 60) {
      return `${min} min ago`;
    }

    const hr =
      Math.floor(min / 60);

    if (hr < 24) {
      return `${hr}h ago`;
    }

    const day =
      Math.floor(hr / 24);

    return `${day}d ago`;
  };

const greetingForHour =
  (hour) => {

    if (hour < 12) {
      return "Good Morning";
    }

    if (hour < 17) {
      return "Good Afternoon";
    }

    return "Good Evening";
  };

function bucketDonutSlices(
  rows,
  {
    maxSlices = 5,
  } = {}
) {

  if (
    rows.length <= maxSlices
  ) {
    return rows;
  }

  const sorted =
    [...rows].sort(
      (
        a,
        b
      ) =>
        b.value - a.value
    );

  const top =
    sorted.slice(
      0,
      maxSlices - 1
    );

  const rest =
    sorted.slice(
      maxSlices - 1
    );

  const otherSum =
    rest.reduce(
      (
        acc,
        r
      ) =>
        acc + r.value,
      0
    );

  return [
    ...top,
    {
      name: "Others",
      value: otherSum,
    },
  ];
}

function ModalFrame({
  title,
  description,
  onClose,
  children,
}) {

  return (
    <div
      role="presentation"
      className="
        fixed
        inset-0
        z-[95]
        flex
        items-center
        justify-center
        bg-slate-950/50
        p-4
      "
      onClick={(event) => {

        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div
        role="dialog"
        aria-modal="true"
        className="
          w-full
          max-w-md
          rounded-2xl
          bg-white
          p-6
          shadow-xl
        "
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <div
          className="
            mb-4
            flex
            items-start
            justify-between
            gap-3
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
              {title}
            </h2>

            {
              description && (
                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-600
                  "
                >
                  {description}
                </p>
              )
            }

          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              p-2
              text-slate-500
              hover:bg-slate-100
            "
            aria-label="Close"
          >

            <X size={20} />

          </button>

        </div>

        {children}

      </div>

    </div>
  );
}

function PickStudentModal({
  open,
  onClose,
  onPick,
}) {

  const [
    search,

    setSearch,
  ] = useState("");

  const [
    debounced,

    setDebounced,
  ] = useState("");

  const [
    loading,

    setLoading,
  ] = useState(false);

  const [
    students,

    setStudents,
  ] = useState(
    []
  );

  const [
    classes,
    setClasses,
  ] = useState([]);

  const [
    selectedClassId,
    setSelectedClassId,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      setClasses([]);
      setSelectedClassId("");
      return;
    }

    const loadClasses = async () => {
      try {
        const data = await getClassesByStatus("active");
        setClasses(data || []);
      } catch (error) {
        console.error("Failed to load classes in PickStudentModal", error);
      }
    };

    loadClasses();
  }, [open]);

  useEffect(
    () => {

      const t =
        setTimeout(
          () => {
            setDebounced(
              search.trim()
            );
          },
          320
        );

      return () =>
        clearTimeout(t);
    },
    [
      search,
    ]
  );

  useEffect(
    () => {

      if (!open) {

        setSearch("");
        setDebounced("");
        setStudents(
          []
        );
        return;
      }

      let active = true;

      (
        async () => {

          try {
            setLoading(true);
            const data =
              await getStudentDirectory({
                status: "active",
                page: 1,
                limit: 100,
                search:
                  debounced,
                classId: selectedClassId,
                sortBy: "name",
              });

            if (!active) {
              return;
            }

            const activeStudents = data.students || [];
            const pendingStudents = activeStudents.filter(
              (student) =>
                Number(student.pendingFees || 0) > 0
            );

            setStudents(pendingStudents);
          } catch (error) {
            notify.error(
              error,
              "Students could not be loaded"
            );
          } finally {

            if (active) {
              setLoading(
                false
              );
            }
          }
        }
      )();

      return () => {
        active = false;
      };
    },
    [
      open,
      debounced,
      selectedClassId,
    ]
  );

  if (!open) {
    return null;
  }

  return (
    <ModalFrame
      title="Record payment"
      description="Search and select a student with pending payments."
      onClose={onClose}
    >

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search
            className="
              pointer-events-none
              absolute
              left-3
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-slate-400
            "
          />
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Name, roll no..."
            className="
              h-11
              w-full
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              pl-9
              pr-3
              text-sm
              outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
          />
        </div>
        <div>
          <select
            value={selectedClassId}
            onChange={(event) =>
              setSelectedClassId(
                event.target.value
              )
            }
            className="
              h-11
              w-full
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-3
              text-sm
              outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option
                key={cls.id}
                value={cls.id}
              >
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="
          max-h-72
          overflow-y-auto
          rounded-xl
          border
          border-slate-100
        "
      >

        {
          loading && (
            <div
              className="
                flex
                justify-center
                py-10
                text-slate-500
              "
            >

              <LoaderCircle
                className="
                  h-8
                  w-8
                  animate-spin
                "
              />

            </div>
          )
        }

        {
          !loading &&
          students.length === 0 && (
            <p
              className="
                px-4
                py-8
                text-center
                text-sm
                text-slate-500
              "
            >
              No students found with pending payments.
            </p>
          )
        }

        {
          !loading &&
          students.map(
            (student) => (

              <button
                key={student.id}
                type="button"
                onClick={() =>
                  onPick(student)
                }
                className="
                  flex
                  w-full
                  flex-col
                  items-start
                  gap-0.5
                  border-b
                  border-slate-100
                  px-4
                  py-3
                  text-left
                  last:border-b-0
                  hover:bg-blue-50/60
                "
              >

                <div className="flex w-full items-center justify-between gap-2">
                  <span
                    className="
                      text-sm
                      font-semibold
                      text-slate-900
                    "
                  >
                    {student.fullName}
                  </span>

                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    ₹ {Number(student.pendingFees || 0).toLocaleString("en-IN")} Pending
                  </span>
                </div>

                <span
                  className="
                    text-xs
                    text-slate-500
                  "
                >
                  {student.className} - {student.sectionName}
                </span>

              </button>
            )
          )
        }

      </div>

    </ModalFrame>
  );
}

export default function DashboardPage() {

  const { user } =
    useUser();

  const navigate =
    useNavigate();

  const [
    loading,

    setLoading,
  ] = useState(true);

  const [
    dashboard,

    setDashboard,
  ] = useState(null);

  const [
    insights,

    setInsights,
  ] = useState(null);

  const [
    directoryMeta,

    setDirectoryMeta,
  ] = useState(null);

  const [
    topPendingStudents,

    setTopPendingStudents,
  ] = useState(
    []
  );

  const [
    chartMonth,

    setChartMonth,
  ] = useState(
    "thisMonth"
  );

  const [
    addStudentOpen,

    setAddStudentOpen,
  ] = useState(false);

  const [
    pickStudentOpen,

    setPickStudentOpen,
  ] = useState(false);

  const [
    paymentStudent,

    setPaymentStudent,
  ] = useState(null);

  const [
    reportsOpen,

    setReportsOpen,
  ] = useState(false);

  const [
    reminderModalOpen,

    setReminderModalOpen,
  ] = useState(false);

  const [
    addClassOpen,

    setAddClassOpen,
  ] = useState(false);

  const [
    classCatalogForModal,

    setClassCatalogForModal,
  ] = useState(
    []
  );

  const [
    sectionClassPickerOpen,

    setSectionClassPickerOpen,
  ] = useState(false);

  const [
    classesForSectionPicker,

    setClassesForSectionPicker,
  ] = useState(
    []
  );

  const [
    pickedClassForSectionId,

    setPickedClassForSectionId,
  ] = useState("");

  const [
    sectionModalOpen,

    setSectionModalOpen,
  ] = useState(false);

  const [
    sectionFlowClass,

    setSectionFlowClass,
  ] = useState(null);

  const [
    sectionCatalogForModal,

    setSectionCatalogForModal,
  ] = useState(
    []
  );

  const [
    loadingSectionProceed,

    setLoadingSectionProceed,
  ] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const loadData =
    useCallback(
      async () => {

        try {
          setRefreshing(true);

          const [
            dash,
            ins,
            dir,
            top,
          ] =
            await Promise.all([
              getClassesDashboard(),
              getDashboardInsights(),
              getStudentDirectory({
                status: "active",
                page: 1,
                limit: 1,
              }),
              getStudentDirectory({
                status: "active",
                paymentStatus: "Pending",
                sortBy: "dueAmount",
                page: 1,
                limit: 5,
              }),
            ]);

          setDashboard(dash);
          setInsights(ins);
          setDirectoryMeta(dir);
          setTopPendingStudents(
            top.students || []
          );
        } catch (error) {
          notify.error(
            error,
            "Dashboard could not be loaded"
          );
        } finally {
          setRefreshing(
            false
          );
        }
      },
      []
    );

  useEffect(
    () => {
      const init = async () => {
        try {
          setLoading(true);
          await loadData();
        } finally {
          setLoading(false);
        }
      };
      init();
    },
    [
      loadData,
    ]
  );

  useEffect(
    () => {

      if (!addClassOpen) {
        return;
      }

      let active = true;

      (async () => {

        try {
          const cat =
            await getClassCatalog();

          if (!active) {
            return;
          }

          setClassCatalogForModal(
            cat || []
          );
        } catch (error) {
          notify.error(
            error,
            "Class list could not be loaded"
          );
        }
      })();

      return () => {
        active = false;
      };
    },
    [
      addClassOpen,
    ]
  );

  useEffect(
    () => {

      if (
        !sectionClassPickerOpen
      ) {
        return;
      }

      let active = true;

      (
        async () => {

          try {
            const rows =
              await getClassesByStatus(
                "active"
              );

            if (!active) {
              return;
            }

            setClassesForSectionPicker(
              rows || []
            );
            setPickedClassForSectionId(
              ""
            );
          } catch (error) {
            notify.error(
              error,
              "Classes could not be loaded"
            );
          }
        }
      )();

      return () => {
        active = false;
      };
    },
    [
      sectionClassPickerOpen,
    ]
  );

  const proceedToSectionModal =
    useCallback(
      async () => {

        const cls =
          classesForSectionPicker.find(
            (row) =>
              row.id ===
              pickedClassForSectionId
          );

        if (!cls) {
          notify.error(
            null,
            "Select a class"
          );
          return;
        }

        try {
          setLoadingSectionProceed(
            true
          );

          const cat =
            await getSectionCatalog(
              cls.id
            );

          setSectionCatalogForModal(
            cat || []
          );
          setSectionFlowClass(
            cls
          );
          setSectionClassPickerOpen(
            false
          );
          setSectionModalOpen(
            true
          );
        } catch (error) {
          notify.error(
            error,
            "Sections could not be loaded"
          );
        } finally {
          setLoadingSectionProceed(
            false
          );
        }
      },
      [
        classesForSectionPicker,
        pickedClassForSectionId,
      ]
    );

  const greeting =
    useMemo(
      () => {

        const hour =
          new Date().getHours();

        const name =
          user?.firstName ||
          user?.username ||
          "Principal";

        return `${greetingForHour(hour)}, ${name}!`;
      },
      [
        user,
      ]
    );

  const donutData =
    useMemo(
      () => {

        const rows =
          (dashboard?.classes ||
            [])
            .filter(
              (c) =>
                Number(
                  c.pendingFees || 0
                ) > 0
            )
            .map(
              (c) => ({
                name: c.name,
                value:
                  Number(
                    c.pendingFees || 0
                  ),
              })
            );

        return bucketDonutSlices(
          rows,
          {
            maxSlices: 6,
          }
        );
      },
      [
        dashboard,
      ]
    );

  const donutTotal =
    donutData.reduce(
      (
        acc,
        r
      ) =>
        acc + r.value,
      0
    );

  const lineData =
    insights?.dailyTrend || [];

  // Calculate cumulative collected
  let collectedCumulativeSum = 0;
  const chartData = lineData.map((item) => {
    collectedCumulativeSum += Number(item.collected || 0);
    return {
      ...item,
      collectedCumulative: collectedCumulativeSum,
    };
  });

  const xAxisTicks = lineData
    .filter((item) => {
      if (!item.date) return false;
      const day = new Date(item.date).getDate();
      return [1, 7, 14, 21, 28].includes(day);
    })
    .map((item) => item.date);

  const formatXAxisDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    return `${day} ${month}`;
  };

  const collectedThisMonth =
    insights?.collectedThisMonth ?? 0;

  const collectedLastMonth =
    insights?.collectedLastMonth ?? 0;

  const monthPercentChange =
    collectedLastMonth <= 0
      ? null
      : Math.round(
          ((
            collectedThisMonth -
            collectedLastMonth
          ) /
            collectedLastMonth) *
            100
        );

  const totalStudents =
    dashboard?.stats
      ?.totalStudents ?? 0;

  const totalPendingFees =
    dashboard?.stats
      ?.totalPendingFees ?? 0;

  const pendingStudentCount =
    directoryMeta?.stats
      ?.pending ?? 0;

  const totalClasses =
    dashboard?.stats
      ?.totalClasses ?? 0;

  const reminderNudge =
    () => {
      toast(
        "WhatsApp reminders are coming soon.",
        {
          icon: "🔔",
        }
      );
    };

  const stats = [
    {
      title: "Total Classes",
      value: String(totalClasses),
      note: "Active classes",
      icon: School,
      iconBg: "bg-[#d2e5fc]",
      iconClass: "text-blue-600",
      bg: "bg-[#eef5fc] border-[#d2e5fc]/60"
    },
    {
      title: "Total Students",
      value: totalStudents.toLocaleString("en-IN"),
      note: "Across all classes",
      icon: Users,
      iconBg: "bg-[#d3f4dd]",
      iconClass: "text-green-600",
      bg: "bg-[#ebfaf0] border-[#d3f4dd]/60"
    },
    {
      title: "Total Pending Fees",
      value: formatCurrency(totalPendingFees),
      note: "Across all classes",
      icon: IndianRupee,
      iconBg: "bg-[#fee5cd]",
      iconClass: "text-orange-600",
      bg: "bg-[#fff8ed] border-[#fee5cd]/60"
    },
    {
      title: "Collected (This Month)",
      value: formatCurrency(collectedThisMonth),
      note:
        monthPercentChange === null
          ? "No comparison yet"
          : `${monthPercentChange >= 0 ? "+" : ""}${monthPercentChange}% from last month`,
      icon: WalletCards,
      iconBg: "bg-[#ebdcfc]",
      iconClass: "text-purple-600",
      bg: "bg-[#fbf7fe] border-[#ebdcfc]/60"
    },
  ];

  if (loading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div
      className="
        mx-auto
        max-w-[1600px]
        space-y-6
        pb-24
        md:pb-6
      "
    >

      <div className="flex items-center justify-between">
        <div>
          <h1
            className="
              text-2xl
              font-bold
              tracking-tight
              text-slate-900
              md:text-3xl
            "
          >
            {greeting}
            {" "}
            <span
              className="inline-block"
              aria-hidden
            >
              👋
            </span>
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-slate-600
              md:text-base
            "
          >
            Here&apos;s what&apos;s happening in your school today.
          </p>
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
            (card) => {

              const Icon = card.icon;
              const isCollected = card.title === "Collected (This Month)" || card.note.startsWith("+");

              return (
                <div
                  key={card.title}
                  className={`
                    rounded-[24px]
                    border
                    ${card.bg}
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
                      ${card.iconBg}
                    `}
                  >
                    <Icon
                      className={card.iconClass}
                      size={22}
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
                      {card.title}
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
                      {card.value}
                    </h2>

                    <p
                      className={`
                        mt-0.5
                        text-[10px]
                        md:text-xs
                        font-bold
                        ${
                          isCollected
                            ? "text-emerald-600"
                            : "text-slate-500"
                        }
                      `}
                    >
                      {card.note}
                    </p>
                  </div>
                </div>
              );
            }
          )
        }

      </div>

      <div
        className="
          grid
          gap-4
          lg:grid-cols-2
        "
      >

        <div
          className="
            rounded-2xl
            border
            border-slate-100
            bg-white
            p-4
            shadow-sm
            lg:p-6
          "
        >

          <div
            className="
              mb-4
              flex
              flex-wrap
              items-center
              justify-between
              gap-2
            "
          >

            <h2
              className="
                text-base
                font-bold
                text-slate-900
              "
            >
              Fee Collection Overview
            </h2>

            <select
              value={chartMonth}
              onChange={(event) =>
                setChartMonth(
                  event.target
                    .value
                )
              }
              className="
                rounded-lg
                border
                border-slate-200
                bg-slate-50
                px-3
                py-1.5
                text-xs
                font-semibold
                text-slate-700
              "
            >
              <option value="thisMonth">
                This Month
              </option>
            </select>

          </div>

          <div
            className="
              h-64
              w-full
              md:h-72
            "
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <AreaChart
                data={chartData}
                margin={{
                  top: 16,
                  right: 8,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="date"
                  ticks={xAxisTicks}
                  tickFormatter={formatXAxisDate}
                  tick={{
                    fontSize: 10,
                    fill: "#64748b",
                  }}
                  stroke="#e2e8f0"
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />

                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{
                    fontSize: 10,
                    fill: "#64748b",
                  }}
                  stroke="#e2e8f0"
                  width={85}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
                  }}
                  formatter={(value, name) => [
                    formatCurrency(value),
                    name === "collectedCumulative" ? "Collected" : "Pending",
                  ]}
                />

                <Legend
                  verticalAlign="top"
                  align="center"
                  iconType="line"
                  iconSize={14}
                  wrapperStyle={{
                    paddingBottom: "24px",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="collectedCumulative"
                  name="Collected"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCollected)"
                  dot={{ r: 3.5, strokeWidth: 1.5, fill: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#22c55e" }}
                />

                <Area
                  type="monotone"
                  dataKey="pendingSnapshot"
                  name="Pending"
                  stroke="#f97316"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPending)"
                  dot={{ r: 3.5, strokeWidth: 1.5, fill: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#f97316" }}
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-100
            bg-white
            p-4
            shadow-sm
            lg:p-6
          "
        >

          <h2
            className="
              mb-4
              text-base
              font-bold
              text-slate-900
            "
          >
            Pending Fees by Class
          </h2>

            <div
              className="
                flex
                flex-col
                gap-4
                lg:flex-row
                lg:items-center
              "
            >

              {
                donutData.length === 0 ? (
                  <p
                    className="
                      w-full
                      py-8
                      text-center
                      text-sm
                      text-slate-500
                    "
                  >
                    No class-level pending fees to show.
                  </p>
                ) : (
                  <>

            <div
              className="
                mx-auto
                h-52
                w-52
                sm:h-56
                sm:w-56
              "
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={
                      58
                    }
                    outerRadius={
                      86
                    }
                    paddingAngle={2}
                  >
                    {
                      donutData.map(
                        (
                          entry,
                          index
                        ) => (

                          <Cell
                            key={
                              entry.name
                            }
                            fill={
                              DONUT_COLORS[
                                index %
                                  DONUT_COLORS.length
                              ]
                            }
                          />
                        )
                      )
                    }
                  </Pie>

                  <Tooltip
                    formatter={(
                      value
                    ) =>
                      formatCurrency(
                        value
                      )}
                  />

                </PieChart>

              </ResponsiveContainer>

            </div>

            <div
              className="
                min-w-0
                flex-1
                space-y-2
              "
            >

              <p
                className="
                  text-center
                  text-sm
                  font-semibold
                  text-slate-800
                  lg:text-left
                "
              >
                {formatCurrency(donutTotal)}

                <span
                  className="
                    block
                    text-xs
                    font-normal
                    text-slate-500
                  "
                >
                  Total Pending
                </span>

              </p>

              <ul
                className="
                  max-h-40
                  space-y-2
                  overflow-y-auto
                  text-sm
                "
              >

                {
                  donutData.map(
                    (
                      row,
                      index
                    ) => (

                      <li
                        key={
                          row.name
                        }
                        className="
                          flex
                          items-center
                          justify-between
                          gap-2
                        "
                      >

                        <span
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >

                          <span
                            className="
                              h-2.5
                              w-2.5
                              shrink-0
                              rounded-full
                            "
                            style={{
                              backgroundColor:
                                DONUT_COLORS[
                                  index %
                                    DONUT_COLORS.length
                                ],
                            }}
                          />

                          {row.name}

                        </span>

                        <span
                          className="
                            shrink-0
                            font-semibold
                            text-slate-800
                          "
                        >
                          {formatCurrency(
                            row.value
                          )}
                        </span>

                      </li>
                    )
                  )
                }

              </ul>

            </div>

                  </>
                )
              }

            </div>

          <button
            type="button"
            onClick={() =>
              navigate("/classes")
            }
            className="
              mt-4
              w-full
              text-center
              text-sm
              font-semibold
              text-blue-600
              hover:text-blue-700
            "
          >
            View All Classes
          </button>

        </div>

      </div>

      <div
        className="
          grid
          gap-4
          lg:grid-cols-3
        "
      >

        <div
          className="
            rounded-2xl
            border
            border-slate-100
            bg-white
            p-4
            shadow-sm
            lg:p-5
          "
        >

          <div
            className="
              mb-3
              flex
              items-center
              justify-between
            "
          >

            <h2
              className="
                text-base
                font-bold
                text-slate-900
              "
            >
              Recent Payments
            </h2>

            <button
              type="button"
              onClick={() =>
                navigate("/fees")
              }
              className="
                text-xs
                font-semibold
                text-blue-600
                hover:underline
              "
            >
              View All
            </button>

          </div>

          <ul
            className="
              divide-y
              divide-slate-100
            "
          >

            {
              (
                insights?.recentPayments ||
                []
              ).map(
                (p) => (

                  <li
                    key={p.id}
                    className="
                      flex
                      items-start
                      justify-between
                      gap-2
                      py-3
                      first:pt-0
                    "
                  >

                    <div>

                      <p
                        className="
                          text-sm
                          font-semibold
                          text-slate-900
                        "
                      >
                        {p.studentName}
                      </p>

                      <p
                        className="
                          text-xs
                          text-slate-500
                        "
                      >
                        {p.className}
                      </p>

                    </div>

                    <div
                      className="
                        text-right
                      "
                    >

                      <p
                        className="
                          text-sm
                          font-bold
                          text-emerald-600
                        "
                      >
                        {formatCurrency(
                          p.amount
                        )}
                      </p>

                      <p
                        className="
                          text-xs
                          text-slate-400
                        "
                      >
                        {formatRelativeTime(
                          p.paidAt
                        )}
                      </p>

                    </div>

                  </li>
                )
              )
            }

          </ul>

          {
            (
              insights?.recentPayments ||
              []
            ).length === 0 && (
              <p
                className="
                  py-6
                  text-center
                  text-sm
                  text-slate-500
                "
              >
                No recent payments yet.
              </p>
            )
          }

        </div>

        <div
          className="
            space-y-4
          "
        >

          <div
            className="
              rounded-2xl
              border
              border-slate-100
              bg-white
              p-4
              shadow-sm
              lg:p-5
            "
          >

            <h2
              className="
                text-base
                font-bold
                text-slate-900
              "
            >
              Today&apos;s Reminders
            </h2>

            <p
              className="
                mt-2
                text-sm
                text-slate-600
              "
            >
              {pendingStudentCount}{" "}
              Pending Students
            </p>

            <p
              className="
                text-sm
                font-semibold
                text-slate-800
              "
            >
              {formatCurrency(
                totalPendingFees
              )}{" "}
              Total Pending Amount
            </p>

            <button
              type="button"
              onClick={reminderNudge}
              className="
                mt-4
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-orange-500
                py-3.5
                text-sm
                font-bold
                text-white
                shadow
                transition
                hover:bg-orange-600
              "
            >
              <Bell size={18} />
              Send WhatsApp Reminders
            </button>

          </div>

          <div
            className="
              flex
              gap-3
              rounded-2xl
              border
              border-amber-200
              bg-amber-50
              p-4
            "
          >

            <Megaphone
              className="
                mt-0.5
                h-8
                w-8
                shrink-0
                text-amber-700
              "
            />

            <div>

              <h3
                className="
                  text-sm
                  font-bold
                  text-amber-900
                "
              >
                Important Notice
              </h3>

              <p
                className="
                  mt-1
                  text-xs
                  leading-relaxed
                  text-amber-900/80
                "
              >
                May &amp; June are vacation months.
                Automatic reminders are paused.
                School will reopen on 1st July.
              </p>

            </div>

          </div>

        </div>

        <div
          className="
            space-y-4
          "
        >

          <div
            className="
              rounded-2xl
              border
              border-slate-100
              bg-white
              p-4
              shadow-sm
              lg:p-5
            "
          >

            <h2
              className="
                text-base
                font-bold
                text-slate-900
              "
            >
              Quick Actions
            </h2>

            <div
              className="
                mt-4
                grid
                grid-cols-2
                gap-3
                lg:grid-cols-3
              "
            >

              <button
                type="button"
                onClick={() =>
                  setAddStudentOpen(
                    true
                  )
                }
                className="
                  flex
                  min-h-[80px]
                  flex-col
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  px-2
                  py-3
                  text-center
                  text-xs
                  font-bold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-blue-700
                  sm:text-sm
                "
              >

                <UserPlus
                  size={22}
                />

                Add Student

              </button>

              <button
                type="button"
                onClick={() =>
                  setPickStudentOpen(
                    true
                  )
                }
                className="
                  flex
                  min-h-[80px]
                  flex-col
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-emerald-600
                  px-2
                  py-3
                  text-center
                  text-xs
                  font-bold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-emerald-700
                  sm:text-sm
                "
              >

                <Wallet size={22} />

                Record Payment

              </button>

              <button
                type="button"
                onClick={() =>
                  setAddClassOpen(
                    true
                  )
                }
                className="
                  flex
                  min-h-[80px]
                  flex-col
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-sky-600
                  px-2
                  py-3
                  text-center
                  text-xs
                  font-bold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-sky-700
                  sm:text-sm
                "
              >

                <Building2
                  size={22}
                />

                Add Class

              </button>

              <button
                type="button"
                onClick={() =>
                  setSectionClassPickerOpen(
                    true
                  )
                }
                className="
                  flex
                  min-h-[80px]
                  flex-col
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-indigo-600
                  px-2
                  py-3
                  text-center
                  text-xs
                  font-bold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-indigo-700
                  sm:text-sm
                "
              >

                <Layers
                  size={22}
                />

                Add Section

              </button>

              <button
                type="button"
                onClick={() =>
                  setReminderModalOpen(
                    true
                  )
                }
                className="
                  flex
                  min-h-[80px]
                  flex-col
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-orange-500
                  px-2
                  py-3
                  text-center
                  text-xs
                  font-bold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-orange-600
                  sm:text-sm
                "
              >

                <Bell size={22} />

                Send Reminder

              </button>

              <button
                type="button"
                onClick={() =>
                  setReportsOpen(
                    true
                  )
                }
                className="
                  flex
                  min-h-[80px]
                  flex-col
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-violet-600
                  px-2
                  py-3
                  text-center
                  text-xs
                  font-bold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-violet-700
                  sm:text-sm
                "
              >

                <FileText size={22} />

                View Reports

              </button>

            </div>

          </div>

          <div
            className="
              rounded-2xl
              border
              border-slate-100
              bg-white
              p-4
              shadow-sm
              lg:p-5
            "
          >

            <h2
              className="
                text-base
                font-bold
                text-slate-900
              "
            >
              Top Pending Students
            </h2>

            <ol
              className="
                mt-3
                space-y-3
              "
            >

              {
                topPendingStudents.map(
                  (
                    student,
                    index
                  ) => (

                    <li
                      key={
                        student.id
                      }
                      className="
                        flex
                        items-start
                        justify-between
                        gap-2
                      "
                    >

                      <div
                        className="
                          flex
                          min-w-0
                          gap-2
                        "
                      >

                        <span
                          className="
                            flex
                            h-7
                            w-7
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-slate-100
                            text-xs
                            font-bold
                            text-slate-700
                          "
                        >
                          {index + 1}
                        </span>

                        <div
                          className="
                            min-w-0
                          "
                        >

                          <p
                            className="
                              truncate
                              text-sm
                              font-semibold
                              text-slate-900
                            "
                          >
                            {student.fullName}
                          </p>

                          <p
                            className="
                              text-xs
                              text-slate-500
                            "
                          >
                            {student.className}
                          </p>

                        </div>

                      </div>

                      <span
                        className="
                          shrink-0
                          text-sm
                          font-bold
                          text-red-600
                        "
                      >
                        {formatCurrency(
                          student.pendingFees
                        )}
                      </span>

                    </li>
                  )
                )
              }

            </ol>

            {
              topPendingStudents.length ===
                0 && (
                <p
                  className="
                    mt-3
                    text-sm
                    text-slate-500
                  "
                >
                  No pending balances.
                </p>
              )
            }

          </div>

        </div>

      </div>

      <button
        type="button"
        onClick={reminderNudge}
        className="
          fixed
          bottom-[88px]
          right-4
          z-[60]
          flex
          h-14
          items-center
          gap-2
          rounded-full
          bg-orange-500
          px-5
          text-sm
          font-bold
          text-white
          shadow-lg
          ring-4
          ring-white/40
          transition
          hover:bg-orange-600
          md:bottom-6
          md:right-8
        "
      >
        <Bell size={20} />
        Reminders
      </button>

      {
        addStudentOpen && (
          <AddStudentModal
            enableClassSectionPickers
            onClose={() =>
              setAddStudentOpen(
                false
              )
            }
            onSaved={loadData}
          />
        )
      }

      <PickStudentModal
        open={pickStudentOpen}
        onClose={() =>
          setPickStudentOpen(
            false
          )
        }
        onPick={(student) => {

          setPickStudentOpen(
            false
          );
          setPaymentStudent(
            student
          );
        }}
      />

      <RecordPaymentModal
        open={
          Boolean(
            paymentStudent
          )
        }
        student={{
          id:
            paymentStudent?.id,
          fullName:
            paymentStudent?.fullName,
          phone:
            paymentStudent?.phone,
        }}
        onClose={() =>
          setPaymentStudent(
            null
          )
        }
        onSaved={loadData}
      />

      {
        addClassOpen && (
          <AddClassModal
            setShowAddModal={
              setAddClassOpen
            }
            classCatalog={
              classCatalogForModal
            }
            onRefresh={
              loadData
            }
          />
        )
      }

      {
        sectionModalOpen &&
          sectionFlowClass && (
          <AddSectionModal
            selectedClass={
              sectionFlowClass
            }
            sectionCatalog={
              sectionCatalogForModal
            }
            onClose={() => {

              setSectionModalOpen(
                false
              );
              setSectionFlowClass(
                null
              );
            }}
            onRefresh={
              loadData
            }
          />
        )
      }

      {
        sectionClassPickerOpen && (
          <ModalFrame
            title="Add section"
            description="Choose which class to add a section under."
            onClose={() =>
              setSectionClassPickerOpen(
                false
              )
            }
          >

            <label
              className="
                flex
                flex-col
                gap-2
              "
            >

              <span
                className="
                  text-xs
                  font-bold
                  text-slate-600
                "
              >
                Class
              </span>

              <select
                value={
                  pickedClassForSectionId
                }
                onChange={(event) =>
                  setPickedClassForSectionId(
                    event.target
                      .value
                  )
                }
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3
                  text-sm
                  font-semibold
                  text-slate-800
                "
              >

                <option value="">
                  Select class
                </option>

                {
                  classesForSectionPicker.map(
                    (row) => (
                      <option
                        key={row.id}
                        value={row.id}
                      >
                        {row.name}
                      </option>
                    )
                  )
                }

              </select>

            </label>

            <button
              type="button"
              disabled={
                loadingSectionProceed
              }
              onClick={
                proceedToSectionModal
              }
              className="
                mt-4
                flex
                h-11
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-indigo-600
                text-sm
                font-bold
                text-white
                disabled:opacity-50
              "
            >

              {
                loadingSectionProceed ? (
                  <LoaderCircle
                    className="
                      h-5
                      w-5
                      animate-spin
                    "
                  />
                ) : null
              }
              Continue
            </button>

          </ModalFrame>
        )
      }

      {
        reportsOpen && (
          <ModalFrame
            title="Reports"
            description="Open detailed fee and ledger views."
            onClose={() =>
              setReportsOpen(
                false
              )
            }
          >

            <div
              className="
                flex
                flex-col
                gap-3
              "
            >

              <button
                type="button"
                onClick={() => {

                  setReportsOpen(
                    false
                  );
                  navigate("/fees");
                }}
                className="
                  rounded-xl
                  bg-blue-600
                  py-3
                  text-sm
                  font-bold
                  text-white
                  hover:bg-blue-700
                "
              >
                Open Fees &amp; ledger
              </button>

              <button
                type="button"
                onClick={() => {

                  setReportsOpen(
                    false
                  );
                  navigate(
                    "/students"
                  );
                }}
                className="
                  rounded-xl
                  border
                  border-slate-200
                  py-3
                  text-sm
                  font-semibold
                  text-slate-800
                  hover:bg-slate-50
                "
              >
                Open student directory
              </button>

              <button
                type="button"
                onClick={() =>
                  setReportsOpen(
                    false
                  )
                }
                className="
                  text-center
                  text-sm
                  font-medium
                  text-slate-500
                  hover:text-slate-700
                "
              >
                Close
              </button>

            </div>

          </ModalFrame>
        )
      }

      {
        reminderModalOpen && (
          <ModalFrame
            title="Send Reminder"
            description="WhatsApp reminders will be available in a future update."
            onClose={() =>
              setReminderModalOpen(
                false
              )
            }
          >

            <p
              className="
                text-sm
                text-slate-600
              "
            >
              You&apos;ll be able to message parents with one tap from here.
            </p>

            <button
              type="button"
              onClick={() =>
                setReminderModalOpen(
                  false
                )
              }
              className="
                mt-4
                w-full
                rounded-xl
                bg-slate-900
                py-3
                text-sm
                font-bold
                text-white
              "
            >
              OK
            </button>

          </ModalFrame>
        )
      }

    </div>
  );
}
