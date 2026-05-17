import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home
  from "./pages/home.pages.jsx";

import ProtectedRoute
  from "./routes/protected.routes.jsx";

import PublicRoute
  from "./routes/public.routes.jsx";

import DashboardLayout
  from "./pages/dashboard.pages.jsx";

import DashboardPage
  from "./pages/dashboardpage.jsx";

import ClassesPage
  from "./pages/classespage.jsx";

import StudentsPage
  from "./pages/studentspage.jsx";

import FeesPage
  from "./pages/feespage.jsx";

import SettingsPage
  from "./pages/settingspages.jsx";

import {
  AppProvider,
} from "./context/user.context.jsx";

const App = () => {

  return (
    <AppProvider>

      <Routes>

        <Route
          path="/"

          element={
            <PublicRoute>
              <Home />
            </PublicRoute>
          }
        />

        <Route

          element={
            <ProtectedRoute>

              <DashboardLayout />

            </ProtectedRoute>
          }
        >

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/classes"
            element={<ClassesPage />}
          />

          <Route
            path="/students"
            element={<StudentsPage />}
          />

          <Route
            path="/fees"
            element={<FeesPage />}
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />

        </Route>

        <Route
          path="*"

          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </AppProvider>
  );
};

export default App;