import {
  useAuth,
} from "@clerk/clerk-react";

import {
  useLayoutEffect,
  useState,
} from "react";

import {
  clearClerkTokenGetter,
  setClerkTokenGetter,
} from "../../lib/api/axiosClient.js";

import {
  RouteSkeleton,
} from "../skeleton/PageSkeletons.jsx";

export default function AuthAxiosSetup({
  children,
}) {
  const {
    getToken,
    isLoaded,
    isSignedIn,
  } = useAuth();

  const [
    authReady,
    setAuthReady,
  ] = useState(false);

  useLayoutEffect(() => {
    if (!isLoaded) {
      setAuthReady(false);
      return;
    }

    if (!isSignedIn) {
      clearClerkTokenGetter();
      setAuthReady(true);
      return;
    }

    setClerkTokenGetter(
      async () => {
        try {
          return await getToken();
        } catch (error) {
          console.error(
            "Clerk getToken failed",
            error
          );
          return null;
        }
      }
    );

    setAuthReady(true);
  }, [
    getToken,
    isLoaded,
    isSignedIn,
  ]);

  if (!isLoaded) {
    return <RouteSkeleton />;
  }

  if (
    isSignedIn &&
    !authReady
  ) {
    return <RouteSkeleton />;
  }

  return children;
}
