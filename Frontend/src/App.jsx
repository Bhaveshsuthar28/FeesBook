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

import SectionsPage
  from "./pages/sectionspage.jsx";

import StudentsPage
  from "./pages/studentspage.jsx";

import StudentDetailsPage
  from "./pages/studentdetailspage.jsx";

import FeesPage
  from "./pages/feespage.jsx";

import SettingsPage
  from "./pages/settingspages.jsx";

import RemindersPage
  from "./pages/reminderspage.jsx";

import ProfilePage
  from "./pages/profilepage.jsx";

import HelpPage
  from "./pages/helppage.jsx";

import AboutPage from "./pages/aboutpage.jsx";
import PrivacyPage from "./pages/privacypage.jsx";
import TermsPage from "./pages/termspage.jsx";

import {
  AppProvider,
} from "./context/user.context.jsx";

const AppContent = () => {
  return (
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
        path="/about"
        element={
          <PublicRoute>
            <AboutPage />
          </PublicRoute>
        }
      />

      <Route
        path="/privacy"
        element={
          <PublicRoute>
            <PrivacyPage />
          </PublicRoute>
        }
      />

      <Route
        path="/terms"
        element={
          <PublicRoute>
            <TermsPage />
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
          path="dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="classes"
          element={<ClassesPage />}
        />

        <Route
          path="classes/:className/sections"
          element={<SectionsPage />}
        />

        <Route
          path="classes/:className/sections/:sectionName/students"
          element={<StudentsPage />}
        />

        <Route
          path="classes/:className/sections/:sectionName/students/:studentId"
          element={<StudentDetailsPage />}
        />

        <Route
          path="students"
          element={<StudentsPage />}
        />

        <Route
          path="students/:studentId"
          element={<StudentDetailsPage />}
        />

        <Route
          path="fees"
          element={<FeesPage />}
        />

        <Route
          path="settings"
          element={<SettingsPage />}
        />

        <Route
          path="reminders"
          element={<RemindersPage />}
        />

        <Route
          path="profile"
          element={<ProfilePage />}
        />

        <Route
          path="help"
          element={<HelpPage />}
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
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
