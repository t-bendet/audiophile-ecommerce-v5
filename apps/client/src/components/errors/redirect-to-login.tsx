import { paths } from "@/config/paths";
import { markSignedOut } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

/**
 * Sends a dead session back to the login page, carrying the current location
 * as `redirectTo` so signing in returns the user where they were.
 */
export const RedirectToLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const loginHref = paths.auth.login.getHref(pathname + search);

  useEffect(() => {
    // Must land before the navigation: the auth layout's loader reads this.
    markSignedOut(queryClient);
    void navigate(loginHref, { replace: true });
  }, [queryClient, navigate, loginHref]);

  return null;
};
