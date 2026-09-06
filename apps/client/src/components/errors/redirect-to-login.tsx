import { paths } from "@/config/paths";
import { markSignedOut } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";

/**
 * Sends a dead session back to the login page, carrying the current location
 * as `redirectTo` so signing in returns the user where they were.
 */
export const RedirectToLogin = () => {
  const queryClient = useQueryClient();
  const { pathname, search } = useLocation();
  const [isSignedOut, setIsSignedOut] = useState(false);

  useEffect(() => {
    // Must land before the navigation: the auth layout's loader reads this.
    markSignedOut(queryClient);
    setIsSignedOut(true);
  }, [queryClient]);

  if (!isSignedOut) return null;

  return <Navigate to={paths.auth.login.getHref(pathname + search)} replace />;
};
