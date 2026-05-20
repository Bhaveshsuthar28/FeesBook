import {
  LoaderCircle,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  downloadStudentPaymentReceipt,
  getStudentDetail,
  recordStudentPayment,
} from "../../lib/api/studentapi.js";

import {
  notify,
} from "../../lib/toast.js";

export const defaultPaymentModes = [
  "Cash",
  "UPI",
  "Card",
  "Bank Transfer",
  "Cheque",
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

const mapDetailFeesToDueFees =
  (detail) =>
    (detail?.fees || [])
      .filter(
        (fee) =>
          Number(
            fee.dueAmount || 0
          ) > 0
      )
      .map((fee) => ({
        id: fee.id,
        dueAmount:
          fee.dueAmount,
        feeTypeName:
          fee.feeTypeName ||
          fee.name ||
          "Fee",
      }));

export default function RecordPaymentModal({
  open,
  onClose,
  student,
  studentId:
    studentIdProp,
  detail,
  onSaved,
  onReceiptReady,
  paymentModes =
    defaultPaymentModes,
  showPaidAt = false,
}) {
  const resolvedStudentId =
    student?.id ||
    studentIdProp ||
    detail?.student?.id ||
    "";

  const [
    loadingDetail,
    setLoadingDetail,
  ] = useState(false);
  const [
    fetchedDetail,
    setFetchedDetail,
  ] = useState(null);
  const [
    studentFeeId,
    setStudentFeeId,
  ] = useState("");
  const [
    amount,
    setAmount,
  ] = useState("");
  const [
    paymentMode,
    setPaymentMode,
  ] = useState(
    paymentModes[0] ||
      "Cash"
  );
  const [
    paidAt,
    setPaidAt,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10)
  );
  const [
    remark,
    setRemark,
  ] = useState("");
  const [
    transactionRef,
    setTransactionRef,
  ] = useState("");
  const [
    saving,
    setSaving,
  ] = useState(false);

  const dueFees =
    useMemo(() => {
      if (
        student?.dueFees
          ?.length
      ) {
        return student.dueFees;
      }

      if (detail) {
        return mapDetailFeesToDueFees(
          detail
        );
      }

      if (fetchedDetail) {
        return mapDetailFeesToDueFees(
          fetchedDetail
        );
      }

      return [];
    }, [
      student,
      detail,
      fetchedDetail,
    ]);

  const displayName =
    student?.fullName ||
    [
      detail?.student?.firstName,
      detail?.student?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    [
      fetchedDetail?.student
        ?.firstName,
      fetchedDetail?.student
        ?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Student";

  const registeredPhone =
    student?.phone ??
    detail?.student?.phone ??
    fetchedDetail?.student
      ?.phone ??
    "";

  const registeredPhoneDigits =
    String(
      registeredPhone || ""
    ).replace(
      /\D/g,
      ""
    );

  const totalDue =
    student?.dueAmount ??
    dueFees.reduce(
      (sum, fee) =>
        sum +
        Number(
          fee.dueAmount || 0
        ),
      0
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (
      student?.dueFees
        ?.length
    ) {
      setFetchedDetail(null);
      return;
    }

    if (detail) {
      setFetchedDetail(null);
      return;
    }

    if (!resolvedStudentId) {
      return;
    }

    let cancelled = false;

    const load =
      async () => {
        try {
          setLoadingDetail(
            true
          );
          const result =
            await getStudentDetail(
              resolvedStudentId
            );
          if (!cancelled) {
            setFetchedDetail(
              result
            );
          }
        } catch (loadError) {
          if (!cancelled) {
            notify.error(
              loadError,
              "Student fees could not be loaded"
            );
          }
        } finally {
          if (!cancelled) {
            setLoadingDetail(
              false
            );
          }
        }
      };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    resolvedStudentId,
    student,
    detail,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const firstFee =
      dueFees[0];
    setStudentFeeId(
      firstFee?.id || ""
    );
    setAmount(
      firstFee?.dueAmount ??
        ""
    );
    setPaymentMode(
      paymentModes[0] ||
        "Cash"
    );
    setPaidAt(
      new Date()
        .toISOString()
        .slice(0, 10)
    );
    setRemark("");
    setTransactionRef("");
  }, [
    open,
    dueFees,
    paymentModes,
  ]);

  if (!open) {
    return null;
  }

  const selectedFee =
    dueFees.find(
      (fee) =>
        fee.id === studentFeeId
    );

  const downloadReceipt =
    async ({
      paymentId,
    }) => {
      if (onReceiptReady) {
        await onReceiptReady({
          studentId:
            resolvedStudentId,
          paymentId,
        });
        return;
      }

      const response =
        await downloadStudentPaymentReceipt(
          {
            studentId:
              resolvedStudentId,
            paymentId,
          }
        );
      const url =
        URL.createObjectURL(
          response.blob
        );
      const link =
        document.createElement(
          "a"
        );
      link.href = url;
      link.download =
        response.fileName;
      document.body.appendChild(
        link
      );
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

  const changeAmountDigits =
    (
      raw,
      maxDue
    ) => {
      const digits =
        String(
          raw || ""
        ).replace(
          /\D/g,
          ""
        );

      if (
        digits === ""
      ) {
        setAmount("");
        return;
      }

      let n =
        Number.parseInt(
          digits,
          10
        );

      if (
        !Number.isFinite(
          n
        )
      ) {
        setAmount("");
        return;
      }

      const cap =
        Number(
          maxDue || 0
        );

      if (
        n > cap
      ) {
        n = cap;
      }

      setAmount(
        String(n)
      );
    };

  const savePayment =
    async () => {
      const dueCap =
        Number(
          selectedFee?.dueAmount ||
            0
        );

      const paid =
        Number.parseInt(
          String(
            amount ||
              ""
          ).replace(
            /\D/g,
            ""
          ),
          10
        );

      if (
        !studentFeeId ||
        !Number.isFinite(
          paid
        ) ||
        paid < 1
      ) {
        notify.error(
          null,
          "Select a fee and enter a valid amount (whole rupees)"
        );
        return;
      }

      if (
        paid >
        dueCap
      ) {
        notify.error(
          null,
          `Amount cannot exceed due ${formatCurrency(dueCap)}`
        );
        return;
      }

      try {
        setSaving(true);

        const payload = {
          studentFeeId,
          amount: paid,
          paymentMode,
          paidAt:
            showPaidAt
              ? new Date(
                  paidAt
                ).getTime()
              : Date.now(),
        };

        if (remark.trim()) {
          payload.remark = remark.trim();
        }

        const refTrim =
          transactionRef
            .trim()
            .slice(
              0,
              50
            );

        if (refTrim) {
          payload.transactionRef =
            refTrim;
        }

        const result =
          await recordStudentPayment(
            {
              studentId:
                resolvedStudentId,
              data: payload,
            }
          );

        if (
          result.receipt
            ?.paymentId
        ) {
          try {
            await downloadReceipt(
              {
                paymentId:
                  result.receipt
                    .paymentId,
              }
            );
          } catch (downloadError) {
            notify.warning(
              "Payment saved. Receipt could not be downloaded."
            );
          }
        }

        notify.success(
          "Payment recorded successfully"
        );
        await onSaved?.(result);
        onClose();
      } catch (apiError) {
        notify.error(
          apiError,
          "Payment could not be recorded"
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4"
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
        aria-labelledby="record-payment-title"
        className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase text-indigo-600">
              Record Payment
            </p>
            <h2
              id="record-payment-title"
              className="mt-1 text-xl font-extrabold text-slate-950"
            >
              {displayName}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Due {formatCurrency(totalDue)}
            </p>
            {
              registeredPhoneDigits.length >
                0 && (
                <p
                  className={`
                    mt-2
                    text-xs
                    font-semibold
                    ${
                      registeredPhoneDigits.length ===
                      10
                        ? "text-slate-600"
                        : "text-amber-700"
                    }
                  `}
                >
                  Mobile on file:{" "}
                  {registeredPhoneDigits}
                  {registeredPhoneDigits.length !==
                    10 && (
                    <span
                      className="
                        ml-1
                        font-bold
                      "
                    >
                      (use 10 digits in student profile)
                    </span>
                  )}
                </p>
              )
            }
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
          loadingDetail ? (
            <div className="mt-8 flex justify-center py-6">
              <LoaderCircle
                size={28}
                className="animate-spin text-indigo-600"
              />
            </div>
          ) : dueFees.length === 0 ? (
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
                      dueFees.find(
                        (fee) =>
                          fee.id ===
                          event.target.value
                      );
                    setStudentFeeId(
                      event.target.value
                    );
                    setAmount(
                      nextFee?.dueAmount ??
                        ""
                    );
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
                >
                  {
                    dueFees.map(
                      (fee) => (
                        <option
                          key={fee.id}
                          value={fee.id}
                        >
                          {fee.feeTypeName
                            ? `${fee.feeTypeName} — `
                            : ""}
                          Due{" "}
                          {formatCurrency(
                            fee.dueAmount
                          )}
                        </option>
                      )
                    )
                  }
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-extrabold text-slate-600">
                  Amount
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={12}
                  value={amount}
                  onChange={(event) =>
                    changeAmountDigits(
                      event.target
                        .value,
                      selectedFee?.dueAmount
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
                />
                <p
                  className="
                    text-[11px]
                    font-medium
                    text-slate-500
                  "
                >
                  Whole rupees only, max due for this fee.
                </p>
                {selectedFee &&
                  Number(amount) > 0 &&
                  Number(amount) <
                    Number(
                      selectedFee.dueAmount || 0
                    ) && (
                    <p className="text-xs font-semibold text-orange-600">
                      Partial payment — a partial fee receipt PDF will be generated with the remaining balance.
                    </p>
                  )}
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
                    paymentModes.map(
                      (mode) => (
                        <option
                          key={mode}
                          value={mode}
                        >
                          {mode}
                        </option>
                      )
                    )
                  }
                </select>
              </label>

              {
                showPaidAt && (
                  <label className="space-y-2">
                    <span className="text-xs font-extrabold text-slate-600">
                      Payment date
                    </span>
                    <input
                      type="date"
                      value={paidAt}
                      onChange={(event) =>
                        setPaidAt(
                          event.target.value
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 outline-none"
                    />
                  </label>
                )
              }

              <label className="space-y-2">
                <span className="text-xs font-extrabold text-slate-600">
                  Transaction reference
                </span>
                <input
                  type="text"
                  inputMode="text"
                  maxLength={50}
                  value={transactionRef}
                  onChange={(event) =>
                    setTransactionRef(
                      event.target
                        .value
                        .slice(
                          0,
                          50
                        )
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none"
                  placeholder="UPI ref, cheque no., etc. (optional)"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-extrabold text-slate-600">
                  Remark (on PDF)
                </span>
                <textarea
                  value={remark}
                  onChange={(event) =>
                    setRemark(
                      event.target.value
                    )
                  }
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                  placeholder="Optional note printed on receipt"
                />
              </label>
            </div>
          )
        }

        <button
          type="button"
          disabled={
            saving ||
            loadingDetail ||
            dueFees.length === 0
          }
          onClick={savePayment}
          className="mt-5 h-11 w-full rounded-xl bg-indigo-600 text-sm font-extrabold text-white disabled:opacity-60"
        >
          {
            saving
              ? "Saving..."
              : "Save Payment"
          }
        </button>
      </div>
    </div>
  );
}
