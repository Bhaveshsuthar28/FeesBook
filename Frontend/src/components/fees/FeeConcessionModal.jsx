import {
  LoaderCircle,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  downloadReceiptBlob,
  downloadStudentFeeConcessionReceipt,
  getStudentDetail,
  saveStudentFeeConcession,
} from "../../lib/api/studentapi.js";

import {
  notify,
} from "../../lib/toast.js";

const concessionTypes = [
  { value: "scholarship", label: "Scholarship" },
  { value: "sibling", label: "Sibling discount" },
  { value: "staff_child", label: "Staff child" },
  { value: "merit", label: "Merit" },
  { value: "financial_aid", label: "Financial aid" },
  { value: "other", label: "Other" },
];

export default function FeeConcessionModal({
  open,
  onClose,
  student,
  detail,
  onSaved,
}) {
  const studentId =
    student?.id ||
    detail?.student?.id ||
    "";
  const [
    fetchedDetail,
    setFetchedDetail,
  ] = useState(null);
  const [
    loadingDetail,
    setLoadingDetail,
  ] = useState(false);

  const resolvedDetail =
    detail || fetchedDetail;
  const academicYear =
    resolvedDetail?.activeAcademicYear ||
    "";
  const existing =
    resolvedDetail?.concession;

  useEffect(() => {
    if (
      !open ||
      !studentId ||
      detail
    ) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoadingDetail(true);

      try {
        const data =
          await getStudentDetail(
            studentId
          );

        if (!cancelled) {
          setFetchedDetail(data);
        }
      } catch {
        if (!cancelled) {
          setFetchedDetail(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    studentId,
    detail,
  ]);

  const [concessionType, setConcessionType] =
    useState("scholarship");
  const [basis, setBasis] =
    useState("percentage");
  const [basisValue, setBasisValue] =
    useState("10");
  const [remark, setRemark] =
    useState("");
  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (existing) {
      setConcessionType(
        existing.concessionType ||
          "scholarship"
      );
      setBasis(
        existing.basis || "percentage"
      );
      setBasisValue(
        String(existing.basisValue || 10)
      );
      setRemark(existing.remark || "");
      return;
    }

    setConcessionType("scholarship");
    setBasis("percentage");
    setBasisValue("10");
    setRemark("");
  }, [open, existing]);

  if (!open) {
    return null;
  }

  if (loadingDetail && !resolvedDetail) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4">
        <div className="rounded-2xl bg-white p-8">
          <LoaderCircle
            size={32}
            className="animate-spin text-indigo-600"
          />
        </div>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!studentId) {
      return;
    }

    const val = Number(basisValue);
    if (isNaN(val) || val <= 0) {
      notify.error(null, "Please enter a valid concession value");
      return;
    }

    if (basis === "percentage") {
      if (val > 100) {
        notify.warning("Concession percentage cannot exceed 100%");
        return;
      }
    }

    const fees = resolvedDetail?.fees || [];
    const grossTotal = fees.reduce((sum, f) => sum + Number(f.grossAmount ?? f.amount ?? 0), 0);
    const paidTotal = fees.reduce((sum, f) => sum + Number(f.paidAmount || 0), 0);
    const maxConcession = grossTotal - paidTotal;

    let calculatedConcession = 0;
    if (basis === "percentage") {
      calculatedConcession = Math.round((grossTotal * val) / 100);
    } else {
      calculatedConcession = val;
    }

    if (calculatedConcession > maxConcession) {
      notify.warning(
        `Concession amount (Rs ${calculatedConcession}) cannot exceed the remaining fee balance (Rs ${maxConcession})`
      );
      return;
    }

    setSaving(true);

    try {
      const result =
        await saveStudentFeeConcession({
          studentId,
          data: {
            academicYear,
            concessionType,
            basis,
            basisValue: val,
            remark,
          },
        });

      if (result?.receipt?.concessionId) {
        const file =
          await downloadStudentFeeConcessionReceipt({
            studentId,
            concessionId:
              result.receipt.concessionId,
          });
        downloadReceiptBlob(file);
      }

      notify.success(
        existing
          ? "Fee concession updated"
          : "Fee concession applied"
      );
      onSaved?.(result);
      onClose();
    } catch (error) {
      notify.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MotionlessModal>
      <MotionlessModalInner
        onClose={onClose}
        title="Fee Concession"
        subtitle={
          academicYear
            ? `Academic year ${academicYear}`
            : "Active academic year only"
        }
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-500">
              Concession type
            </span>
            <select
              value={concessionType}
              onChange={(event) =>
                setConcessionType(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
            >
              {concessionTypes.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3">
            <label className="block flex-1 space-y-1">
              <span className="text-xs font-bold text-slate-500">
                Basis
              </span>
              <select
                value={basis}
                onChange={(event) =>
                  setBasis(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              >
                <option value="percentage">
                  Percentage (%)
                </option>
                <option value="fixed">
                  Fixed amount (₹)
                </option>
              </select>
            </label>
            <label className="block flex-1 space-y-1">
              <span className="text-xs font-bold text-slate-500">
                Value
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={basisValue}
                onChange={(event) =>
                  setBasisValue(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-500">
              Remark (on PDF)
            </span>
            <textarea
              value={remark}
              onChange={(event) =>
                setRemark(event.target.value)
              }
              rows={3}
              placeholder="Scholarship details..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold"
            />
          </label>

          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            PDF receipt includes remark: Fee Concession. Net fees update for this academic year.
          </p>

          <MotionlessModalActions
            onClose={onClose}
            saving={saving}
            existing={existing}
          />
        </form>
      </MotionlessModalInner>
    </MotionlessModal>
  );
}

function MotionlessModal({ children }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4">
      {children}
    </div>
  );
}

function MotionlessModalInner({
  onClose,
  title,
  subtitle,
  children,
}) {
  return (
    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  );
}

function MotionlessModalActions({
  onClose,
  saving,
  existing,
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-slate-700"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-extrabold text-white disabled:opacity-60"
      >
        {saving && (
          <LoaderCircle
            size={16}
            className="animate-spin"
          />
        )}
        {existing
          ? "Update concession"
          : "Apply concession"}
      </button>
    </div>
  );
}
