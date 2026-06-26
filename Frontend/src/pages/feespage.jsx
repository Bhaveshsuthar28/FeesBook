import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Filter,
  LoaderCircle,
  ReceiptText,
  Search,
  Wallet,
  WalletCards,
} from "lucide-react";

import StudentReceiptsModal from "../components/fees/StudentReceiptsModal.jsx";
import SendWhatsappModal from "../components/common/SendWhatsappModal.jsx";
import { FaWhatsapp } from "react-icons/fa";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Tooltip from "../components/common/Tooltip.jsx";

import {
  useNavigate,
} from "react-router-dom";

import RecordPaymentModal from "../components/payments/RecordPaymentModal.jsx";

import {
  downloadStudentPaymentReceipt,
  getFeesLedger,
} from "../lib/api/studentapi.js";

import {
  notify,
} from "../lib/toast.js";

import {
  CardListSkeleton,
  FeesPageSkeleton,
  TableBodySkeleton,
} from "../components/skeleton/PageSkeletons.jsx";

const pageSize = 10;

const statusTabs = [
  "All",
  "Paid",
  "Partial",
  "Unpaid",
  "Overdue",
];

const paymentModes = [
  "Cash",
  "UPI",
  "Card",
  "Bank Transfer",
  "Cheque",
];

const statusClass = {
  Paid:
    "bg-emerald-100 text-emerald-700",
  Partial:
    "bg-orange-100 text-orange-700",
  Unpaid:
    "bg-red-100 text-red-700",
  Overdue:
    "bg-red-200 text-red-800",
};

const formatCurrency =
  (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate =
  (value) => {
    if (!value) {
      return "-";
    }

    return new Date(Number(value))
      .toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
  };

const currentMonth =
  () => {
    const now =
      new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
  };

const initials =
  (student) =>
    String(
      student.fullName ||
        "S"
    )
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

function StudentAvatar({
  student,
}) {
  if (student.photoUrl) {
    return (
      <img
        src={student.photoUrl}
        alt={student.fullName}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-indigo-700">
      {initials(student)}
    </div>
  );
}

function StatCard({
  title,
  value,
  note,
  icon: Icon,
  accent,
}) {
  return (
    <div
      className={`
        rounded-[24px]
        border
        ${accent.bg}
        ${accent.border}
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
          ${accent.iconBg}
        `}
      >
        <Icon
          size={22}
          className={accent.iconColor}
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
          {title}
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
          {value}
        </h2>

        <p
          className={`
            mt-0.5
            text-[10px]
            md:text-xs
            font-bold
            ${accent.noteColor || "text-slate-500"}
          `}
        >
          {note}
        </p>
      </div>
    </div>
  );
}


export default function FeesPage() {
  const navigate =
    useNavigate();
  const [
    ledger,
    setLedger,
  ] = useState({
    students: [],
    stats: {},
    statusCounts: {},
    filterOptions: {
      classes: [],
      sections: [],
      paymentModes: [],
    },
    pagination: {
      page: 1,
      total: 0,
      totalPages: 1,
    },
  });
  const [
    loading,
    setLoading,
  ] = useState(true);
  const [
    hasLoaded,
    setHasLoaded,
  ] = useState(false);
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("All");
  const [
    classId,
    setClassId,
  ] = useState("");
  const [
    sectionId,
    setSectionId,
  ] = useState("");
  const [
    monthYear,
    setMonthYear,
  ] = useState(currentMonth);
  const [
    paymentMode,
    setPaymentMode,
  ] = useState("");
  const [
    studentStatus,
    setStudentStatus,
  ] = useState("active");
  const [
    page,
    setPage,
  ] = useState(1);
  const [
    paymentStudent,
    setPaymentStudent,
  ] = useState(null);
  const [
    showMobileFilters,
    setShowMobileFilters,
  ] = useState(false);
  const [
    receiptsStudent,
    setReceiptsStudent,
  ] = useState(null);

  const [whatsappStudent, setWhatsappStudent] = useState(null);
  const resetFilters =
    () => {
      setSearch("");
      setStatus("All");
      setClassId("");
      setSectionId("");
      setMonthYear(currentMonth());
      setPaymentMode("");
      setStudentStatus("active");
      setPage(1);
    };

  const visibleSections =
    classId
      ? ledger.filterOptions.sections.filter(
          (section) =>
            section.classId === classId
        )
      : ledger.filterOptions.sections;

  const refreshLedger =
    useCallback(async () => {
      try {
        setLoading(true);
        const result =
          await getFeesLedger({
            status,
            page,
            limit: pageSize,
            search,
            classId,
            sectionId,
            monthYear,
            paymentMode,
            studentStatus,
          });
        setLedger(result);
      } catch (apiError) {
        notify.error(
          apiError,
          "Fees ledger could not be loaded"
        );
      } finally {
        setLoading(false);
        setHasLoaded(true);
      }
    }, [
      classId,
      monthYear,
      page,
      paymentMode,
      search,
      sectionId,
      status,
      studentStatus,
    ]);

  useEffect(() => {
    refreshLedger();
  }, [refreshLedger]);

  useEffect(() => {
    setPage(1);
  }, [
    classId,
    monthYear,
    paymentMode,
    search,
    sectionId,
    status,
    studentStatus,
  ]);

  const stats =
    useMemo(
      () => [
        {
          title: "Total Collected",
          value:
            formatCurrency(
              ledger.stats.totalCollected
            ),
          note: "Live fee collection",
          icon: Wallet,
          accent: {
            bg: "bg-[#ebfaf0]",
            border: "border-[#d3f4dd]/60",
            iconBg: "bg-[#d3f4dd]",
            iconColor: "text-green-600",
            noteColor: "text-emerald-600",
          },
        },
        {
          title: "Pending Fees",
          value:
            formatCurrency(
              ledger.stats.pendingFees
            ),
          note: "Remaining balance",
          icon: ReceiptText,
          accent: {
            bg: "bg-[#fff8ed]",
            border: "border-[#fee5cd]/60",
            iconBg: "bg-[#fee5cd]",
            iconColor: "text-orange-600",
            noteColor: "text-slate-500",
          },
        },
        {
          title: "Partial Payments",
          value:
            formatCurrency(
              ledger.stats.partialPayments
            ),
          note: "Collected from partial rows",
          icon: WalletCards,
          accent: {
            bg: "bg-[#eef5fc]",
            border: "border-[#d2e5fc]/60",
            iconBg: "bg-[#d2e5fc]",
            iconColor: "text-blue-600",
            noteColor: "text-slate-500",
          },
        },
        {
          title: "Overdue Students",
          value:
            Number(
              ledger.stats.overdueStudents ||
                0
            ).toLocaleString("en-IN"),
          note: "No payment this month",
          icon: AlertTriangle,
          accent: {
            bg: "bg-[#fdf2f2]",
            border: "border-[#fde8e8]/60",
            iconBg: "bg-[#fde8e8]",
            iconColor: "text-red-600",
            noteColor: "text-red-600",
          },
        },
      ],
      [ledger.stats]
    );

  const paginationItems =
    useMemo(() => {
      const totalPages =
        ledger.pagination.totalPages || 1;
      if (totalPages <= 7) {
        return Array.from(
          { length: totalPages },
          (_, index) => index + 1
        );
      }
      const pages = new Set([
        1,
        totalPages,
        page - 1,
        page,
        page + 1,
      ]);
      const sortedPages = [...pages]
        .filter(
          (item) =>
            item >= 1 &&
            item <= totalPages
        )
        .sort((a, b) => a - b);
      const items = [];
      sortedPages.forEach(
        (item, index) => {
          const previous =
            sortedPages[index - 1];
          if (
            previous &&
            item - previous > 1
          ) {
            items.push("...");
          }
          items.push(item);
        }
      );
      return items;
    }, [
      ledger.pagination.totalPages,
      page,
    ]);

  const exportLedger =
    () => {
      const header = [
        "Student",
        "Admission No",
        "Class",
        "Section",
        "Total Fee",
        "Paid Amount",
        "Due Amount",
        "Last Payment",
        "Status",
      ];
      const rows =
        ledger.students.map(
          (student) => [
            student.fullName,
            student.admissionNo,
            student.className,
            student.sectionName,
            student.totalFees,
            student.paidAmount,
            student.dueAmount,
            formatDate(
              student.lastPayment?.paidAt
            ),
            student.status,
          ]
        );
      const tableRows =
        [header, ...rows]
          .map(
            (row) =>
              `<tr>${row
                .map(
                  (cell) =>
                    `<td>${String(cell ?? "")}</td>`
                )
                .join("")}</tr>`
          )
          .join("");
      const blob =
        new Blob(
          [
            `<html><body><table>${tableRows}</table></body></html>`,
          ],
          {
            type: "application/vnd.ms-excel;charset=utf-8;",
          }
        );
      const url =
        URL.createObjectURL(blob);
      const link =
        document.createElement("a");
      link.href = url;
      link.download = `fees-ledger-${new Date()
        .toISOString()
        .slice(0, 10)}.xls`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

  const handleViewStudent =
    (student) => {
      navigate(
        `/students/${student.id}`
      );
    };

  const handleSavePayment =
    (student) => {
      setPaymentStudent(student);
    };

  const downloadReceipt =
    async ({
      studentId,
      paymentId,
    }) => {
      if (!studentId || !paymentId) {
        notify.error(
          null,
          "No payment receipt is available yet"
        );
        return;
      }

      try {
        const result =
          await downloadStudentPaymentReceipt({
            studentId,
            paymentId,
          });
        const url =
          URL.createObjectURL(
            result.blob
          );
        const link =
          document.createElement("a");

        link.href = url;
        link.download =
          result.fileName;
        document.body.appendChild(
          link
        );
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch (apiError) {
        notify.error(
          apiError,
          "Receipt could not be downloaded"
        );
      }
    };

  const renderActions =
    (student) => (
      <div className="flex items-center gap-2">
        <Tooltip content="View student">
          <button
            type="button"
            onClick={() =>
              handleViewStudent(student)
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Eye size={17} />
          </button>
        </Tooltip>
        <Tooltip content="Save payment">
          <button
            type="button"
            onClick={() =>
              handleSavePayment(student)
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-indigo-600 hover:bg-indigo-50"
          >
            <WalletCards size={17} />
          </button>
        </Tooltip>
        <Tooltip content="Send WhatsApp Reminder">
          <button
            type="button"
            onClick={() =>
              setWhatsappStudent(student)
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 active:scale-95 transition"
          >
            <FaWhatsapp size={17} className="fill-[#25D366]" />
          </button>
        </Tooltip>
      </div>
    );

  if (
    loading &&
    !hasLoaded
  ) {
    return (
      <div className="mx-auto w-full max-w-[1440px]">
        <FeesPageSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5">
      <div className="flex items-center justify-between md:hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-normal text-slate-950">
            Fees
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Track and manage all student fee payments
          </p>
        </div>
      </div>

      <div className="hidden items-center justify-between md:flex">
        <div>
          <h1 className="text-3xl font-extrabold tracking-normal text-slate-950">
            Fees
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Track and manage all student fee payments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {
          stats.map((stat) => (
            <StatCard
              key={stat.title}
              {...stat}
            />
          ))
        }
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="hidden gap-4 md:grid md:grid-cols-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Student Status
              </span>
              <select
                value={studentStatus}
                onChange={(event) =>
                  setStudentStatus(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
              >
                <option value="active">Active</option>
                <option value="alumni">Alumni</option>
                <option value="all">All</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Class
              </span>
              <select
                value={classId}
                onChange={(event) => {
                  setClassId(
                    event.target.value
                  );
                  setSectionId("");
                }}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
              >
                <option value="">
                  All Classes
                </option>
                {
                  ledger.filterOptions.classes.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    )
                  )
                }
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Section
              </span>
              <select
                value={sectionId}
                onChange={(event) =>
                  setSectionId(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
              >
                <option value="">
                  All Sections
                </option>
                {
                  visibleSections.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {classId ? item.name : `${ledger.filterOptions.classes.find(c => c.id === item.classId)?.name || ''} - ${item.name}`}
                      </option>
                    )
                  )
                }
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Month / Year
              </span>
              <input
                type="month"
                value={monthYear}
                onChange={(event) =>
                  setMonthYear(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Payment Mode
              </span>
              <select
                value={paymentMode}
                onChange={(event) =>
                  setPaymentMode(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
              >
                <option value="">
                  All Modes
                </option>
                {
                  [
                    ...new Set([
                      ...paymentModes,
                      ...ledger.filterOptions
                        .paymentModes,
                    ]),
                  ].map((mode) => (
                    <option
                      key={mode}
                      value={mode}
                    >
                      {mode}
                    </option>
                  ))
                }
              </select>
            </label>
          </div>

          <div className="mt-4 hidden items-center gap-3 md:flex">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by student name, admission no. or phone..."
                className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-semibold outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-slate-700"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={exportLedger}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-slate-700"
              >
                <Download size={17} />
                Export
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowMobileFilters(
                (current) => !current
              )
            }
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 md:hidden"
          >
            <span className="flex items-center gap-2">
              <Filter size={16} />
              Filters
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${showMobileFilters ? "rotate-180" : ""}`}
            />
          </button>

          {
            showMobileFilters && (
              <div className="mt-3 grid gap-3 md:hidden">
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500">
                    Student Status
                  </span>
                  <select
                    value={studentStatus}
                    onChange={(event) =>
                      setStudentStatus(
                        event.target.value
                      )
                    }
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none w-full"
                  >
                    <option value="active">Active</option>
                    <option value="alumni">Alumni</option>
                    <option value="all">All</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500">
                    Class
                  </span>
                  <select
                    value={classId}
                    onChange={(event) => {
                      setClassId(
                        event.target.value
                      );
                      setSectionId("");
                    }}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="">
                      All Classes
                    </option>
                    {
                      ledger.filterOptions.classes.map(
                        (item) => (
                          <option
                            key={item.id}
                            value={item.id}
                          >
                            {item.name}
                          </option>
                        )
                      )
                    }
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500">
                    Section
                  </span>
                  <select
                    value={sectionId}
                    onChange={(event) =>
                      setSectionId(
                        event.target.value
                      )
                    }
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="">
                      All Sections
                    </option>
                    {
                      visibleSections.map(
                        (item) => (
                          <option
                            key={item.id}
                            value={item.id}
                          >
                            {classId ? item.name : `${ledger.filterOptions.classes.find(c => c.id === item.classId)?.name || ''} - ${item.name}`}
                          </option>
                        )
                      )
                    }
                  </select>
                </label>
                <label className="flex items-center gap-3">
                  <span className="whitespace-nowrap text-xs font-semibold text-slate-500">
                    Month / Year
                  </span>
                  <input
                    type="month"
                    value={monthYear}
                    onChange={(event) =>
                      setMonthYear(
                        event.target.value
                      )
                    }
                    className="h-11 w-full flex-1 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500">
                    Payment Mode
                  </span>
                  <select
                    value={paymentMode}
                    onChange={(event) =>
                      setPaymentMode(
                        event.target.value
                      )
                    }
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="">
                      All Modes
                    </option>
                    {
                      [
                        ...new Set([
                          ...paymentModes,
                          ...ledger
                            .filterOptions
                            .paymentModes,
                        ]),
                      ].map((mode) => (
                        <option
                          key={mode}
                          value={mode}
                        >
                          {mode}
                        </option>
                      ))
                    }
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500">
                    Search
                  </span>
                  <div className="relative">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search by student name, admission no. or phone..."
                      className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-semibold outline-none"
                    />
                  </div>
                </label>
                <button
                  type="button"
                  onClick={exportLedger}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-700"
                >
                  <Download size={17} />
                  Export
                </button>
              </div>
            )
          }
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3">
          {
            statusTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatus(tab)}
                className={`
                  h-10
                  shrink-0
                  rounded-full
                  px-4
                  text-sm
                  font-semibold
                  ${
                    status === tab
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700"
                  }
                `}
              >
                {tab} ({ledger.statusCounts[tab] || 0})
              </button>
            ))
          }
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-slate-50 text-xs font-extrabold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-4">Student</th>
                <th className="px-4 py-4">Class & Section</th>
                <th className="px-4 py-4">Total Fee</th>
                <th className="px-4 py-4">Paid Amount</th>
                <th className="px-4 py-4">Due Amount</th>
                <th className="px-4 py-4">Last Payment</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Receipt</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className={loading ? "opacity-60" : ""}>
              {
                loading ? (
                  <TableBodySkeleton
                    rows={6}
                    columns={9}
                  />
                ) : ledger.students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-sm font-semibold text-slate-500"
                    >
                      No fee ledger records found.
                    </td>
                  </tr>
                ) : (
                  ledger.students.map(
                    (student) => (
                      <tr
                        key={student.id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar student={student} />
                            <div>
                              <p className="text-sm font-extrabold text-slate-950">
                                {student.fullName}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                Adm No: {student.admissionNo}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-slate-700">
                          {student.className} {student.sectionName}
                        </td>
                        <td className="px-4 py-4 text-sm font-extrabold text-slate-800">
                          {formatCurrency(student.totalFees)}
                        </td>
                        <td className="px-4 py-4 text-sm font-extrabold text-emerald-600">
                          {formatCurrency(student.paidAmount)}
                        </td>
                        <td className="px-4 py-4 text-sm font-extrabold text-red-600">
                          {formatCurrency(student.dueAmount)}
                          {Number(student.overdueFees || 0) > 0 && (
                            <span className="text-[10px] text-amber-600 block font-bold">
                              Overdue {formatCurrency(student.overdueFees)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-slate-600">
                          {formatDate(student.lastPayment?.paidAt)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`${statusClass[student.status] || statusClass.Unpaid} rounded-full px-3 py-1 text-xs font-extrabold`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Tooltip content="All receipts">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setReceiptsStudent(
                                  student
                                );
                              }}
                              className="inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-xl border border-slate-200 px-2 text-red-500 hover:bg-red-50"
                            >
                              <FileText size={16} />
                              {(student.paymentCount || 0) > 0 && (
                                <span className="text-[10px] font-extrabold">
                                  {student.paymentCount}
                                </span>
                              )}
                            </button>
                          </Tooltip>
                        </td>
                        <td className="px-4 py-4">
                          {renderActions(student)}
                        </td>
                      </tr>
                    )
                  )
                )
              }
            </tbody>
          </table>
        </div>

        <div className="space-y-3 bg-slate-50 p-3 md:hidden">
          {
            loading ? (
              <CardListSkeleton rows={4} />
            ) : ledger.students.length === 0 ? (
              <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-500">
                No fee ledger records found.
              </div>
            ) : (
              ledger.students.map(
                (student) => (
                  <article
                    key={student.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <StudentAvatar student={student} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-950">
                            {student.fullName}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {student.className} {student.sectionName} · {student.admissionNo}
                          </p>
                        </div>
                      </div>
                      <span className={`${statusClass[student.status] || statusClass.Unpaid} shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold`}>
                        {student.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold">
                      <p className="text-emerald-600">
                        Paid {formatCurrency(student.paidAmount)}
                        <span className="text-slate-400"> / </span>
                        <span className="text-slate-600">
                          Total {formatCurrency(student.totalFees)}
                        </span>
                      </p>
                      <div className="text-right">
                        <p className="text-red-600 font-extrabold">
                          Due {formatCurrency(student.dueAmount)}
                        </p>
                        {Number(student.overdueFees || 0) > 0 && (
                          <span className="text-[10px] text-amber-600 block font-bold mt-0.5">
                            Overdue {formatCurrency(student.overdueFees)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      <p className="text-xs font-bold text-slate-500">
                        Last: {formatDate(student.lastPayment?.paidAt)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Tooltip content="All receipts">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setReceiptsStudent(student);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-red-500 hover:bg-red-50"
                          >
                            <FileText size={17} />
                          </button>
                        </Tooltip>
                        <Tooltip content="View student">
                          <button
                            type="button"
                            onClick={() =>
                              handleViewStudent(student)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            <Eye size={17} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Save payment">
                          <button
                            type="button"
                            onClick={() =>
                              handleSavePayment(student)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-indigo-600 hover:bg-indigo-50"
                          >
                            <WalletCards size={17} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Send WhatsApp Reminder">
                          <button
                            type="button"
                            onClick={() =>
                              setWhatsappStudent(student)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 active:scale-95 transition"
                          >
                            <FaWhatsapp size={17} className="fill-[#25D366]" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </article>
                )
              )
            )
          }
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Showing {ledger.pagination.total ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, ledger.pagination.total || 0)} of {ledger.pagination.total || 0} records
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage((value) =>
                  Math.max(1, value - 1)
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="hidden items-center gap-2 md:flex">
              {
                paginationItems.map(
                  (item, index) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-sm font-semibold text-slate-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setPage(item)
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-extrabold ${
                          page === item
                            ? "bg-indigo-600 text-white"
                            : "border border-slate-200 text-slate-700"
                        }`}
                      >
                        {item}
                      </button>
                    )
                )
              }
            </div>
            <button
              type="button"
              disabled={
                page >=
                (ledger.pagination.totalPages || 1)
              }
              onClick={() =>
                setPage((value) =>
                  value + 1
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <RecordPaymentModal
        open={Boolean(paymentStudent)}
        student={paymentStudent}
        onClose={() =>
          setPaymentStudent(null)
        }
        onSaved={refreshLedger}
        onReceiptReady={downloadReceipt}
        paymentModes={paymentModes}
      />

      <StudentReceiptsModal
        open={Boolean(receiptsStudent)}
        student={receiptsStudent}
        onClose={() =>
          setReceiptsStudent(null)
        }
      />

      <SendWhatsappModal
        isOpen={Boolean(whatsappStudent)}
        student={whatsappStudent}
        onClose={() => setWhatsappStudent(null)}
      />
    </div>
  );
}
