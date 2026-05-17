// src/pages/classes/classes.page.jsx

import {
  useEffect,
  useState,
} from "react";

import {
  Plus
} from "lucide-react";

import {
  getClassesDashboard,
} from "../lib/api/classapi.js";

import ClassStats
  from "../components/class/classStats.jsx";

import ClassTable
  from "../components/class/classTable.jsx";

import ClassCard
  from "../components/class/classCard.jsx";

import AddClassModal
  from "../components/class/addClassModel.jsx";

export default function ClassesPage() {

  const [
    dashboardData,

    setDashboardData,
  ] = useState(null);

  const [
    loading,

    setLoading,
  ] = useState(true);

  const [
    showAddModal,

    setShowAddModal,
  ] = useState(false);

  useEffect(() => {

    const fetchData =
      async () => {

        try {

          const data =
            await getClassesDashboard();

          setDashboardData(
            data
          );

        } catch (error) {

          console.log(error);

        } finally {

          setLoading(false);
        }
      };

    fetchData();

  }, []);

  if (
      loading ||
      !dashboardData
    ) {

      return (
        <div
          className="
            flex
            min-h-screen
            items-center
            justify-center
          "
        >
          Loading...
        </div>
      );
    }

  return (
    <div
      className="
        space-y-6
      "
    >

      <div
        className="
          flex
          items-start
          justify-between
        "
      >

        <div>

          <h1
            className="
              text-2xl
              font-bold

              text-slate-900
            "
          >
            Classes
          </h1>

          <p
            className="
              mt-1

              text-sm
              text-slate-500
            "
          >
            Manage classes and students
          </p>

        </div>

        <div
          className="
            flex
            items-center

            gap-3
          "
        >

          <button

            onClick={() =>
              setShowAddModal(
                true
              )
            }

            className="
              hidden
              lg:flex

              items-center

              gap-2

              rounded-xl

              bg-orange-500

              px-4
              py-3

              text-sm
              font-medium
              text-white
            "
          >

            <Plus
              size={18}
            />

            Add Class

          </button>

        </div>

      </div>

      <ClassStats
        stats={
          dashboardData.stats
        }
      />

      <div
        className="
          hidden
          lg:block
        "
      >

        <ClassTable
          classes={
            dashboardData.classes
          }

          setDashboardData={
            setDashboardData
          }
        />

      </div>

      <div
        className="
          space-y-3

          lg:hidden
        "
      >

        {
          dashboardData.classes.map(
            (
              singleClass,
              index
            ) => (

              <ClassCard
                key={singleClass.id}

                singleClass={singleClass}

                index={index}

                setDashboardData={
                  setDashboardData
                }
              />
            )
          )
        }

      </div>

      <button

        onClick={() =>
          setShowAddModal(
            true
          )
        }

        className="
          fixed
          bottom-24
          right-5
          z-40

          flex
          h-14
          w-14

          items-center
          justify-center

          rounded-full

          bg-blue-600

          text-white

          shadow-xl

          lg:hidden
        "
      >

        <Plus
          size={26}
        />

      </button>

      {
        showAddModal && (

          <AddClassModal
            setShowAddModal={
              setShowAddModal
            }

            dashboardData={dashboardData}

            setDashboardData={setDashboardData}
          />
        )
      }

    </div>
  );
}