import {
  FileText,
  LoaderCircle,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import {
  downloadReceiptBlob,
  downloadStudentFeeConcessionReceipt,
  downloadStudentPaymentReceipt,
} from "../../lib/api/studentapi.js";

import {
  notify,
} from "../../lib/toast.js";

const formatCurrency =
  (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate =
  (value) => {
    if (!value) {
      return "-";
    }

    return new Date(Number(value))
      .toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
  };

export default function StudentReceiptsModal({
  open,
  onClose,
  student,
}) {
  const [
    downloadingId,
    setDownloadingId,
  ] = useState("");

  if (!open || !student) {
    return null;
  }

  const payments =
    student.payments || [];
  const concession =
    student.concession;

  const downloadPayment =
    async (paymentId) => {
      setDownloadingId(paymentId);

      try {
        const file =
          await downloadStudentPaymentReceipt({
            studentId: student.id,
            paymentId,
          });
        downloadReceiptBlob(file);
      } catch (error) {
        notify.error(
          error,
          "Payment receipt could not be downloaded"
        );
      } finally {
        setDownloadingId("");
      }
    };

  const downloadConcession =
    async () => {
      if (!concession?.id) {
        return;
      }

      const key = `concession-${concession.id}`;
      setDownloadingId(key);

      try {
        const file =
          await downloadStudentFeeConcessionReceipt({
            studentId: student.id,
            concessionId: concession.id,
          });
        downloadReceiptBlob(file);
      } catch (error) {
        notify.error(
          error,
          "Concession receipt could not be downloaded"
        );
      } finally {
        setDownloadingId("");
      }
    };

  const handleBackdropClick =
    (event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) =>
          event.stopPropagation()
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="fee-receipts-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="fee-receipts-title"
              className="text-lg font-extrabold text-slate-950"
            >
              Fee receipts
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {student.fullName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {concession && (
          <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-extrabold uppercase text-amber-800">
              Fee concession ({concession.academicYear})
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {concession.concessionType} — {formatCurrency(concession.concessionAmount)} off
            </p>
            {concession.remark && (
              <p className="mt-1 text-xs font-semibold text-slate-600">
                {concession.remark}
              </p>
            )}
            <button
              type="button"
              onClick={downloadConcession}
              disabled={Boolean(downloadingId)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-extrabold text-white"
            >
              {downloadingId === `concession-${concession.id}` ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <FileText size={14} />
              )}
              Concession PDF
            </button>
          </section>
        )}

        <section>
          <p className="text-xs font-extrabold uppercase text-slate-500">
            Payment receipts ({payments.length})
          </p>
          <ReceiptList
            payments={payments}
            downloadingId={downloadingId}
            onDownload={downloadPayment}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </section>
      </div>
    </div>
  );

  return createPortal(
    modal,
    document.body
  );
}

function ReceiptList({
  payments,
  downloadingId,
  onDownload,
  formatCurrency,
  formatDate,
}) {
  if (payments.length === 0) {
    return (
      <p className="mt-3 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
        No payment receipts yet.
      </p>
    );
  }

  return (
    <ul className="mt-3 space-y-2">
      {payments.map((payment) => (
        <li
          key={payment.id}
          className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-slate-900">
              {payment.feeTypeName}
              {payment.isPartial && (
                <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-extrabold text-orange-700">
                  Partial
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {formatDate(payment.paidAt)} · {payment.paymentMode}
              {payment.receiptNo && ` · ${payment.receiptNo}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-extrabold text-emerald-600">
              {formatCurrency(payment.amount)}
            </span>
            <button
              type="button"
              onClick={() => onDownload(payment.id)}
              disabled={Boolean(downloadingId)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
              title="Download PDF"
            >
              {downloadingId === payment.id ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <FileText size={16} />
              )}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
