// src/pages/classes/components/addClassModal.jsx

import {
  X,
  Check,
  LoaderCircle,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  createClass,
} from "../../lib/api/classapi.js";

const CLASS_OPTIONS = [
  "LKG",
  "UKG",

  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",

  "11th-AT",
  "11th-SM",
  "11th-SB",
  "11th-CM",
  "11th-CE",
  "11th-AG",

  "12th-AT",
  "12th-SM",
  "12th-SB",
  "12th-CM",
  "12th-CE",
  "12th-AG",
];

export default function AddClassModal({
  setShowAddModal,
  dashboardData,
  setDashboardData,
}) {

  const [
    selectedClass,

    setSelectedClass,
  ] = useState("");

  const [
    loading,

    setLoading,
  ] = useState(false);

  const handleSubmit =
    async () => {

      if (!selectedClass) {
        return;
      }

      try {

        setLoading(
          true
        );

        const newClass =
          await createClass({

            name:
              selectedClass,

            sequence:
              dashboardData
                .classes
                .length + 1,

            academicYear:
              "2025-2026",
          });

        setDashboardData(
          (prev) => ({

            ...prev,

            stats: {

              ...prev.stats,

              totalClasses:
                prev.stats
                  .totalClasses + 1,
            },

            classes: [

              ...prev.classes,

              {
                ...newClass,

                studentsCount: 0,

                sectionsCount: 0,

                pendingFees: 0,

                collectedFees: 0,
              },
            ],
          })
        );

        setShowAddModal(
          false
        );

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(
          false
        );
      }
    };

  return (
    <div
      className="
        fixed
        inset-0
        z-50

        flex
        items-end
        justify-center

        bg-black/40

        p-0

        sm:items-center
        sm:p-4
      "
    >

      <div
        className="
          w-full
          max-w-lg

          rounded-t-3xl
          sm:rounded-3xl

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
            border-slate-200

            px-5
            py-5
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
              Add Class
            </h2>

            <p
              className="
                mt-1

                text-sm
                text-slate-500
              "
            >
              Select class to create
            </p>

          </div>

          <button

            disabled={loading}

            onClick={() =>
              setShowAddModal(
                false
              )
            }

            className="
              rounded-xl

              p-2

              hover:bg-slate-100
            "
          >

            <X
              size={22}
            />

          </button>

        </div>

        <div
          className="
            max-h-[65vh]

            overflow-y-auto

            px-5
            py-5
          "
        >

          <div
            className="
              grid
              grid-cols-2

              gap-3

              sm:grid-cols-3

              lg:grid-cols-4
            "
          >

            {
              CLASS_OPTIONS.map(
                (item) => {

                  const selected =
                    selectedClass ===
                    item;

                  return (

                    <button
                      key={item}

                      disabled={loading}

                      onClick={() =>
                        setSelectedClass(
                          item
                        )
                      }

                      className={`
                        relative

                        rounded-2xl

                        border

                        px-3
                        py-4

                        text-sm
                        font-semibold

                        transition-all
                        duration-200

                        ${
                          selected
                            ? `
                              border-blue-600
                              bg-blue-50
                              text-blue-700
                            `
                            : `
                              border-slate-200
                              bg-white
                              text-slate-700

                              hover:border-blue-200
                              hover:bg-slate-50
                            `
                        }
                      `}
                    >

                      {
                        selected && (

                          <div
                            className="
                              absolute
                              right-2
                              top-2

                              flex
                              h-5
                              w-5

                              items-center
                              justify-center

                              rounded-full

                              bg-blue-600

                              text-white
                            "
                          >

                            <Check
                              size={12}
                            />

                          </div>
                        )
                      }

                      {item}

                    </button>
                  );
                }
              )
            }

          </div>

        </div>

        <div
          className="
            flex
            items-center
            justify-end

            gap-3

            border-t
            border-slate-200

            px-5
            py-5
          "
        >

          <button

            disabled={loading}

            onClick={() =>
              setShowAddModal(
                false
              )
            }

            className="
              flex-1

              rounded-xl

              border
              border-slate-200

              py-3

              text-sm
              font-medium

              text-slate-700
            "
          >
            Cancel
          </button>

          <button

            onClick={
              handleSubmit
            }

            disabled={
              !selectedClass ||
              loading
            }

            className={`
              flex-1

              flex
              items-center
              justify-center

              gap-2

              rounded-xl

              py-3

              text-sm
              font-semibold
              text-white

              transition-all
              duration-200

              ${
                selectedClass
                  ? `
                    bg-orange-500
                    hover:bg-orange-600
                  `
                  : `
                    cursor-not-allowed
                    bg-slate-300
                  `
              }
            `}
          >

            {
              loading ? (

                <LoaderCircle
                  size={18}

                  className="
                    animate-spin
                  "
                />

              ) : (
                "Create Class"
              )
            }

          </button>

        </div>

      </div>

    </div>
  );
}