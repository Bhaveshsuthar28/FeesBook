import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (userId) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;