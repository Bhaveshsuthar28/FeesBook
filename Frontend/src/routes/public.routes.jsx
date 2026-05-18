import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import {
  RouteSkeleton,
} from "../components/skeleton/PageSkeletons.jsx";

const PublicRoute = ({ children }) => {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <RouteSkeleton />;
  }

  if (userId) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
