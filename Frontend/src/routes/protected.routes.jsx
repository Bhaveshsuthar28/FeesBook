import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import {
  RouteSkeleton,
} from "../components/skeleton/PageSkeletons.jsx";

const ProtectedRoute = ({ children }) => {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <RouteSkeleton />;
  }

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
