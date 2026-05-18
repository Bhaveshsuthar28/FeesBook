import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Edit3,
  LoaderCircle,
  MessageCircle,
  Phone,
  ReceiptText,
  Save,
  User,
  WalletCards,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getStudentDetail,
  recordStudentPayment,
  updateStudent,
  updateStudentFee,
} from "../lib/api/studentapi.js";

const emptyStudentForm = {
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

const tabItems = [
  {
    id: "overview",
    label: "Overview",
    icon: ClipboardList,
  },
  {
    id: "fees",
    label: "Fee Details",
    icon: ReceiptText,
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
  },
  {
    id: "reminders",
    label: "Reminders",
    icon: Bell,
  },
];

const statusClass = {
  paid:
    "bg-emerald-100 text-emerald-700",
  partial:
    "bg-orange-100 text-orange-700",
  pending:
    "bg-red-100 text-red-700",
};

const toInputDate =
  (value) => {
    if (
      !/^\d{2}\/\d{2}\/\d{4}$/.test(
        value || ""
      )
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

const fromInputDate =
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

const formatCurrency =
  (amount) =>
    `Rs ${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate =
  (value) => {
    if (!value) {
      return "Not recorded";
    }

    const date =
      new Date(Number(value));

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Not recorded";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

const getInitials =
  (student) =>
    `${student?.firstName?.[0] || "S"}${student?.lastName?.[0] || ""}`.toUpperCase();

function StudentAvatar({
  student,
  size = "large",
}) {
  const classes =
    size === "large"
      ? "h-20 w-20 text-xl"
      : "h-14 w-14 text-base";

  if (student?.photoUrl) {
    return (
      <img
        src={student.photoUrl}
        alt={student.fullName}
        className={`
          ${classes}
          rounded-2xl
          object-cover
        `}
      />
    );
  }

  return (
    <div
      className={`
        ${classes}
        flex
        items-center
        justify-center
        rounded-2xl
        bg-blue-100
        font-extrabold
        text-blue-700
      `}
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
  className = "",
}) {
  return (
    <div
      className={`
        rounded-xl
        border
        border-slate-200
        bg-white
        p-4
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-blue-50
            text-blue-600
          "
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500">{title}</p>
          <p className="mt-1 text-lg font-extrabold text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{note}</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}) {
  return (
    <div
      className="
        flex
        items-start
        justify-between
        gap-4
        border-b
        border-slate-100
        py-3
      "
    >
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-right text-sm font-bold text-slate-800">{value || "Not recorded"}</span>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  children,
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      {
        children || (
          <input
            type={type}
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value
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
              outline-none
              focus:border-blue-500
              focus:ring-4
              focus:ring-blue-50
            "
          />
        )
      }
    </label>
  );
}

function EditStudentModal({
  detail,
  onClose,
  onSaved,
}) {
  const [
    form,
    setForm,
  ] = useState(() => ({
    ...emptyStudentForm,
    ...detail.student,
  }));
  const [
    saving,
    setSaving,
  ] = useState(false);
  const [
    error,
    setError,
  ] = useState("");

  const update =
    (field, value) =>
      setForm((current) => ({
        ...current,
        [field]: value,
      }));

  const save =
    async () => {
      try {
        setSaving(true);
        setError("");
        const result =
          await updateStudent({
            studentId:
              detail.student.id,
            data: form,
          });
        onSaved(result);
        onClose();
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Student could not be updated"
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-extrabold text-slate-950">Edit Student</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Update real student information.</p>
        </div>
        <div className="grid max-h-[65vh] gap-4 overflow-y-auto px-5 py-5 sm:grid-cols-2">
          <InputField label="Sr no" value={form.schoolRegisterNo || ""} onChange={(value) => update("schoolRegisterNo", value)} />
          <InputField label="First name" value={form.firstName || ""} onChange={(value) => update("firstName", value)} />
          <InputField label="Last name" value={form.lastName || ""} onChange={(value) => update("lastName", value)} />
          <InputField label="Father name" value={form.fatherName || ""} onChange={(value) => update("fatherName", value)} />
          <InputField label="Mobile number" value={form.phone || ""} onChange={(value) => update("phone", value)} />
          <InputField label="Gender" value={form.gender || ""} onChange={(value) => update("gender", value)}>
            <select
              value={form.gender || ""}
              onChange={(event) => update("gender", event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </InputField>
          <InputField label="Date of birth" type="date" value={toInputDate(form.dob)} onChange={(value) => update("dob", fromInputDate(value))} />
          <InputField label="Admission date" type="date" value={toInputDate(form.admissionDate)} onChange={(value) => update("admissionDate", fromInputDate(value))} />
          <InputField label="Aadhar no" value={form.aadharNo || ""} onChange={(value) => update("aadharNo", value)} />
          <InputField label="Aadhar verification" value={form.aadharVerificationStatus || ""} onChange={(value) => update("aadharVerificationStatus", value)} />
          <InputField label="Photo URL" value={form.photoUrl || ""} onChange={(value) => update("photoUrl", value)} />
          <InputField label="Photo file ID" value={form.photoFileId || ""} onChange={(value) => update("photoFileId", value)} />
        </div>
        {
          error && (
            <div className="mx-5 mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )
        }
        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-300">
            {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({
  detail,
  onClose,
  onSaved,
}) {
  const unpaidFees =
    detail.fees.filter(
      (fee) =>
        Number(fee.dueAmount || 0) >
        0
    );
  const [
    form,
    setForm,
  ] = useState({
    studentFeeId:
      unpaidFees[0]?.id || "",
    amount: "",
    paidAt:
      new Date()
        .toISOString()
        .slice(0, 10),
    note: "",
  });
  const [
    saving,
    setSaving,
  ] = useState(false);
  const [
    error,
    setError,
  ] = useState("");

  const selectedFee =
    unpaidFees.find(
      (fee) =>
        fee.id ===
        form.studentFeeId
    );

  const save =
    async () => {
      try {
        setSaving(true);
        setError("");
        const result =
          await recordStudentPayment({
            studentId:
              detail.student.id,
            data: {
              studentFeeId:
                form.studentFeeId,
              amount:
                Number(form.amount),
              paidAt:
                new Date(
                  form.paidAt
                ).getTime(),
              note:
                form.note,
            },
          });
        onSaved(result);
        onClose();
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Payment could not be recorded"
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-extrabold text-slate-950">Record Payment</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">This creates a real dated payment record.</p>
        </div>
        <div className="space-y-4 px-5 py-5">
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-slate-600">Fee item</span>
            <select
              value={form.studentFeeId}
              onChange={(event) => setForm((current) => ({ ...current, studentFeeId: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            >
              {
                unpaidFees.map((fee) => (
                  <option key={fee.id} value={fee.id}>
                    {fee.feeTypeName} - remaining {formatCurrency(fee.dueAmount)}
                  </option>
                ))
              }
            </select>
          </label>
          <InputField label="Amount" type="number" value={form.amount} onChange={(value) => setForm((current) => ({ ...current, amount: value }))} />
          <InputField label="Payment date" type="date" value={form.paidAt} onChange={(value) => setForm((current) => ({ ...current, paidAt: value }))} />
          <InputField label="Note" value={form.note} onChange={(value) => setForm((current) => ({ ...current, note: value }))} />
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700">
            Available remaining balance: {formatCurrency(selectedFee?.dueAmount || 0)}
          </div>
        </div>
        {
          error && (
            <div className="mx-5 mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )
        }
        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={saving || !form.studentFeeId || !Number(form.amount)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-300">
            {saving ? <LoaderCircle size={16} className="animate-spin" /> : <CreditCard size={16} />}
            Record
          </button>
        </div>
      </div>
    </div>
  );
}

function FeeEditRow({
  fee,
  studentId,
  onSaved,
}) {
  const [
    editing,
    setEditing,
  ] = useState(false);
  const [
    values,
    setValues,
  ] = useState({
    amount:
      fee.amount,
    paidAmount:
      fee.paidAmount,
  });
  const [
    saving,
    setSaving,
  ] = useState(false);

  const save =
    async () => {
      setSaving(true);
      try {
        const result =
          await updateStudentFee({
            studentId,
            feeId:
              fee.id,
            data: {
              amount:
                Number(values.amount),
              paidAmount:
                Number(
                  values.paidAmount
                ),
            },
          });
        onSaved(result);
        setEditing(false);
      } finally {
        setSaving(false);
      }
    };

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3 text-sm font-bold text-slate-800">{fee.feeTypeName}</td>
      <td className="px-4 py-3 text-sm font-bold text-slate-700">
        {
          editing ? (
            <input
              type="number"
              value={values.amount}
              onChange={(event) => setValues((current) => ({ ...current, amount: event.target.value }))}
              className="h-9 w-28 rounded-lg border border-slate-200 px-2 text-sm font-bold outline-none focus:border-blue-500"
            />
          ) : (
            formatCurrency(fee.amount)
          )
        }
      </td>
      <td className="px-4 py-3 text-sm font-bold text-emerald-600">
        {
          editing ? (
            <input
              type="number"
              value={values.paidAmount}
              onChange={(event) => setValues((current) => ({ ...current, paidAmount: event.target.value }))}
              className="h-9 w-28 rounded-lg border border-slate-200 px-2 text-sm font-bold outline-none focus:border-blue-500"
            />
          ) : (
            formatCurrency(fee.paidAmount)
          )
        }
      </td>
      <td className="px-4 py-3 text-sm font-bold text-red-500">{formatCurrency(fee.dueAmount)}</td>
      <td className="px-4 py-3">
        <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${statusClass[fee.status] || statusClass.pending}`}>
          {fee.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {
          editing ? (
            <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-300">
              {saving ? "Saving" : "Save"}
            </button>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              Edit
            </button>
          )
        }
      </td>
    </tr>
  );
}

export default function StudentDetailsPage() {
  const {
    studentId,
  } = useParams();
  const navigate =
    useNavigate();

  const [
    detail,
    setDetail,
  ] = useState(null);
  const [
    loading,
    setLoading,
  ] = useState(true);
  const [
    activeTab,
    setActiveTab,
  ] = useState("overview");
  const [
    showEdit,
    setShowEdit,
  ] = useState(false);
  const [
    showPayment,
    setShowPayment,
  ] = useState(false);
  const [
    reminderMessage,
    setReminderMessage,
  ] = useState("");

  useEffect(() => {
    const load =
      async () => {
        try {
          setLoading(true);
          const result =
            await getStudentDetail(
              studentId
            );
          setDetail(result);
        } finally {
          setLoading(false);
        }
      };

    load();
  }, [studentId]);

  const reminderDefault =
    useMemo(
      () =>
        detail
          ? `Dear Parent, pending fee for ${detail.student.fullName} is ${formatCurrency(detail.stats.pendingFees)}. Please submit it soon.`
          : "",
      [detail]
    );

  useEffect(() => {
    if (
      detail &&
      !reminderMessage
    ) {
      setReminderMessage(
        reminderDefault
      );
    }
  }, [
    detail,
    reminderDefault,
    reminderMessage,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500">
        Student not found.
      </div>
    );
  }

  const {
    student,
    stats,
    fees,
    payments,
  } = detail;

  const donutStyle = {
    background:
      `conic-gradient(#10b981 0 ${stats.paidPercent}%, #f97316 ${stats.paidPercent}% 100%)`,
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5 pb-24 lg:pb-0">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 hover:text-blue-600">
          <ArrowLeft size={17} />
          Students
        </button>
        <span>/</span>
        <span className="text-slate-900">{student.fullName}</span>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <StudentAvatar student={student} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-950">{student.fullName}</h1>
                <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                  {student.status || "active"}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Roll No. {student.rollNumber} - Admission No. {student.schoolRegisterNo}
              </p>
              <p className="mt-2 inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                {detail.class?.name || "Class"} ({detail.section?.name || "Section"})
              </p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <span className="inline-flex items-center gap-2 font-semibold text-slate-600">
                  <User size={16} /> {student.fatherName}
                </span>
                <span className="inline-flex items-center gap-2 font-semibold text-slate-600">
                  <Phone size={16} /> {student.phone}
                </span>
                <span className="inline-flex items-center gap-2 font-semibold text-slate-600">
                  <CalendarDays size={16} /> DOB {student.dob}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowEdit(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">
              <Edit3 size={17} />
              Edit Student
            </button>
            <button type="button" onClick={() => setShowPayment(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <CreditCard size={17} />
              Record Payment
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={WalletCards} title="Total Fee" value={formatCurrency(stats.totalFees)} note={`${stats.totalFeeItems} fee records`} />
        <StatCard icon={CheckCircle2} title="Paid Till Date" value={formatCurrency(stats.paidFees)} note={`${stats.paidPercent}% collected`} />
        <StatCard icon={Bell} title="Pending Balance" value={formatCurrency(stats.pendingFees)} note={`${stats.pendingItems} pending records`} />
        <StatCard icon={CalendarDays} title="Last Payment" value={stats.lastPayment ? formatDate(stats.lastPayment.paidAt) : "Not recorded"} note={stats.lastPayment ? formatCurrency(stats.lastPayment.amount) : "No dated payment yet"} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex overflow-x-auto border-b border-slate-200 px-2">
          {
            tabItems.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    inline-flex
                    min-w-max
                    items-center
                    gap-2
                    border-b-2
                    px-4
                    py-4
                    text-sm
                    font-bold
                    ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })
          }
        </div>

        {
          activeTab === "overview" && (
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr_300px]">
              <div>
                <h2 className="text-base font-extrabold text-slate-950">Student Information</h2>
                <div className="mt-3">
                  <InfoRow label="Date of Birth" value={student.dob} />
                  <InfoRow label="Gender" value={student.gender} />
                  <InfoRow label="Mobile" value={student.phone} />
                  <InfoRow label="Aadhar No." value={student.aadharNo} />
                  <InfoRow label="Aadhar Status" value={student.aadharVerificationStatus} />
                  <InfoRow label="Admission Date" value={student.admissionDate} />
                </div>
              </div>

              <div>
                <h2 className="text-base font-extrabold text-slate-950">Academic Information</h2>
                <div className="mt-3">
                  <InfoRow label="Class" value={detail.class?.name} />
                  <InfoRow label="Section" value={detail.section?.name} />
                  <InfoRow label="Register No." value={student.schoolRegisterNo} />
                  <InfoRow label="Roll No." value={student.rollNumber} />
                  <InfoRow label="Student Status" value={student.status} />
                  <InfoRow label="Payment Status" value={student.paymentStatus} />
                </div>
              </div>

              <div>
                <h2 className="text-base font-extrabold text-slate-950">Fee Analysis</h2>
                <div className="mt-4 flex flex-col items-center rounded-xl border border-slate-200 p-5">
                  <div className="relative h-40 w-40 rounded-full" style={donutStyle}>
                    <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white text-center">
                      <span className="text-lg font-extrabold text-slate-950">{formatCurrency(stats.pendingFees)}</span>
                      <span className="text-xs font-bold text-slate-500">Pending</span>
                    </div>
                  </div>
                  <div className="mt-4 w-full space-y-2 text-sm">
                    <p className="flex justify-between font-bold text-slate-700">
                      <span className="text-emerald-600">Paid</span>
                      <span>{stats.paidPercent}%</span>
                    </p>
                    <p className="flex justify-between font-bold text-slate-700">
                      <span className="text-orange-500">Pending</span>
                      <span>{stats.pendingPercent}%</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {
          activeTab === "fees" && (
            <div className="p-5">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Fee</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Balance</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      fees.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                            No fee records found for this student.
                          </td>
                        </tr>
                      ) : (
                        fees.map((fee) => (
                          <FeeEditRow key={fee.id} fee={fee} studentId={student.id} onSaved={setDetail} />
                        ))
                      )
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )
        }

        {
          activeTab === "payments" && (
            <div className="p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h2 className="text-base font-extrabold text-slate-950">Submitted Fee Records</h2>
                  <div className="mt-4 space-y-3">
                    {
                      payments.length === 0 ? (
                        <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                          No dated payment records yet. Record a payment to start date-wise history.
                        </p>
                      ) : (
                        payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3">
                            <div>
                              <p className="text-sm font-extrabold text-slate-900">{payment.feeTypeName}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(payment.paidAt)}</p>
                            </div>
                            <p className="text-sm font-extrabold text-emerald-600">{formatCurrency(payment.amount)}</p>
                          </div>
                        ))
                      )
                    }
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <h2 className="text-base font-extrabold text-slate-950">Remaining Fee Records</h2>
                  <div className="mt-4 space-y-3">
                    {
                      fees.filter((fee) => Number(fee.dueAmount || 0) > 0).length === 0 ? (
                        <p className="rounded-xl bg-emerald-50 px-4 py-5 text-sm font-semibold text-emerald-700">
                          No remaining fee balance.
                        </p>
                      ) : (
                        fees
                          .filter((fee) => Number(fee.dueAmount || 0) > 0)
                          .map((fee) => (
                            <div key={fee.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3">
                              <div>
                                <p className="text-sm font-extrabold text-slate-900">{fee.feeTypeName}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">Paid {formatCurrency(fee.paidAmount)} of {formatCurrency(fee.amount)}</p>
                              </div>
                              <p className="text-sm font-extrabold text-red-500">{formatCurrency(fee.dueAmount)}</p>
                            </div>
                          ))
                      )
                    }
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {
          activeTab === "reminders" && (
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
              <div>
                <h2 className="text-base font-extrabold text-slate-950">Reminder Draft</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  WhatsApp/SMS sending can be connected later. This draft uses the real student number and pending amount.
                </p>
                <textarea
                  value={reminderMessage}
                  onChange={(event) => setReminderMessage(event.target.value)}
                  rows={7}
                  className="mt-4 w-full rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
                <button
                  type="button"
                  disabled
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500"
                >
                  <MessageCircle size={17} />
                  Send later
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Receiver</p>
                <p className="mt-2 text-lg font-extrabold text-slate-950">{student.phone}</p>
                <p className="mt-4 text-xs font-bold uppercase text-slate-500">Pending Balance</p>
                <p className="mt-2 text-2xl font-extrabold text-red-500">{formatCurrency(stats.pendingFees)}</p>
              </div>
            </div>
          )
        }
      </div>

      {
        showEdit && (
          <EditStudentModal
            detail={detail}
            onClose={() => setShowEdit(false)}
            onSaved={setDetail}
          />
        )
      }

      {
        showPayment && (
          <PaymentModal
            detail={detail}
            onClose={() => setShowPayment(false)}
            onSaved={setDetail}
          />
        )
      }
    </div>
  );
}
