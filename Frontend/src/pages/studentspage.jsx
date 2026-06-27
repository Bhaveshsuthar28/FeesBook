import {
  ArrowUpCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  Image,
  LoaderCircle,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  RotateCcw,
  Upload,
  UserMinus,
  Users,
  WalletCards,
  Info,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Tooltip from "../components/common/Tooltip.jsx";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getClassesByStatus,
} from "../lib/api/classapi.js";

import {
  getSectionsByClass,
} from "../lib/api/sectionapi.js";

import {
  getClassFeeStructureStatus,
} from "../lib/api/feesapi.js";

import {
  getStudentDirectory,
  getStudentsBySection,
  markStudentLeft,
} from "../lib/api/studentapi.js";

import {
  bulkPromoteStudents,
  streamAllocate,
} from "../lib/api/promotionapi.js";

import {
  notify,
} from "../lib/toast.js";
import SendWhatsappModal from "../components/common/SendWhatsappModal.jsx";
import { FaWhatsapp } from "react-icons/fa";


import RecordPaymentModal from "../components/payments/RecordPaymentModal.jsx";

import AddStudentModal from "../components/students/AddStudentModal.jsx";

import AllocateOptionalFeesModal from "../components/fees/AllocateOptionalFeesModal.jsx";

import {
  PageLoadingSkeleton,
  TableBodySkeleton,
} from "../components/skeleton/PageSkeletons.jsx";

const emptyForm = {
  schoolRegisterNo: "",
  firstName: "",
  lastName: "",
  fatherName: "",
  dob: "",
  phone: "",
  gender: "",
  aadharNo: "",
  aadharVerificationStatus: "",
  admissionDate: "",
  photoUrl: "",
  photoFileId: "",
};

const pageSize = 10;

const requiredFields = [
  "schoolRegisterNo",
  "firstName",
  "fatherName",
  "dob",
  "phone",
  "gender",
];

const statusClass = {
  Paid:
    "bg-emerald-100 text-emerald-700",
  Partial:
    "bg-amber-100 text-amber-700",
  Pending:
    "bg-red-100 text-red-700",
};

const studentStatusClass = {
  active:
    "bg-emerald-100 text-emerald-700",
  alumni:
    "bg-blue-100 text-blue-700",
  left:
    "bg-red-100 text-red-700",
  previous:
    "bg-red-100 text-red-700",
};

const sortOptions = [
  {
    label: "Roll No",
    value: "rollNumber",
  },
  {
    label: "Name",
    value: "name",
  },
  {
    label: "Due Amount",
    value: "dueAmount",
  },
];

const directoryTabs = [
  {
    value: "all",
    label: "All Students",
    icon: Users,
  },
  {
    value: "active",
    label: "Active",
    icon: Users,
  },
  {
    value: "alumni",
    label: "Alumni",
    icon: GraduationCap,
  },
  {
    value: "left",
    label: "Left",
    icon: UserMinus,
  },
];

const formatCurrency =
  (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDateForApi =
  (value) => {
    if (!value) {
      return "";
    }

    const [
      year,
      month,
      day,
    ] =
      value.split("-");

    return `${day}/${month}/${year}`;
  };

const formatDateForInput =
  (value) => {
    if (
      !/^\d{2}\/\d{2}\/\d{4}$/.test(value)
    ) {
      return "";
    }

    const [
      day,
      month,
      year,
    ] =
      value.split("/");

    return `${year}-${month}-${day}`;
  };

const formatPercent =
  (part, total) =>
    total === 0
      ? "0.00%"
      : `${((part / total) * 100).toFixed(2)}%`;

const formatCount =
  (value) =>
    Number(value || 0).toLocaleString(
      "en-IN"
    );

const getPublicStudentStatus =
  (student) => {
    const status =
      student.publicStatus ||
      student.status ||
      "active";

    return (status === "previous" || status === "archived" || status === "left")
      ? "left"
      : status;
  };

const getStudentStatusLabel =
  (student) => {
    const status =
      getPublicStudentStatus(student);

    if (status === "left") {
      return "Left";
    }

    return status.charAt(0).toUpperCase() +
      status.slice(1);
  };

const escapeExcelCell =
  (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

const downloadExcelFile =
  ({
    rows,
    fileName,
  }) => {
    const header = [
      "Student",
      "Roll No",
      "Class",
      "Section",
      "Admission No",
      "Contact",
      "Fee Status",
      "Student Status",
      "Total Fees",
      "Collected Fees",
      "Pending Fees",
    ];

    const bodyRows =
      rows.map((student) => [
        student.fullName,
        student.rollNumber,
        student.className,
        student.sectionName,
        student.schoolRegisterNo,
        student.phone,
        student.paymentStatus === "Pending"
          ? "Due"
          : student.paymentStatus,
        getStudentStatusLabel(student),
        student.totalFees,
        student.collectedFees,
        student.pendingFees,
      ]);

    const tableRows =
      [header, ...bodyRows]
        .map(
          (row) =>
            `<tr>${row
              .map(
                (cell) =>
                  `<td>${escapeExcelCell(cell)}</td>`
              )
              .join("")}</tr>`
        )
        .join("");

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table>${tableRows}</table>
        </body>
      </html>
    `;

    const blob =
      new Blob([html], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
    const url =
      URL.createObjectURL(blob);
    const link =
      document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

const getInitials =
  (student) => {
    const first =
      student.firstName?.[0] ||
      student.fullName?.[0] ||
      "S";
    const last =
      student.lastName?.[0] ||
      "";

    return `${first}${last}`.toUpperCase();
  };

function StudentAvatar({
  student,
}) {
  if (student.photoUrl) {
    return (
      <img
        src={student.photoUrl}
        alt={student.fullName}
        className="
          h-9
          w-9
          rounded-full
          object-cover
        "
      />
    );
  }

  return (
    <div
      className="
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-full
        bg-blue-100
        text-xs
        font-bold
        text-blue-700
      "
    >
      {getInitials(student)}
    </div>
  );
}


function StatCard({
  title,
  value,
  note,
  icon: Icon,
  iconClass = "",
  iconBg = "",
}) {
  const getTheme = () => {
    if (iconBg.includes("blue")) {
      return {
        bg: "bg-[#eef5fc]",
        border: "border-[#d2e5fc]/60",
        iconBg: "bg-[#d2e5fc]",
        iconColor: "text-blue-600",
        noteColor: "text-slate-500",
      };
    } else if (iconBg.includes("emerald") || iconBg.includes("green")) {
      return {
        bg: "bg-[#ebfaf0]",
        border: "border-[#d3f4dd]/60",
        iconBg: "bg-[#d3f4dd]",
        iconColor: "text-green-600",
        noteColor: "text-emerald-600",
      };
    } else if (iconBg.includes("orange") || iconBg.includes("amber")) {
      return {
        bg: "bg-[#fff8ed]",
        border: "border-[#fee5cd]/60",
        iconBg: "bg-[#fee5cd]",
        iconColor: "text-orange-600",
        noteColor: "text-slate-500",
      };
    } else if (iconBg.includes("violet") || iconBg.includes("purple")) {
      return {
        bg: "bg-[#fbf7fe]",
        border: "border-[#ebdcfc]/60",
        iconBg: "bg-[#ebdcfc]",
        iconColor: "text-purple-600",
        noteColor: "text-slate-500",
      };
    }
    return {
      bg: "bg-white",
      border: "border-slate-200",
      iconBg: iconBg,
      iconColor: iconClass,
      noteColor: "text-slate-500",
    };
  };

  const theme = getTheme();

  return (
    <div
      className={`
        rounded-[24px]
        border
        ${theme.bg}
        ${theme.border}
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
          ${theme.iconBg}
        `}
      >
        <Icon
          size={22}
          className={theme.iconColor}
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
            ${theme.noteColor}
          `}
        >
          {note}
        </p>
      </div>
    </div>
  );
}

function SelectControl({
  value,
  onChange,
  children,
  className = "",
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`
        h-11
        min-w-0
        rounded-lg
        border
        border-slate-200
        bg-white
        px-3
        text-xs
        font-semibold
        text-slate-600
        outline-none
        focus:border-blue-500
        ${className}
      `}
    >
      {children}
    </select>
  );
}

function StudentLifecycleModal({
  student,
  onClose,
  onSaved,
}) {
  const [
    note,
    setNote,
  ] = useState("");
  const [
    saving,
    setSaving,
  ] = useState(false);
  const handleSave =
    async () => {
      try {
        setSaving(true);
                await markStudentLeft({
          studentId:
            student.id,
          data: {
            note,
          },
        });

        await onSaved();
        onClose();
      } catch (error) {
        notify.error(error, "Student movement failed");
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-950">
              Mark Student as Left
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {student.fullName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
          >
            ×
          </button>
        </div>

        <textarea
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
          placeholder="Note (optional)"
          className="mt-4 min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-extrabold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="h-11 rounded-lg bg-red-600 px-4 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {
              saving
                ? "Saving..."
                : "Confirm"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

function DirectoryStudentsView({
  directoryData,
  directoryLoading,
  directoryTab,
  setDirectoryTab,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  directoryClassId,
  setDirectoryClassId,
  directorySectionId,
  setDirectorySectionId,
  directoryPaymentStatus,
  setDirectoryPaymentStatus,
  currentPage,
  setCurrentPage,
  navigate,
  onRefresh,
}) {
  const [
    exporting,
    setExporting,
  ] = useState(false);
  const [
    showMobileFilters,
    setShowMobileFilters,
  ] = useState(false);
  const [
    lifecycleAction,
    setLifecycleAction,
  ] = useState(null);
  const students =
    directoryData.students || [];
  const pagination =
    directoryData.pagination || {
      page: 1,
      total: 0,
      totalPages: 1,
    };
  const counts =
    directoryData.statusCounts || {};
  const summary =
    directoryData.summary || {
      totalStudents:
        counts.all || 0,
      activeStudents:
        counts.active || 0,
      alumniStudents:
        counts.alumni || 0,
      leftStudents:
        counts.left || 0,
    };
  const filterOptions =
    directoryData.filterOptions || {
      classes: [],
      sections: [],
    };
  const visibleSections =
    directoryClassId
      ? filterOptions.sections.filter(
          (section) =>
            section.classId ===
            directoryClassId
        )
      : filterOptions.sections;
  const pageButtons =
    useMemo(() => {
      const totalPages =
        pagination.totalPages || 1;

      if (totalPages <= 5) {
        return Array.from(
          {
            length:
              totalPages,
          },
          (_, index) =>
            index + 1
        );
      }

      return [
        1,
        Math.min(
          Math.max(
            pagination.page,
            2
          ),
          totalPages - 1
        ),
        totalPages,
      ].filter(
        (value, index, array) =>
          array.indexOf(value) ===
          index
      );
    }, [
      pagination.page,
      pagination.totalPages,
    ]);

  const statCards = [
    {
      title: "Total Students",
      value:
        summary.totalStudents,
      note: "24 this month",
      icon: Users,
      accent:
        "border-violet-100 text-violet-700 bg-violet-50",
      iconBg:
        "bg-violet-100",
    },
    {
      title: "Active Students",
      value:
        summary.activeStudents,
      note: "18 this month",
      icon: Users,
      accent:
        "border-emerald-100 text-emerald-700 bg-emerald-50",
      iconBg:
        "bg-emerald-100",
    },
    {
      title: "Alumni Students",
      value:
        summary.alumniStudents,
      note: "12 this month",
      icon: GraduationCap,
      accent:
        "border-blue-100 text-blue-700 bg-blue-50",
      iconBg:
        "bg-blue-100",
    },
    {
      title: "Left Students",
      value:
        summary.leftStudents,
      note: "6 this month",
      icon: UserMinus,
      accent:
        "border-orange-100 text-orange-700 bg-orange-50",
      iconBg:
        "bg-orange-100",
    },
  ];

  const rangeStart =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) *
          pageSize +
        1;
  const rangeEnd =
    Math.min(
      pagination.page * pageSize,
      pagination.total || 0
    );

  const resetDirectory =
    () => {
      setDirectoryTab("all");
      setSearchTerm("");
      setDirectoryClassId("");
      setDirectorySectionId("");
      setDirectoryPaymentStatus("");
      setSortBy("rollNumber");
      setCurrentPage(1);
      setShowMobileFilters(false);
    };

  const exportDirectory =
    async () => {
      if (exporting) {
        return;
      }

      try {
        setExporting(true);

        const firstPage =
          await getStudentDirectory({
            status:
              directoryTab,
            page: 1,
            limit: 50,
            search:
              searchTerm,
            classId:
              directoryClassId,
            sectionId:
              directorySectionId,
            paymentStatus:
              directoryPaymentStatus,
            sortBy,
          });

        const totalPages =
          firstPage.pagination
            ?.totalPages || 1;
        const allStudents = [
          ...(firstPage.students || []),
        ];

        for (
          let page = 2;
          page <= totalPages;
          page += 1
        ) {
          const result =
            await getStudentDirectory({
              status:
                directoryTab,
              page,
              limit: 50,
              search:
                searchTerm,
              classId:
                directoryClassId,
              sectionId:
                directorySectionId,
              paymentStatus:
                directoryPaymentStatus,
              sortBy,
            });

          allStudents.push(
            ...(result.students || [])
          );
        }

        downloadExcelFile({
          rows:
            allStudents,
          fileName:
            `students-${directoryTab}-${new Date()
              .toISOString()
              .slice(0, 10)}.xls`,
        });
        setShowMobileFilters(false);
      } catch (error) {
        notify.error(error, "Photo could not be uploaded");
      } finally {
        setExporting(false);
      }
    };

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1400px]
        space-y-4
        md:space-y-6
      "
    >
      <div className="hidden md:block">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold text-slate-950">
            Students
          </h1>
          <Tooltip content="Register new students, update profiles, record payments, and view student fee statuses.">
            <button type="button" className="text-slate-400 hover:text-slate-600 transition p-1 mt-1.5">
              <Info size={16} />
            </button>
          </Tooltip>
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          View and manage all students in your school
        </p>
      </div>

      <div className="flex gap-2 md:hidden">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search students..."
            className="
              h-11
              w-full
              rounded-lg
              border
              border-slate-200
              bg-white
              pl-10
              pr-3
              text-xs
              font-semibold
              text-slate-700
              shadow-sm
              outline-none
              focus:border-blue-500
            "
          />
        </div>
        <button
          type="button"
          onClick={() =>
            setShowMobileFilters(true)
          }
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-lg
            border
            border-slate-200
            bg-white
            text-slate-700
            shadow-sm
          "
          title="Filters"
        >
          <Filter size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {
          statCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={formatCount(card.value)}
              note={`↑ ${card.note}`}
              icon={card.icon}
              iconBg={card.iconBg}
            />
          ))
        }
      </div>

      <section
        className="
          overflow-hidden
          rounded-lg
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >
        <div className="flex flex-col gap-4 border-b border-slate-100 px-0 py-0 md:px-5 md:py-4 xl:flex-row xl:items-center xl:justify-between">
          <h2 className="hidden text-lg font-extrabold text-slate-950 md:block">
            Student Directory
          </h2>

          <div className="grid grid-cols-4 overflow-hidden bg-white md:rounded-lg md:border md:border-slate-200">
            {
              directoryTabs.map(
                (tab) => {
                  const Icon =
                    tab.icon;
                  const active =
                    directoryTab ===
                    tab.value;

                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() =>
                        setDirectoryTab(
                          tab.value
                        )
                      }
                      className={`
                        flex
                        h-11
                        items-center
                        justify-center
                        gap-2
                        border-slate-200
                        px-2
                        text-xs
                        font-extrabold
                        transition
                        md:h-12
                        md:px-5
                        md:text-sm
                        md:border-r
                        last:border-r-0
                        ${
                          active
                            ? "bg-violet-50 text-violet-700"
                            : "text-slate-700 hover:bg-slate-50"
                        }
                      `}
                    >
                      <Icon size={17} />
                      {tab.label}
                    </button>
                  );
                }
              )
            }
          </div>
        </div>

        <div className="hidden flex-col gap-4 border-b border-slate-200 px-5 py-4 md:flex xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectControl
              value={directoryClassId}
              onChange={(event) => {
                setDirectoryClassId(
                  event.target.value
                );
                setDirectorySectionId("");
              }}
              className="min-w-[150px]"
            >
              <option value="">All Classes</option>
              {
                filterOptions.classes.map(
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
            </SelectControl>

            <SelectControl
              value={directorySectionId}
              onChange={(event) =>
                setDirectorySectionId(
                  event.target.value
                )
              }
              className="min-w-[150px]"
            >
              <option value="">All Sections</option>
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
            </SelectControl>

            <SelectControl
              value={directoryPaymentStatus}
              onChange={(event) =>
                setDirectoryPaymentStatus(
                  event.target.value
                )
              }
              className="min-w-[150px]"
            >
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Due</option>
            </SelectControl>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search students..."
                className="
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  pl-10
                  pr-3
                  text-sm
                  font-semibold
                  text-slate-700
                  outline-none
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-50
                  sm:w-72
                "
              />
            </div>

            <button
              type="button"
              onClick={resetDirectory}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw size={17} />
              Reset All
            </button>

            <button
              type="button"
              onClick={exportDirectory}
              disabled={exporting}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {
                exporting ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Download size={17} />
                )
              }
              Export Excel
            </button>

          </div>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="bg-slate-50 text-xs font-extrabold text-slate-600">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Class & Section</th>
                <th className="px-6 py-4">Admission No.</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Fee Status</th>
                <th className="px-6 py-4">Student Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className={directoryLoading ? "opacity-60" : ""}>
              {
                directoryLoading ? (
                  <TableBodySkeleton
                    rows={6}
                    columns={7}
                  />
                ) : students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm font-semibold text-slate-500"
                    >
                      No students found.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const publicStatus =
                      getPublicStudentStatus(
                        student
                      );

                    return (
                      <tr
                        key={student.id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar student={student} />
                            <div>
                              <p className="text-sm font-extrabold text-slate-950">
                                {student.fullName}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                Roll No: {student.rollNumber}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">
                          {student.className}
                          <span className="ml-2 rounded-md bg-violet-50 px-2 py-1 text-xs font-extrabold text-violet-700">
                            {student.sectionName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">
                          {student.schoolRegisterNo}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900">
                            {student.phone}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {student.email || "No email"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`
                              rounded-md
                              px-3
                              py-1.5
                              text-xs
                              font-bold
                              ${statusClass[student.paymentStatus] || statusClass.Pending}
                            `}
                          >
                            {student.paymentStatus === "Pending" ? "Due" : student.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`
                              rounded-md
                              px-3
                              py-1.5
                              text-xs
                              font-bold
                              ${studentStatusClass[publicStatus] || studentStatusClass.active}
                            `}
                          >
                            • {getStudentStatusLabel(student)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Tooltip content="View student">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/students/${student.schoolRegisterNo}`
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-700"
                              >
                                <Eye size={16} />
                              </button>
                            </Tooltip>
                            {
                              publicStatus ===
                                "active" && (
                                <Tooltip content="Mark as left">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLifecycleAction({
                                        action:
                                          "left",
                                        student,
                                      })
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 hover:border-red-200 hover:bg-red-50"
                                  >
                                    <UserMinus size={16} />
                                  </button>
                                </Tooltip>
                              )
                            }
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              }
            </tbody>
          </table>
        </div>

        <div className="space-y-2 bg-slate-50 p-2 md:p-4 xl:hidden">
          {
            students.length === 0 ? (
              <div className="rounded-lg border border-slate-200 p-4 text-sm font-semibold text-slate-500">
                No students found.
              </div>
            ) : (
              students.map((student) => {
                const publicStatus =
                  getPublicStudentStatus(
                    student
                  );

                return (
                  <div
                    key={student.id}
                    className="w-full rounded-lg border border-slate-100 bg-white p-3 text-left shadow-sm hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <StudentAvatar student={student} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-950">
                            {student.fullName}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {student.className} • Section {student.sectionName}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`
                          shrink-0
                          rounded-md
                          px-2
                          py-1
                          text-xs
                          font-bold
                          ${studentStatusClass[publicStatus] || studentStatusClass.active}
                        `}
                      >
                        {getStudentStatusLabel(student)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                      <span className="flex min-w-0 items-center gap-1 font-bold text-slate-600">
                        <Phone size={13} />
                        {student.phone}
                      </span>
                      <span
                        className={`
                          font-extrabold
                          ${
                            student.paymentStatus ===
                            "Paid"
                              ? "text-emerald-600"
                              : student.paymentStatus ===
                                  "Partial"
                                ? "text-orange-500"
                                : "text-red-500"
                          }
                        `}
                      >
                        ₹ {student.paymentStatus === "Pending" ? "Due" : student.paymentStatus}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Tooltip content="View student">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/students/${student.schoolRegisterNo}`
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
                        >
                          <Eye size={16} />
                        </button>
                      </Tooltip>
                      {
                        publicStatus ===
                          "active" && (
                          <Tooltip content="Mark as left">
                            <button
                              type="button"
                              onClick={() => {
                                setLifecycleAction({
                                  action:
                                    "left",
                                  student,
                                });
                              }}
                              className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-100 text-red-600"
                            >
                              <UserMinus size={16} />
                            </button>
                          </Tooltip>
                        )
                      }
                    </div>
                  </div>
                );
              })
            )
          }
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Showing {rangeStart} to {rangeEnd} of {formatCount(pagination.total)} students
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            {
              pageButtons.map(
                (page, index) => (
                  <div
                    key={`${page}-${index}`}
                    className="flex items-center gap-2"
                  >
                    {
                      index > 0 &&
                      page -
                        pageButtons[index - 1] >
                        1 && (
                        <span className="text-slate-400">...</span>
                      )
                    }
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                      className={`
                        h-10
                        min-w-10
                        rounded-lg
                        px-3
                        text-sm
                        font-extrabold
                        ${
                          pagination.page ===
                          page
                            ? "bg-violet-600 text-white shadow-sm"
                            : "border border-slate-200 text-slate-700"
                        }
                      `}
                    >
                      {page}
                    </button>
                  </div>
                )
              )
            }

            <button
              type="button"
              disabled={
                currentPage >=
                pagination.totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      pagination.totalPages,
                      page + 1
                    )
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {
        showMobileFilters && (
          <div className="fixed inset-0 z-[80] bg-slate-950/40 md:hidden">
            <div className="absolute bottom-0 left-0 right-0 max-h-[86vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-950">
                  Filters
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setShowMobileFilters(false)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <SelectControl
                  value={directoryClassId}
                  onChange={(event) => {
                    setDirectoryClassId(
                      event.target.value
                    );
                    setDirectorySectionId("");
                  }}
                  className="w-full"
                >
                  <option value="">All Classes</option>
                  {
                    filterOptions.classes.map(
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
                </SelectControl>

                <SelectControl
                  value={directorySectionId}
                  onChange={(event) =>
                    setDirectorySectionId(
                      event.target.value
                    )
                  }
                  className="w-full"
                >
                  <option value="">All Sections</option>
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
                </SelectControl>

                <SelectControl
                  value={directoryPaymentStatus}
                  onChange={(event) =>
                    setDirectoryPaymentStatus(
                      event.target.value
                    )
                  }
                  className="w-full"
                >
                  <option value="">All Fee Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Pending">Due</option>
                </SelectControl>

                <SelectControl
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value
                    )
                  }
                  className="w-full"
                >
                  {
                    sortOptions.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          Sort: {option.label}
                        </option>
                      )
                    )
                  }
                </SelectControl>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={resetDirectory}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-extrabold text-slate-700"
                >
                  <RotateCcw size={16} />
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={exportDirectory}
                  disabled={exporting}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 text-sm font-extrabold text-white disabled:opacity-60"
                >
                  {
                    exporting ? (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Download size={16} />
                    )
                  }
                  Export
                </button>
              </div>

            </div>
          </div>
        )
      }

      {
        lifecycleAction && (
          <StudentLifecycleModal
            student={
              lifecycleAction.student
            }
            onClose={() =>
              setLifecycleAction(null)
            }
            onSaved={onRefresh}
          />
        )
      }
    </div>
  );
}

export default function StudentsPage() {
  const {
    className: classNameParam,
    sectionName: sectionNameParam,
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
    selectedSection,
    setSelectedSection,
  ] = useState(
    location.state?.selectedSection ||
      null
  );

  const [resolvedClassId, setResolvedClassId] = useState(
    location.state?.selectedClass?.id || null
  );

  const [resolvedSectionId, setResolvedSectionId] = useState(
    location.state?.selectedSection?.id || null
  );

  useEffect(() => {
    async function resolveIds() {
      if (!classNameParam) {
        setResolvedClassId(null);
        setResolvedSectionId(null);
        return;
      }
      try {
        const classes = await getClassesByStatus("all");
        const foundClass = classes.find(c => c.name === classNameParam);
        if (foundClass) {
          setResolvedClassId(foundClass.id);
          setSelectedClass(foundClass);
          
          if (sectionNameParam) {
            const sections = await getSectionsByClass({ classId: foundClass.id, status: "all" });
            const foundSection = sections.find(s => s.name === sectionNameParam);
            if (foundSection) {
              setResolvedSectionId(foundSection.id);
              setSelectedSection(foundSection);
            }
          }
        }
      } catch (err) {
        console.error("Failed to resolve IDs", err);
      }
    }
    resolveIds();
  }, [classNameParam, sectionNameParam]);

  const [
    students,
    setStudents,
  ] = useState([]);

  const [
    stats,
    setStats,
  ] = useState({
    totalStudents: 0,
    feeCollected: 0,
    totalPending: 0,
    fullyPaid: 0,
    paid: 0,
    partial: 0,
    pending: 0,
  });

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 1,
  });

  const [
    loading,
    setLoading,
  ] = useState(Boolean(classNameParam));

  const [
    tableLoading,
    setTableLoading,
  ] = useState(false);

  const [
    showAddModal,
    setShowAddModal,
  ] = useState(false);

  const [
    addMode,
    setAddMode,
  ] = useState("manual");

  const [
    showAddMenu,
    setShowAddMenu,
  ] = useState(false);

  const [
    feeStructureReady,
    setFeeStructureReady,
  ] = useState(false);

  const [
    paymentStudentId,
    setPaymentStudentId,
  ] = useState(null);

  const [
    showOptionalFees,
    setShowOptionalFees,
  ] = useState(false);

  const [whatsappStudent, setWhatsappStudent] = useState(null);

  const [isPromotionMode, setIsPromotionMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [targetPromotionClassId, setTargetPromotionClassId] = useState("");
  const [targetPromotionSectionId, setTargetPromotionSectionId] = useState("");
  const [promotionClasses, setPromotionClasses] = useState([]);
  const [promotionSections, setPromotionSections] = useState([]);
  const [promoting, setPromoting] = useState(false);
  const [showRemainingPrompt, setShowRemainingPrompt] = useState(false);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    sortBy,
    setSortBy,
  ] = useState("rollNumber");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    directoryTab,
    setDirectoryTab,
  ] = useState("all");

  const [
    directoryClassId,
    setDirectoryClassId,
  ] = useState("");

  const [
    directorySectionId,
    setDirectorySectionId,
  ] = useState("");

  const [
    directoryPaymentStatus,
    setDirectoryPaymentStatus,
  ] = useState("");

  const [
    directoryData,
    setDirectoryData,
  ] = useState({
    students: [],
    stats: {
      totalStudents: 0,
      totalFees: 0,
      feeCollected: 0,
      totalPending: 0,
      paid: 0,
      partial: 0,
      pending: 0,
    },
    statusCounts: {
      active: 0,
      alumni: 0,
      left: 0,
      all: 0,
    },
    summary: {
      totalStudents: 0,
      activeStudents: 0,
      alumniStudents: 0,
      leftStudents: 0,
    },
    filterOptions: {
      classes: [],
      sections: [],
    },
    pagination: {
      page: 1,
      limit: pageSize,
      total: 0,
      totalPages: 1,
    },
  });

  const [
    directoryLoading,
    setDirectoryLoading,
  ] = useState(false);

  const refreshStudents =
    useCallback(async () => {
      if (
        !resolvedClassId ||
        !resolvedSectionId
      ) {
        return;
      }

      setTableLoading(true);

      try {
        const [
          classes,
          sections,
          studentResult,
        ] =
          await Promise.all([
            getClassesByStatus("all"),
            getSectionsByClass({
              classId: resolvedClassId,
              status: "all",
            }),
            getStudentsBySection({
              classId: resolvedClassId,
              sectionId: resolvedSectionId,
              page:
                currentPage,
              limit:
                pageSize,
              search:
                searchTerm,
              paymentStatus:
                statusFilter,
              sortBy,
            }),
          ]);

        setSelectedClass(
          classes.find(
            (item) =>
              item.id === resolvedClassId
          ) || null
        );

        setSelectedSection(
          sections.find(
            (item) =>
              item.id === resolvedSectionId
          ) || null
        );

        if (
          Array.isArray(
            studentResult
          )
        ) {
          setStudents(
            studentResult
          );
          setPagination({
            page: 1,
            limit: pageSize,
            total:
              studentResult.length,
            totalPages: 1,
          });
        } else {
          setStudents(
            studentResult.students ||
              []
          );
          setStats(
            studentResult.stats ||
              {
                totalStudents: 0,
                feeCollected: 0,
                totalPending: 0,
                fullyPaid: 0,
                paid: 0,
                partial: 0,
                pending: 0,
              }
          );
          setPagination(
            studentResult.pagination ||
              {
                page:
                  currentPage,
                limit:
                  pageSize,
                total: 0,
                totalPages: 1,
              }
          );
        }
      } catch (error) {
        console.error(error);
        notify.error(error, "Students could not be loaded");
      } finally {
        setTableLoading(false);
      }
    }, [
      resolvedClassId,
      currentPage,
      searchTerm,
      resolvedSectionId,
      sortBy,
      statusFilter,
    ]);

  useEffect(() => {
    const load =
      async () => {
        try {
          setLoading(true);
          await refreshStudents();
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

    load();
  }, [refreshStudents]);

  useEffect(() => {
    if (!resolvedClassId) {
      setFeeStructureReady(false);
      return;
    }

    let cancelled = false;

    const checkFeeStructure =
      async () => {
        try {
          const status =
            await getClassFeeStructureStatus(
              resolvedClassId
            );

          if (!cancelled) {
            setFeeStructureReady(
              Boolean(
                status?.hasFeeStructure
              )
            );
          }
        } catch {
          if (!cancelled) {
            setFeeStructureReady(false);
          }
        }
      };

    checkFeeStructure();

    return () => {
      cancelled = true;
    };
  }, [resolvedClassId]);

  useEffect(() => {
    if (!targetPromotionClassId) {
      setPromotionSections([]);
      setTargetPromotionSectionId("");
      return;
    }
    let cancelled = false;
    const loadSections = async () => {
      try {
        const sections = await getSectionsByClass({ classId: targetPromotionClassId });
        if (!cancelled) {
          setPromotionSections(sections || []);
          if (sections && sections.length > 0) {
            setTargetPromotionSectionId(sections[0].id);
          } else {
            setTargetPromotionSectionId("");
          }
        }
      } catch (error) {
        if (!cancelled) {
          notify.error(error, "Failed to load sections for class");
        }
      }
    };
    loadSections();
    return () => {
      cancelled = true;
    };
  }, [targetPromotionClassId]);

  const refreshDirectory =
    useCallback(async () => {
      if (resolvedClassId) {
        return;
      }

      setDirectoryLoading(true);

      try {
        const result =
          await getStudentDirectory({
            status:
              directoryTab,
            page:
              currentPage,
            limit:
              pageSize,
            search:
              searchTerm,
            classId:
              directoryClassId,
            sectionId:
              directorySectionId,
            paymentStatus:
              directoryPaymentStatus,
            sortBy,
          });

        setDirectoryData({
          students:
            result.students || [],
          stats:
            result.stats || {
              totalStudents: 0,
              totalFees: 0,
              feeCollected: 0,
              totalPending: 0,
              paid: 0,
              partial: 0,
              pending: 0,
            },
          statusCounts:
            result.statusCounts || {
              active: 0,
              alumni: 0,
              left: 0,
              all: 0,
            },
          summary:
            result.summary || {
              totalStudents: 0,
              activeStudents: 0,
              alumniStudents: 0,
              leftStudents: 0,
            },
          filterOptions:
            result.filterOptions || {
              classes: [],
              sections: [],
            },
          pagination:
            result.pagination || {
              page:
                currentPage,
              limit:
                pageSize,
              total: 0,
              totalPages: 1,
            },
        });
      } catch (error) {
        console.error(error);
        notify.error(error, "Student directory could not be loaded");
      } finally {
        setDirectoryLoading(false);
      }
    }, [
      resolvedClassId,
      currentPage,
      directoryClassId,
      directoryPaymentStatus,
      directorySectionId,
      directoryTab,
      searchTerm,
      sortBy,
    ]);

  useEffect(() => {
    refreshDirectory();
  }, [refreshDirectory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    directoryTab,
    directoryClassId,
    directorySectionId,
    directoryPaymentStatus,
    searchTerm,
    statusFilter,
    sortBy,
  ]);

  useEffect(() => {
    setDirectorySectionId("");
  }, [directoryClassId]);

  const feeTotal =
    stats.feeCollected +
    stats.totalPending;

  const statCards =
    useMemo(
      () => [
        {
          title: "Total Students",
          value:
            stats.totalStudents,
          note:
            `${stats.totalStudents} Active`,
          icon:
            Users,
          iconBg:
            "bg-blue-100",
          iconClass:
            "text-blue-600",
        },
        {
          title: "Fee Collected",
          value:
            formatCurrency(
              stats.feeCollected
            ),
          note:
            `${formatPercent(
              stats.feeCollected,
              feeTotal
            )} - Collected`,
          icon:
            WalletCards,
          iconBg:
            "bg-emerald-100",
          iconClass:
            "text-emerald-600",
          barClass:
            "bg-emerald-500",
          percent:
            feeTotal === 0
              ? 0
              : (
                  stats.feeCollected /
                  feeTotal
                ) * 100,
        },
        {
          title: "Total Pending",
          value:
            formatCurrency(
              stats.totalPending
            ),
          note:
            `${formatPercent(
              stats.totalPending,
              feeTotal
            )} - Pending`,
          icon:
            FileSpreadsheet,
          iconBg:
            "bg-orange-100",
          iconClass:
            "text-orange-600",
          barClass:
            "bg-orange-400",
          percent:
            feeTotal === 0
              ? 0
              : (
                  stats.totalPending /
                  feeTotal
                ) * 100,
        },
        {
          title: "Fully Paid",
          value:
            stats.fullyPaid,
          note:
            formatPercent(
              stats.fullyPaid,
              stats.totalStudents
            ),
          icon:
            ShieldCheck,
          iconBg:
            "bg-violet-100",
          iconClass:
            "text-violet-600",
        },
      ],
      [
        feeTotal,
        stats,
      ]
    );

  const canAddStudents =
    selectedClass &&
    selectedSection &&
    !selectedClass.isArchived &&
    !selectedSection.isArchived &&
    feeStructureReady;

  const isTenthClassSelected =
    String(selectedClass?.name || "")
      .trim()
      .toLowerCase() === "10th";

  const getNextYear = (yearStr) => {
    const parts = String(yearStr || "").split("-");
    if (parts.length < 2) return "";
    const start = Number(parts[0]);
    if (isNaN(start)) return "";
    return `${start + 1}-${start + 2}`;
  };

  const enterPromotionMode = async () => {
    setIsPromotionMode(true);
    setSelectedStudentIds([]);
    const targetYear = getNextYear(selectedClass?.academicYear);
    if (targetYear) {
      try {
        const classes = await getClassesByStatus("active", targetYear);
        const eleventhClasses = classes.filter((cls) =>
          String(cls.name || "").trim().toLowerCase().startsWith("11th")
        );
        setPromotionClasses(eleventhClasses);
        if (eleventhClasses.length > 0) {
          setTargetPromotionClassId(eleventhClasses[0].id);
        }
      } catch (error) {
        notify.error(error, "Failed to load classes for promotion");
      }
    }
  };

  const handlePromoteSelected = async () => {
    if (selectedStudentIds.length === 0) {
      notify.warning("Please select at least one student to promote.");
      return;
    }
    if (!targetPromotionClassId || !targetPromotionSectionId) {
      notify.warning("Please select a target stream class and section.");
      return;
    }

    try {
      setPromoting(true);
      const targetYear = getNextYear(selectedClass?.academicYear);

      const payload = {
        students: selectedStudentIds.map((studentId) => ({
          studentId,
          targetClassId: targetPromotionClassId,
          targetSectionId: targetPromotionSectionId,
          note: "Manual stream promotion from 10th class",
        })),
        fromAcademicYear: selectedClass?.academicYear,
        targetAcademicYear: targetYear,
      };

      const result = await streamAllocate(payload);
      notify.success(`Successfully promoted ${result.promoted} student(s).`);
      setSelectedStudentIds([]);
      setIsPromotionMode(false);
      await refreshStudents();

      const remainingCount = students.filter((s) => s.status === "active" && !selectedStudentIds.includes(s.id)).length;
      if (remainingCount === 0) {
        setShowRemainingPrompt(true);
      }
    } catch (error) {
      notify.error(error, "Failed to promote students");
    } finally {
      setPromoting(false);
    }
  };

  const handlePromoteRemaining = async () => {
    try {
      setPromoting(true);
      const targetYear = getNextYear(selectedClass?.academicYear);
      const payload = {
        fromAcademicYear: selectedClass?.academicYear,
        targetAcademicYear: targetYear,
        note: "Automatic promotion of remaining classes after 10th",
      };

      const result = await bulkPromoteStudents(payload);
      notify.success(
        `Successfully promoted remaining classes: promoted ${result.promoted} students, moved ${result.alumni} to alumni.`
      );
      setShowRemainingPrompt(false);
      await refreshStudents();
    } catch (error) {
      notify.error(error, "Failed to promote remaining classes");
    } finally {
      setPromoting(false);
    }
  };

  const openAddModal =
    (mode) => {
      setAddMode(mode);
      setShowAddMenu(false);
      setShowAddModal(true);
    };

  const pageButtons =
    useMemo(
      () => {
        const totalPages =
          pagination.totalPages || 1;

        if (totalPages <= 3) {
          return Array.from(
            {
              length:
                totalPages,
            },
            (_, index) =>
              index + 1
          );
        }

        return [
          1,
          Math.min(
            Math.max(
              pagination.page,
              2
            ),
            totalPages - 1
          ),
          totalPages,
        ].filter(
          (value, index, array) =>
            array.indexOf(value) ===
            index
        );
      },
      [pagination]
    );

  if (!classNameParam) {
    return (
      <DirectoryStudentsView
        directoryData={
          directoryData
        }
        directoryLoading={
          directoryLoading
        }
        directoryTab={
          directoryTab
        }
        setDirectoryTab={
          setDirectoryTab
        }
        searchTerm={
          searchTerm
        }
        setSearchTerm={
          setSearchTerm
        }
        sortBy={sortBy}
        setSortBy={setSortBy}
        directoryClassId={
          directoryClassId
        }
        setDirectoryClassId={
          setDirectoryClassId
        }
        directorySectionId={
          directorySectionId
        }
        setDirectorySectionId={
          setDirectorySectionId
        }
        directoryPaymentStatus={
          directoryPaymentStatus
        }
        setDirectoryPaymentStatus={
          setDirectoryPaymentStatus
        }
        currentPage={
          currentPage
        }
        setCurrentPage={
          setCurrentPage
        }
        navigate={navigate}
        onRefresh={
          refreshDirectory
        }
      />
    );
  }

  if (!classNameParam) {
    const directoryStats =
      directoryData.stats;
    const directoryStudents =
      directoryData.students;
    const directoryPagination =
      directoryData.pagination;
    const directoryTotalFees =
      directoryStats.totalFees || 0;
    const collectedPercent =
      directoryTotalFees === 0
        ? 0
        : (
            (directoryStats.feeCollected /
              directoryTotalFees) *
            100
          );
    const pendingPercent =
      directoryTotalFees === 0
        ? 0
        : (
            (directoryStats.totalPending /
              directoryTotalFees) *
            100
          );

    return (
      <div
        className="
          mx-auto
          w-full
          max-w-[1180px]
          space-y-5
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          <div>
            <p
              className="
                text-sm
                font-bold
                text-blue-600
              "
            >
              Student Directory
            </p>
            <h1
              className="
                mt-1
                text-3xl
                font-extrabold
                text-slate-950
              "
            >
              Students
            </h1>
            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                font-semibold
                text-slate-500
              "
            >
              View active, alumni, and previous students with real fee records and live analytics.
            </p>
          </div>

          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
            "
          >
            <div
              className="
                relative
              "
            >
              <Search
                size={18}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />
              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search all students..."
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-10
                  pr-3
                  text-sm
                  font-semibold
                  text-slate-700
                  outline-none
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-50
                  sm:w-72
                "
              />
            </div>

            <SelectControl
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value
                )
              }
            >
              {
                sortOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      Sort: {option.label}
                    </option>
                  )
                )
              }
            </SelectControl>


          </div>
        </div>

        <div
          className="
            grid
            gap-3
            md:grid-cols-3
          "
        >
          {
            directoryTabs.map((tab) => {
              const isActive =
                directoryTab ===
                tab.value;
              const count =
                directoryData.statusCounts[
                  tab.value
                ] || 0;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() =>
                    setDirectoryTab(
                      tab.value
                    )
                  }
                  className={`
                    rounded-xl
                    border
                    p-4
                    text-left
                    transition
                    ${
                      isActive
                        ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                    }
                  `}
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <div>
                      <p
                        className="
                          text-lg
                          font-extrabold
                        "
                      >
                        {tab.label}
                      </p>
                      <p
                        className={`
                          mt-1
                          text-xs
                          font-semibold
                          ${
                            isActive
                              ? "text-blue-100"
                              : "text-slate-500"
                          }
                        `}
                      >
                        {tab.description}
                      </p>
                    </div>
                    <span
                      className={`
                        rounded-xl
                        px-3
                        py-2
                        text-xl
                        font-extrabold
                        ${
                          isActive
                            ? "bg-white/15"
                            : "bg-slate-100 text-slate-950"
                        }
                      `}
                    >
                      {count}
                    </span>
                  </div>
                </button>
              );
            })
          }
        </div>

        <div
          className="
            grid
            gap-4
            md:grid-cols-2
            xl:grid-cols-4
          "
        >
          <StatCard
            title="Total Students"
            value={
              directoryStats.totalStudents
            }
            note={`${directoryData.statusCounts.all} overall records`}
            icon={Users}
            iconBg="bg-blue-100"
            iconClass="text-blue-600"
          />
          <StatCard
            title="Total Fees"
            value={formatCurrency(
              directoryStats.totalFees
            )}
            note="Based on student fee rows"
            icon={GraduationCap}
            iconBg="bg-violet-100"
            iconClass="text-violet-600"
          />
          <StatCard
            title="Fee Collected"
            value={formatCurrency(
              directoryStats.feeCollected
            )}
            note={`${collectedPercent.toFixed(2)}% collected`}
            icon={WalletCards}
            iconBg="bg-emerald-100"
            iconClass="text-emerald-600"
          />
          <StatCard
            title="Total Pending"
            value={formatCurrency(
              directoryStats.totalPending
            )}
            note={`${pendingPercent.toFixed(2)}% pending`}
            icon={FileSpreadsheet}
            iconBg="bg-orange-100"
            iconClass="text-orange-600"
          />
        </div>

        <div
          className="
            grid
            gap-5
            xl:grid-cols-[1fr_330px]
          "
        >
          <div
            className="
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-100
                px-5
                py-4
              "
            >
              <div>
                <h2
                  className="
                    text-lg
                    font-extrabold
                    text-slate-950
                  "
                >
                  {directoryTabs.find(
                    (tab) =>
                      tab.value ===
                      directoryTab
                  )?.label} Students
                </h2>
                <p
                  className="
                    mt-1
                    text-sm
                    font-semibold
                    text-slate-500
                  "
                >
                  Showing {directoryStudents.length} of {directoryPagination.total} real records
                </p>
              </div>
              {
                directoryLoading && (
                  <span className="text-xs font-bold text-blue-600">
                    Loading...
                  </span>
                )
              }
            </div>

            <div
              className="
                hidden
                overflow-x-auto
                lg:block
              "
            >
              <table
                className="
                  w-full
                  min-w-[860px]
                  text-left
                "
              >
                <thead
                  className="
                    bg-slate-50
                    text-xs
                    font-bold
                    uppercase
                    text-slate-500
                  "
                >
                  <tr>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Class</th>
                    <th className="px-5 py-3">Mobile</th>
                    <th className="px-5 py-3">Fees</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={directoryLoading ? "opacity-60" : ""}>
                  {
                    directoryLoading ? (
                      <TableBodySkeleton
                        rows={6}
                        columns={6}
                      />
                    ) : directoryStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="
                            px-5
                            py-10
                            text-center
                            text-sm
                            font-semibold
                            text-slate-500
                          "
                        >
                          No students found.
                        </td>
                      </tr>
                    ) : (
                      directoryStudents.map(
                        (student) => (
                          <tr
                            key={student.id}
                            className="
                              border-b
                              border-slate-100
                              last:border-0
                              hover:bg-blue-50/30
                            "
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <StudentAvatar student={student} />
                                <div>
                                  <p className="text-sm font-extrabold text-slate-950">{student.fullName}</p>
                                  <p className="mt-1 text-xs font-semibold text-slate-500">
                                    Roll {student.rollNumber} - Reg {student.schoolRegisterNo}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm font-bold text-slate-700">
                              {student.className} ({student.sectionName})
                            </td>
                            <td className="px-5 py-4 text-sm font-bold text-slate-700">
                              {student.phone}
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-extrabold text-slate-900">{formatCurrency(student.totalFees)}</p>
                              <p className="mt-1 text-xs font-bold text-red-500">Due {formatCurrency(student.pendingFees)}</p>
                              {Number(student.overdueFees || 0) > 0 && (
                                <p className="mt-1 text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                                  Overdue {formatCurrency(student.overdueFees)}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`${statusClass[student.paymentStatus] || statusClass.Pending} rounded-md px-3 py-1.5 text-xs font-bold`}>
                                {student.paymentStatus}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/students/${student.schoolRegisterNo}`
                                  )
                                }
                                className="
                                  rounded-xl
                                  bg-blue-600
                                  px-4
                                  py-2
                                  text-xs
                                  font-bold
                                  text-white
                                  hover:bg-blue-700
                                "
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        )
                      )
                    )
                  }
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {
                directoryStudents.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-500">
                    No students found.
                  </div>
                ) : (
                  directoryStudents.map(
                    (student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() =>
                          navigate(
                            `/students/${student.schoolRegisterNo}`
                          )
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          p-4
                          text-left
                          transition
                          hover:border-blue-200
                          hover:bg-blue-50/30
                        "
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <StudentAvatar student={student} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-slate-950">{student.fullName}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {student.className} ({student.sectionName})
                              </p>
                            </div>
                          </div>
                          <span className={`${statusClass[student.paymentStatus] || statusClass.Pending} shrink-0 rounded-md px-2 py-1 text-xs font-bold`}>
                            {student.paymentStatus}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                          <p>
                            <span className="font-semibold text-slate-400">Mobile</span>
                            <br />
                            <span className="font-bold text-slate-700">{student.phone}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-slate-400">Total Fee</span>
                            <br />
                            <span className="font-extrabold text-slate-900">{formatCurrency(student.totalFees)}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-slate-400">Collected</span>
                            <br />
                            <span className="font-extrabold text-emerald-600">{formatCurrency(student.collectedFees)}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-slate-400">Pending</span>
                            <br />
                            <span className="font-extrabold text-red-500">{formatCurrency(student.pendingFees)}</span>
                            {Number(student.overdueFees || 0) > 0 && (
                              <>
                                <br />
                                <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-100 mt-1 inline-block">
                                  Overdue {formatCurrency(student.overdueFees)}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </button>
                    )
                  )
                )
              }
            </div>

            <div
              className="
                flex
                flex-col
                gap-3
                border-t
                border-slate-100
                px-5
                py-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <p className="text-sm font-semibold text-slate-500">
                Page {directoryPagination.page} of {directoryPagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(1, page - 1)
                    )
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={
                    currentPage >=
                    directoryPagination.totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        page + 1
                    )
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <aside
            className="
              space-y-5
            "
          >
            <div
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-5
              "
            >
              <h2 className="text-base font-extrabold text-slate-950">Fee Analysis</h2>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Collected</span>
                    <span>{collectedPercent.toFixed(2)}%</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-emerald-500"
                      style={{
                        width: `${Math.min(100, collectedPercent)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Pending</span>
                    <span>{pendingPercent.toFixed(2)}%</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-orange-400"
                      style={{
                        width: `${Math.min(100, pendingPercent)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-5
              "
            >
              <h2 className="text-base font-extrabold text-slate-950">Payment Mix</h2>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-lg font-extrabold text-emerald-600">{directoryStats.paid}</p>
                  <p className="mt-1 text-[11px] font-bold text-emerald-700">Paid</p>
                </div>
                <div className="rounded-xl bg-orange-50 p-3">
                  <p className="text-lg font-extrabold text-orange-500">{directoryStats.partial}</p>
                  <p className="mt-1 text-[11px] font-bold text-orange-700">Partial</p>
                </div>
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="text-lg font-extrabold text-red-500">{directoryStats.pending}</p>
                  <p className="mt-1 text-[11px] font-bold text-red-700">Pending</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <PageLoadingSkeleton />
    );
  }

  if (
    !selectedClass ||
    !selectedSection
  ) {
    return (
      <div
        className="
          rounded-xl
          border
          border-slate-200
          bg-white
          p-5
          text-sm
          text-slate-500
        "
      >
        Class or section not found.
      </div>
    );
  }

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1180px]
        space-y-5
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
          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
              text-xs
              font-semibold
              text-slate-500
            "
          >
            <button
              type="button"
              onClick={() =>
                navigate("/classes")
              }
              className="hover:text-blue-600"
            >
              Classes
            </button>
            <span>&gt;</span>
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/classes/${classNameParam}/sections`
                )
              }
              className="hover:text-blue-600"
            >
              {selectedClass.name}
            </button>
            <span>&gt;</span>
            <span>
              Section {selectedSection.name}
            </span>
          </div>

          <div
            className="
              mt-3
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <div className="flex items-center gap-2">
              <h1
                className="
                  text-2xl
                  font-extrabold
                  tracking-normal
                  text-slate-950
                "
              >
                {selectedClass.name} - Section {selectedSection.name}
              </h1>
              <Tooltip content="Manage students registry, record payments, promote students, and track fees.">
                <button type="button" className="text-slate-400 hover:text-slate-600 transition p-1 mt-1">
                  <Info size={16} />
                </button>
              </Tooltip>
            </div>
            {!feeStructureReady && (
              <p className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                Fee structure is not set for this class. Open{" "}
                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  className="font-extrabold text-amber-950 underline"
                >
                  Settings → Fees
                </button>
                , select this class, assign fees, then add students.
              </p>
            )}
            <span
              className="
                rounded-md
                bg-yellow-100
                px-2
                py-1
                text-[11px]
                font-bold
                text-yellow-700
              "
            >
              {
                selectedSection.isArchived
                  ? "Archived"
                  : "Active"
              }
            </span>
          </div>

          <p
            className="
              mt-2
              text-sm
              font-medium
              text-slate-500
            "
          >
            {stats.totalStudents} Students - Section students and fee overview
          </p>
        </div>

        <div
          className="
            flex
            flex-wrap
            gap-2
            sm:justify-end
          "
        >

          <button
            type="button"
            onClick={() =>
              setShowOptionalFees(
                true
              )
            }
            className="
              flex
              h-11
              items-center
              gap-2
              rounded-lg
              border
              border-indigo-200
              bg-indigo-50
              px-4
              text-xs
              font-bold
              text-indigo-700
              hover:bg-indigo-100
            "
          >
            <ReceiptText size={16} />
            Add Optional Fees to Section
          </button>

          <button
            type="button"
            onClick={() =>
              setWhatsappStudent({
                id: "section-broadcast",
                fullName: `Section ${selectedSection?.name || ""} Broadcast`,
                phone: `${selectedClass?.name || ""} - ${selectedSection?.name || ""}`,
                isBroadcast: true,
                sectionId: sectionId,
                className: selectedClass?.name
              })
            }
            className="
              flex
              h-11
              items-center
              gap-2
              rounded-lg
              border
              border-emerald-200
              bg-emerald-50
              px-4
              text-xs
              font-bold
              text-emerald-700
              hover:bg-emerald-100
            "
          >
            <FaWhatsapp size={16} className="fill-[#25D366] text-[#25D366]" />
            Broadcast to Section
          </button>

          {isTenthClassSelected && !isPromotionMode && (
            <button
              type="button"
              onClick={enterPromotionMode}
              className="
                flex
                h-11
                items-center
                gap-2
                rounded-lg
                border
                border-amber-200
                bg-amber-50
                px-4
                text-xs
                font-bold
                text-amber-700
                hover:bg-amber-100
              "
            >
              <ArrowUpCircle size={16} />
              Promote Students
            </button>
          )}

          <div
            className="
              relative
            "
          >
            <button
              type="button"
              disabled={
                !canAddStudents
              }
              onClick={() =>
                setShowAddMenu(
                  (value) =>
                    !value
                )
              }
              className={`
                flex
                h-11
                items-center
                gap-2
                rounded-lg
                px-4
                text-xs
                font-bold
                text-white
                shadow-sm
                ${
                  canAddStudents
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "cursor-not-allowed bg-slate-300"
                }
              `}
            >
              <Plus size={16} />
              Add Student
              <ChevronDown size={14} />
            </button>

            {
              showAddMenu && (
                <div
                  className="
                    absolute
                    right-0
                    z-20
                    mt-2
                    w-48
                    overflow-hidden
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    py-1
                    shadow-xl
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      openAddModal(
                        "manual"
                      )
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-2
                      px-4
                      py-3
                      text-left
                      text-sm
                      font-semibold
                      text-slate-700
                      hover:bg-slate-50
                    "
                  >
                    <Pencil size={15} />
                    Manual Entry
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openAddModal(
                        "excel"
                      )
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-2
                      px-4
                      py-3
                      text-left
                      text-sm
                      font-semibold
                      text-slate-700
                      hover:bg-slate-50
                    "
                  >
                    <Upload size={15} />
                    Excel Upload
                  </button>
                </div>
              )
            }
          </div>
        </div>
      </div>

      <div
        className="
          grid
          grid-cols-2
          gap-4
          lg:grid-cols-4
        "
      >
        {
          statCards.map(
            (card) => (
              <StatCard
                key={card.title}
                {...card}
              />
            )
          )
        }
      </div>

      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >
        {isPromotionMode && (
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-amber-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            {promotionClasses.length === 0 ? (
              <p className="text-sm font-semibold text-amber-900">
                No active 11th-grade stream classes (e.g. 11th-Arts, 11th-SM) found for target academic year {getNextYear(selectedClass?.academicYear)}. Please create them under Settings → Academic Year/Classes first.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-slate-800">
                  Promote {selectedStudentIds.length} Student(s)
                </span>
                <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Target Class:</label>
                  <select
                    value={targetPromotionClassId}
                    onChange={(e) => setTargetPromotionClassId(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium outline-none focus:border-blue-500"
                  >
                    {promotionClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Target Section:</label>
                  {promotionSections.length === 0 ? (
                    <span className="text-xs font-semibold text-red-600">
                      No active sections — configure sections in Classes first.
                    </span>
                  ) : (
                    <select
                      value={targetPromotionSectionId}
                      onChange={(e) => setTargetPromotionSectionId(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium outline-none focus:border-blue-500"
                    >
                      {promotionSections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPromotionMode(false);
                  setSelectedStudentIds([]);
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  promoting ||
                  selectedStudentIds.length === 0 ||
                  promotionClasses.length === 0 ||
                  promotionSections.length === 0
                }
                onClick={handlePromoteSelected}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:bg-slate-300"
              >
                {promoting ? "Promoting..." : "Promote Selected"}
              </button>
            </div>
          </div>
        )}

        <div
          className="
            flex
            flex-col
            gap-3
            border-b
            border-slate-100
            p-4
            xl:flex-row
            xl:items-center
            xl:justify-between
          "
        >
          <div
            className="
              relative
              w-full
              xl:max-w-[300px]
            "
          >
            <Search
              size={15}
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />
            <input
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search students..."
              className="
                h-11
                w-full
                rounded-lg
                border
                border-slate-200
                bg-white
                pl-9
                pr-3
                text-xs
                font-medium
                outline-none
                focus:border-blue-500
              "
            />
          </div>

          <div
            className="
              grid
              gap-3
              sm:grid-cols-3
              xl:flex
              xl:items-center
            "
          >
            <SelectControl
              value="All Status"
              onChange={() => {}}
              className="xl:w-40"
            >
              <option>All Status</option>
            </SelectControl>
            <SelectControl
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="xl:w-48"
            >
              <option value="">All Payment Status</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
            </SelectControl>
            <SelectControl
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value
                )
              }
              className="xl:w-36"
            >
              {
                sortOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )
              }
            </SelectControl>
            <button
              type="button"
              className="
                hidden
                h-11
                w-11
                items-center
                justify-center
                rounded-lg
                border
                border-slate-200
                text-slate-500
                xl:flex
              "
              title="Advanced filter"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div
          className="
            hidden
            overflow-x-auto
            lg:block
          "
        >
          <table
            className="
              w-full
              min-w-[900px]
            "
          >
            <thead>
              <tr
                className="
                  border-b
                  border-slate-100
                "
              >
                {isPromotionMode && (
                  <th className="px-5 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.length === students.length && students.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIds(students.map((s) => s.id));
                        } else {
                          setSelectedStudentIds([]);
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                {
                  [
                    "#",
                    "Student Name",
                    "Father Name",
                    "Mobile",
                    "Payment Status",
                    "Due Amount",
                    "Action",
                  ].map((head) => {
                    if (isPromotionMode && head === "#") return null;
                    return (
                      <th
                        key={head}
                        className="
                          px-5
                          py-4
                          text-left
                          text-[11px]
                          font-extrabold
                          text-slate-500
                        "
                      >
                        {head}
                      </th>
                    );
                  })
                }
              </tr>
            </thead>
            <tbody
              className={`
                ${
                  tableLoading
                    ? "opacity-60"
                    : ""
                }
              `}
            >
              {
                tableLoading ? (
                  <TableBodySkeleton
                    rows={6}
                    columns={7}
                  />
                ) : students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="
                        px-5
                        py-12
                        text-center
                        text-sm
                        font-semibold
                        text-slate-500
                      "
                    >
                      No students found.
                    </td>
                  </tr>
                ) : (
                  students.map(
                    (student, index) => (
                      <tr
                        key={student.id}
                        className="
                          border-b
                          border-slate-100
                          last:border-b-0
                          hover:bg-slate-50
                        "
                      >
                        {isPromotionMode && (
                          <td className="px-5 py-4 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudentIds((prev) => [...prev, student.id]);
                                } else {
                                  setSelectedStudentIds((prev) =>
                                    prev.filter((id) => id !== student.id)
                                  );
                                }
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                        )}
                        {!isPromotionMode && (
                          <td
                            className="
                              px-5
                              py-4
                              text-sm
                              font-bold
                              text-slate-500
                            "
                          >
                            {(pagination.page - 1) * pageSize + index + 1}
                          </td>
                        )}
                        <td
                          className="
                            px-5
                            py-4
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              gap-3
                            "
                          >
                            <StudentAvatar
                              student={student}
                            />
                            <div>
                              <p
                                className="
                                  text-sm
                                  font-extrabold
                                  text-slate-900
                                "
                              >
                                {student.fullName}
                              </p>
                              <p
                                className="
                                  mt-1
                                  text-xs
                                  font-semibold
                                  text-slate-500
                                "
                              >
                                Roll No. {student.rollNumber}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td
                          className="
                            px-5
                            py-4
                            text-sm
                            font-semibold
                            text-slate-600
                          "
                        >
                          {student.fatherName}
                        </td>
                        <td
                          className="
                            px-5
                            py-4
                            text-sm
                            font-semibold
                            text-slate-600
                          "
                        >
                          {student.phone}
                        </td>
                        <td
                          className="
                            px-5
                            py-4
                          "
                        >
                          <span
                            className={`
                              rounded-md
                              px-3
                              py-1.5
                              text-xs
                              font-bold
                              ${statusClass[student.paymentStatus] || statusClass.Pending}
                            `}
                          >
                            {student.paymentStatus}
                          </span>
                        </td>
                        <td
                          className={`
                            px-5
                            py-4
                            text-sm
                            font-extrabold
                            ${
                              Number(
                                student.pendingFees || 0
                              ) > 0
                                ? "text-red-500"
                                : "text-emerald-600"
                            }
                          `}
                        >
                          {formatCurrency(student.pendingFees)}
                          {Number(student.overdueFees || 0) > 0 && (
                            <div className="mt-1 text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-100 inline-block">
                              Overdue {formatCurrency(student.overdueFees)}
                            </div>
                          )}
                        </td>
                        <td
                          className="
                            px-5
                            py-4
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              gap-4
                              text-blue-700
                            "
                          >
                            <Tooltip content="View student">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/classes/${classNameParam}/sections/${sectionNameParam}/students/${student.schoolRegisterNo}`
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-blue-600 hover:border-blue-200 hover:bg-blue-50 active:scale-95 transition"
                              >
                                <Eye size={17} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Record payment">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setPaymentStudentId(
                                    student.id
                                  );
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50"
                              >
                                <WalletCards size={17} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Send WhatsApp Message">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setWhatsappStudent(student);
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 active:scale-95 transition"
                              >
                                <FaWhatsapp size={17} className="fill-[#25D366]" />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )
              }
            </tbody>
          </table>
        </div>

        <div
          className="
            space-y-3
            p-4
            lg:hidden
          "
        >
          {
            students.length === 0 ? (
              <div
                className="
                  rounded-xl
                  border
                  border-slate-200
                  p-4
                  text-sm
                  font-semibold
                  text-slate-500
                "
              >
                No students found.
              </div>
            ) : (
              students.map(
                (student) => (
                  <div
                    key={student.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (isPromotionMode) {
                        if (selectedStudentIds.includes(student.id)) {
                          setSelectedStudentIds((prev) =>
                            prev.filter((id) => id !== student.id)
                          );
                        } else {
                          setSelectedStudentIds((prev) => [...prev, student.id]);
                        }
                      } else {
                        navigate(
                          `/classes/${classNameParam}/sections/${sectionNameParam}/students/${student.schoolRegisterNo}`
                        );
                      }
                    }}
                    onKeyDown={(event) => {
                      if (!isPromotionMode && (event.key === "Enter" || event.key === " ")) {
                        navigate(
                          `/classes/${classNameParam}/sections/${sectionNameParam}/students/${student.schoolRegisterNo}`
                        );
                      }
                    }}
                    className="
                      cursor-pointer
                      rounded-xl
                      border
                      border-slate-200
                      p-4
                      transition
                      hover:border-blue-200
                      hover:bg-blue-50/30
                    "
                  >
                    <div
                      className="
                        flex
                        items-start
                        justify-between
                        gap-3
                      "
                    >
                      {isPromotionMode && (
                        <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds((prev) => [...prev, student.id]);
                              } else {
                                setSelectedStudentIds((prev) =>
                                  prev.filter((id) => id !== student.id)
                                );
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-3
                        "
                      >
                        <StudentAvatar
                          student={student}
                        />
                        <div
                          className="
                            min-w-0
                          "
                        >
                          <p
                            className="
                              truncate
                              text-sm
                              font-extrabold
                              text-slate-900
                            "
                          >
                            {student.fullName}
                          </p>
                          <p
                            className="
                              mt-1
                              text-xs
                              font-semibold
                              text-slate-500
                            "
                          >
                            Roll No. {student.rollNumber}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`
                          shrink-0
                          rounded-md
                          px-2
                          py-1
                          text-xs
                          font-bold
                          ${statusClass[student.paymentStatus] || statusClass.Pending}
                        `}
                      >
                        {student.paymentStatus}
                      </span>
                    </div>

                    <div
                      className="
                        mt-4
                        grid
                        grid-cols-2
                        gap-3
                        text-xs
                      "
                    >
                      <p>
                        <span className="font-semibold text-slate-400">Father</span>
                        <br />
                        <span className="font-bold text-slate-700">{student.fatherName}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-400">Mobile</span>
                        <br />
                        <span className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">{student.phone}</span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setWhatsappStudent(student);
                            }}
                            className="text-emerald-500 hover:text-emerald-600 active:scale-95 transition"
                          >
                            <FaWhatsapp size={14} className="fill-[#25D366]" />
                          </button>
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-400">Due</span>
                        <br />
                        <span
                          className={`
                            font-extrabold
                            ${
                              Number(
                                student.pendingFees || 0
                              ) > 0
                                ? "text-red-500"
                                : "text-emerald-600"
                            }
                          `}
                        >
                          {formatCurrency(student.pendingFees)}
                          {Number(student.overdueFees || 0) > 0 && (
                            <>
                              <br />
                              <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-100 mt-1 inline-block">
                                Overdue {formatCurrency(student.overdueFees)}
                              </span>
                            </>
                          )}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-400">Collected</span>
                        <br />
                        <span className="font-extrabold text-emerald-600">
                          {formatCurrency(student.collectedFees)}
                        </span>
                      </p>
                    </div>
                  </div>
                )
              )
            )
          }
        </div>

        <div
          className="
            flex
            flex-col
            gap-4
            border-t
            border-slate-100
            p-4
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div
            className="
              grid
              grid-cols-2
              gap-4
              text-sm
              sm:grid-cols-4
            "
          >
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Students</p>
              <p className="mt-1 text-xl font-extrabold text-slate-950">{stats.totalStudents}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Paid</p>
              <p className="mt-1 text-xl font-extrabold text-emerald-600">
                {stats.paid} <span className="text-xs">({formatPercent(stats.paid, stats.totalStudents)})</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Partial</p>
              <p className="mt-1 text-xl font-extrabold text-orange-500">
                {stats.partial} <span className="text-xs">({formatPercent(stats.partial, stats.totalStudents)})</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Pending</p>
              <p className="mt-1 text-xl font-extrabold text-red-500">
                {stats.pending} <span className="text-xs">({formatPercent(stats.pending, stats.totalStudents)})</span>
              </p>
            </div>
          </div>

          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
            "
          >
            <p
              className="
                text-xs
                font-semibold
                text-slate-500
              "
            >
              Showing {
                pagination.total === 0
                  ? 0
                  : (pagination.page - 1) *
                      pageSize +
                    1
              } to {Math.min(
                pagination.page *
                  pageSize,
                pagination.total
              )} of {pagination.total} students
            </p>

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <button
                type="button"
                disabled={
                  pagination.page === 1
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        1,
                        page - 1
                      )
                  )
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-slate-200
                  text-slate-600
                  disabled:opacity-40
                "
              >
                <ChevronLeft size={16} />
              </button>

              {
                pageButtons.map(
                  (page, index) => (
                    <div
                      key={`${page}-${index}`}
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >
                      {
                        index > 0 &&
                        page -
                          pageButtons[index - 1] >
                          1 && (
                          <span className="text-slate-400">...</span>
                        )
                      }
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                        className={`
                          h-10
                          min-w-10
                          rounded-lg
                          px-3
                          text-sm
                          font-extrabold
                          ${
                            pagination.page ===
                            page
                              ? "bg-blue-600 text-white"
                              : "border border-slate-200 text-slate-600"
                          }
                        `}
                      >
                        {page}
                      </button>
                    </div>
                  )
                )
              }

              <button
                type="button"
                disabled={
                  pagination.page ===
                  pagination.totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        pagination.totalPages,
                        page + 1
                      )
                  )
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-slate-200
                  text-slate-600
                  disabled:opacity-40
                "
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <RecordPaymentModal
        open={Boolean(paymentStudentId)}
        studentId={paymentStudentId}
        onClose={() =>
          setPaymentStudentId(null)
        }
        onSaved={refreshStudents}
      />

      {
        showAddModal && (
          <AddStudentModal
            selectedClass={
              selectedClass
            }
            selectedSection={
              selectedSection
            }
            initialMode={
              addMode
            }
            onClose={() =>
              setShowAddModal(false)
            }
            onSaved={
              refreshStudents
            }
          />
        )
      }

      {
        showOptionalFees &&
          resolvedClassId &&
          resolvedSectionId && (
          <AllocateOptionalFeesModal
            classId={resolvedClassId}
            sectionId={resolvedSectionId}
            title="Add Optional Fees to Section"
            description={`Assign optional fees to all students in ${selectedSection?.name || "this section"}`}
            onClose={() =>
              setShowOptionalFees(
                false
              )
            }
            onSuccess={
              refreshStudents
            }
          />
        )
      }

      {showRemainingPrompt && (
        <div
          role="presentation"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-900">
              All 10th Class Students Promoted!
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Now that the 10th class students have been manually promoted to their respective streams, would you like to automatically promote all other remaining classes (e.g. 1st to 9th, and 11th) to the new academic year?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRemainingPrompt(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Skip / Later
              </button>
              <button
                type="button"
                disabled={promoting}
                onClick={handlePromoteRemaining}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:bg-slate-300"
              >
                {promoting ? "Promoting..." : "Promote Automatically"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SendWhatsappModal
        isOpen={!!whatsappStudent}
        onClose={() => setWhatsappStudent(null)}
        student={whatsappStudent}
      />
    </div>
  );
}
