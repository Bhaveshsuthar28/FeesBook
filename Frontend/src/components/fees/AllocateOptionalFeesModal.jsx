import {
  CheckCircle2,
  LoaderCircle,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  allocateClassFees,
  getFeeStructure,
} from "../../lib/api/feesapi.js";

import {
  notify,
} from "../../lib/toast.js";

const formatCurrency =
  (amount) =>
    `Rs ${Number(amount || 0).toLocaleString("en-IN")}`;

export default function AllocateOptionalFeesModal({
  classId,
  sectionId,
  studentIds,
  assignedFeeTypeIds = [],
  title = "Add Optional Fees",
  description,
  onClose,
  onSuccess,
}) {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    allocating,
    setAllocating,
  ] = useState(false);

  const [
    optionalFees,
    setOptionalFees,
  ] = useState([]);

  const [
    selectedFeeTypeIds,
    setSelectedFeeTypeIds,
  ] = useState([]);

  const assignedSet =
    useMemo(
      () =>
        new Set(
          assignedFeeTypeIds
        ),
      [assignedFeeTypeIds]
    );

  useEffect(() => {
    const load =
      async () => {
        try {
          setLoading(true);
          const structure =
            await getFeeStructure({ classId });
          const classItem =
            structure.classes.find(
              (item) =>
                item.id === classId
            );
          const available =
            (classItem?.fees || [])
              .filter(
                (fee) =>
                  fee.isOptional &&
                  !fee.isArchived &&
                  !assignedSet.has(
                    fee.feeTypeId
                  )
              );

          setOptionalFees(
            available
          );
        } catch (error) {
          notify.error(
            error,
            "Could not load optional fees"
          );
        } finally {
          setLoading(false);
        }
      };

    load();
  }, [
    classId,
    assignedSet,
  ]);

  const toggleFee =
    (feeTypeId) => {
      setSelectedFeeTypeIds(
        (current) =>
          current.includes(
            feeTypeId
          )
            ? current.filter(
                (item) =>
                  item !==
                  feeTypeId
              )
            : [
                ...current,
                feeTypeId,
              ]
      );
    };

  const handleAllocate =
    async () => {
      if (
        selectedFeeTypeIds.length ===
        0
      ) {
        notify.error(
          null,
          "Select at least one optional fee"
        );
        return;
      }

      try {
        setAllocating(true);
        const payload = {
          classId,
          feeTypeIds:
            selectedFeeTypeIds,
        };

        if (
          studentIds?.length
        ) {
          payload.studentIds =
            studentIds;
        }

        if (sectionId) {
          payload.sectionId =
            sectionId;
        }

        const result =
          await allocateClassFees(
            payload
          );

        notify.success(
          `Allocated ${result.created} fee rows. Skipped ${result.skipped}.`
        );
        await onSuccess?.();
        onClose();
      } catch (error) {
        notify.error(
          error,
          "Optional fees could not be assigned"
        );
      } finally {
        setAllocating(false);
      }
    };

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-slate-900/50
        p-4
      "
    >
      <div
        className="
          w-full
          max-w-lg
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-2xl
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
              {title}
            </h2>
            {
              description && (
                <p
                  className="
                    mt-1
                    text-sm
                    font-medium
                    text-slate-500
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
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="
            max-h-[60vh]
            overflow-y-auto
            px-5
            py-4
          "
        >
          {
            loading ? (
              <div
                className="
                  flex
                  justify-center
                  py-10
                "
              >
                <LoaderCircle
                  size={28}
                  className="
                    animate-spin
                    text-blue-600
                  "
                />
              </div>
            ) : optionalFees.length === 0 ? (
              <p
                className="
                  rounded-xl
                  bg-slate-50
                  px-4
                  py-6
                  text-center
                  text-sm
                  font-semibold
                  text-slate-500
                "
              >
                No optional fees available to assign. Configure optional fees for this class in Settings first.
              </p>
            ) : (
              <div
                className="
                  space-y-2
                "
              >
                {
                  optionalFees.map(
                    (fee) => {
                      const checked =
                        selectedFeeTypeIds.includes(
                          fee.feeTypeId
                        );

                      return (
                        <label
                          key={
                            fee.feeTypeId
                          }
                          className={`
                            flex
                            cursor-pointer
                            items-center
                            justify-between
                            gap-3
                            rounded-xl
                            border
                            px-4
                            py-3
                            ${
                              checked
                                ? "border-indigo-200 bg-indigo-50"
                                : "border-slate-200 hover:bg-slate-50"
                            }
                          `}
                        >
                          <div
                            className="
                              flex
                              items-center
                              gap-3
                            "
                          >
                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleFee(
                                  fee.feeTypeId
                                )
                              }
                              className="
                                h-4
                                w-4
                                rounded
                                border-slate-300
                              "
                            />
                            <div>
                              <p
                                className="
                                  text-sm
                                  font-extrabold
                                  text-slate-900
                                "
                              >
                                {
                                  fee.name
                                }
                              </p>
                              <p
                                className="
                                  mt-0.5
                                  text-xs
                                  font-semibold
                                  text-slate-500
                                "
                              >
                                {
                                  fee.frequency
                                }
                              </p>
                            </div>
                          </div>
                          <span
                            className="
                              text-sm
                              font-extrabold
                              text-slate-800
                            "
                          >
                            {
                              formatCurrency(
                                fee.amount
                              )
                            }
                          </span>
                        </label>
                      );
                    }
                  )
                }
              </div>
            )
          }
        </div>

        <div
          className="
            flex
            gap-2
            border-t
            border-slate-100
            px-5
            py-4
          "
        >
          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-11
              flex-1
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              text-sm
              font-extrabold
              text-slate-700
              hover:bg-slate-50
            "
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={
              allocating ||
              loading ||
              optionalFees.length ===
                0
            }
            onClick={
              handleAllocate
            }
            className="
              flex
              h-11
              flex-1
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-indigo-600
              text-sm
              font-extrabold
              text-white
              disabled:opacity-60
            "
          >
            {
              allocating ? (
                <LoaderCircle
                  size={18}
                  className="
                    animate-spin
                  "
                />
              ) : (
                <CheckCircle2
                  size={18}
                />
              )
            }
            Assign Fees
          </button>
        </div>
      </div>
    </div>
  );
}
