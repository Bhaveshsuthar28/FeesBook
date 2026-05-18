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
  MoreVertical,
  ReceiptText,
  Search,
  Wallet,
  WalletCards,
  X,
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
  getFeesLedger,
  recordStudentPayment,
} from "../lib/api/studentapi.js";

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
  icon,
  accent,
}) {
  const StatIcon =
    icon;

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${accent.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-extrabold ${accent.text}`}>
            {title}
          </p>
          <p className="mt-3 text-2xl font-extrabold tracking-normal text-slate-950">
            {value}
          </p>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            {note}
          </p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${accent.icon}`}>
          <StatIcon size={20} />
        </div>
      </div>
    </div>
  );
}

function ReceiptModal({
  student,
  onClose,
}) {
  if (!student) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase text-indigo-600">
              Payment Receipt
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950">
              {student.fullName}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {student.className} {student.sectionName} · Adm No {student.admissionNo}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-700">
              Paid Amount
            </p>
            <p className="mt-2 text-xl font-extrabold text-emerald-700">
              {formatCurrency(student.lastPayment?.amount)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-500">
              Payment Mode
            </p>
            <p className="mt-2 text-xl font-extrabold text-slate-900">
              {student.lastPayment?.paymentMode || "Cash"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-slate-600">
          <div className="flex justify-between py-2">
            <span>Total Fee</span>
            <span className="font-extrabold text-slate-950">
              {formatCurrency(student.totalFees)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span>Total Paid</span>
            <span className="font-extrabold text-emerald-600">
              {formatCurrency(student.paidAmount)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span>Due Amount</span>
            <span className="font-extrabold text-red-600">
              {formatCurrency(student.dueAmount)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span>Last Payment</span>
            <span className="font-extrabold text-slate-950">
              {formatDate(student.lastPayment?.paidAt)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-5 h-11 w-full rounded-xl bg-indigo-600 text-sm font-extrabold text-white"
        >
          Print Receipt
        </button>
      </div>
    </div>
  );
}

function PaymentModal({
  student,
  onClose,
  onSaved,
}) {
  const firstFee =
    student?.dueFees?.[0];
  const [
    studentFeeId,
    setStudentFeeId,
  ] = useState(firstFee?.id || "");
  const [
    amount,
    setAmount,
  ] = useState(firstFee?.dueAmount || "");
  const [
    paymentMode,
    setPaymentMode,
  ] = useState("Cash");
  const [
    saving,
    setSaving,
  ] = useState(false);
  const [
    error,
    setError,
  ] = useState("");

  if (!student) {
    return null;
  }

  const selectedFee =
    student.dueFees?.find(
      (fee) =>
        fee.id === studentFeeId
    );

  const savePayment =
    async () => {
      if (
        !studentFeeId ||
        Number(amount) <= 0
      ) {
        setError(
          "Select a fee and enter payment amount"
        );
        return;
      }

      try {
        setSaving(true);
        setError("");
        await recordStudentPayment({
          studentId:
            student.id,
          data: {
            studentFeeId,
            amount:
              Number(amount),
            paymentMode,
            paidAt:
              Date.now(),
          },
        });
        await onSaved();
        onClose();
      } catch (apiError) {
        setError(
          apiError.response?.data?.message ||
            apiError.message ||
            "Payment could not be recorded"
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase text-indigo-600">
              Record Payment
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950">
              {student.fullName}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Due {formatCurrency(student.dueAmount)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
          >
            <X size={17} />
          </button>
        </div>

        {
          student.dueFees?.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              This student has no pending fee balance.
            </p>
          ) : (
            <div className="mt-5 grid gap-4">
              <label className="space-y-2">
                <span className="text-xs font-extrabold text-slate-600">
                  Fee Record
                </span>
                <select
                  value={studentFeeId}
                  onChange={(event) => {
                    const nextFee =
                      student.dueFees.find(
                        (fee) =>
                          fee.id ===
                          event.target.value
                      );
                    setStudentFeeId(
                      event.target.value
                    );
                    setAmount(
                      nextFee?.dueAmount || ""
                    );
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
                >
                  {
                    student.dueFees.map((fee) => (
                      <option
                        key={fee.id}
                        value={fee.id}
                      >
                        Due {formatCurrency(fee.dueAmount)}
                      </option>
                    ))
                  }
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-extrabold text-slate-600">
                  Amount
                </span>
                <input
                  type="number"
                  min="1"
                  max={selectedFee?.dueAmount}
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-extrabold text-slate-600">
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
                  {
                    paymentModes.map((mode) => (
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
          )
        }

        {
          error && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600">
              {error}
            </p>
          )
        }

        <button
          type="button"
          disabled={
            saving ||
            student.dueFees?.length === 0
          }
          onClick={savePayment}
          className="mt-5 h-11 w-full rounded-xl bg-indigo-600 text-sm font-extrabold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Payment"}
        </button>
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
    error,
    setError,
  ] = useState("");
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
    page,
    setPage,
  ] = useState(1);
  const [
    openMenuId,
    setOpenMenuId,
  ] = useState("");
  const [
    receiptStudent,
    setReceiptStudent,
  ] = useState(null);
  const [
    paymentStudent,
    setPaymentStudent,
  ] = useState(null);
  const [
    showMobileFilters,
    setShowMobileFilters,
  ] = useState(false);

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
        setError("");
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
          });
        setLedger(result);
      } catch (apiError) {
        setError(
          apiError.response?.data?.message ||
            apiError.message ||
            "Fees ledger could not be loaded"
        );
      } finally {
        setLoading(false);
      }
    }, [
      classId,
      monthYear,
      page,
      paymentMode,
      search,
      sectionId,
      status,
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
            border:
              "border-emerald-100",
            text:
              "text-emerald-700",
            icon:
              "bg-emerald-100 text-emerald-600",
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
            border:
              "border-orange-100",
            text:
              "text-orange-700",
            icon:
              "bg-orange-100 text-orange-600",
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
            border:
              "border-blue-100",
            text:
              "text-blue-700",
            icon:
              "bg-blue-100 text-blue-600",
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
            border:
              "border-red-100",
            text:
              "text-red-700",
            icon:
              "bg-red-100 text-red-600",
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

  const renderActions =
    (student) => (
      <div className="relative">
        <button
          type="button"
          onClick={() =>
            setOpenMenuId((current) =>
              current === student.id
                ? ""
                : student.id
            )
          }
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
        >
          <MoreVertical size={17} />
        </button>
        {
          openMenuId === student.id && (
            <div className="absolute right-0 top-11 z-20 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/students/${student.id}`
                  )
                }
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <Eye size={16} />
                View Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentStudent(student);
                  setOpenMenuId("");
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <WalletCards size={16} />
                Record Payment
              </button>
            </div>
          )
        }
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5">
      <div className="md:hidden">
        <h1 className="text-2xl font-extrabold tracking-normal text-slate-950">
          Fees
        </h1>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Track and manage all student fee payments
        </p>
      </div>

      <div className="hidden md:block">
        <h1 className="text-3xl font-extrabold tracking-normal text-slate-950">
          Fees
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Track and manage all student fee payments
        </p>
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
          <div className="hidden gap-3 md:grid md:grid-cols-5">
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
                        {item.name}
                      </option>
                    )
                  )
                }
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">
                Status
              </span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
              >
                {
                  statusTabs.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item} Status
                      </option>
                    )
                  )
                }
              </select>
            </label>
            <label className="space-y-1">
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
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
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
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-slate-700"
              >
                <Filter size={17} />
                Filters
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
                            {item.name}
                          </option>
                        )
                      )
                    }
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500">
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value
                      )
                    }
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
                  >
                    {
                      statusTabs.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item} Status
                          </option>
                        )
                      )
                    }
                  </select>
                </label>
                <label className="space-y-1">
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
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
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

        {
          error && (
            <p className="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </p>
          )
        }

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
            <tbody className={loading ? "opacity-50" : ""}>
              {
                loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center"
                    >
                      <LoaderCircle className="mx-auto animate-spin text-indigo-600" />
                    </td>
                  </tr>
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
                          <button
                            type="button"
                            disabled={!student.hasReceipt}
                            onClick={() =>
                              setReceiptStudent(
                                student
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 disabled:text-slate-300"
                          >
                            <FileText size={18} />
                          </button>
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
              <div className="rounded-2xl bg-white p-8 text-center">
                <LoaderCircle className="mx-auto animate-spin text-indigo-600" />
              </div>
            ) : ledger.students.length === 0 ? (
              <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-500">
                No fee ledger records found.
              </div>
            ) : (
              ledger.students.map(
                (student) => (
                  <article
                    key={student.id}
                    className="rounded-2xl bg-white p-4 shadow-sm"
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
                      <span className={`${statusClass[student.status] || statusClass.Unpaid} shrink-0 rounded-full px-3 py-1 text-xs font-extrabold`}>
                        {student.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-400">Paid</p>
                        <p className="mt-1 font-extrabold text-emerald-600">
                          {formatCurrency(student.paidAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400">Total</p>
                        <p className="mt-1 font-extrabold text-slate-800">
                          {formatCurrency(student.totalFees)}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400">Due</p>
                        <p className="mt-1 font-extrabold text-red-600">
                          {formatCurrency(student.dueAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <p className="text-xs font-bold text-slate-500">
                        Last: {formatDate(student.lastPayment?.paidAt)}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!student.hasReceipt}
                          onClick={() =>
                            setReceiptStudent(
                              student
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-red-500 disabled:text-slate-300"
                        >
                          <FileText size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/students/${student.id}`
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600"
                        >
                          <ChevronRight size={18} />
                        </button>
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

      <ReceiptModal
        student={receiptStudent}
        onClose={() =>
          setReceiptStudent(null)
        }
      />
      <PaymentModal
        student={paymentStudent}
        onClose={() =>
          setPaymentStudent(null)
        }
        onSaved={refreshLedger}
      />
    </div>
  );
}
