import { paths } from "@/config/paths";
import {
  getAuthStatusQueryOptions,
  getUserQueryOptions,
  markSignedOut,
} from "@/lib/auth";
import {
  isAuthError,
  isDeactivatedError,
  normalizeError,
} from "@/lib/errors/errors";
import type { ROLE, UserDTO } from "@repo/domain";
import type { QueryClient } from "@tanstack/react-query";
import { createContext, redirect, type MiddlewareFunction } from "react-router";

/** The signed-in user the root middleware resolved for this navigation; `null` is a guest. */
export const currentUserContext = createContext<UserDTO | null>(null);

const fetchCurrentUser = async (
  queryClient: QueryClient,
  request: Request,
): Promise<UserDTO | null> => {
  const status = await queryClient.ensureQueryData(getAuthStatusQueryOptions());
  if (!status.data.isAuthenticated) {
    return null;
  }
  try {
    // Fresh on every navigation, whatever the query's stale time says.
    const response = await queryClient.fetchQuery({
      ...getUserQueryOptions(),
      staleTime: 0,
    });
    return response.data;
  } catch (error) {
    const failure = normalizeError(error);
    // The cookie died since the status was cached: a guest now.
    if (isAuthError(failure)) {
      markSignedOut(queryClient);
      return null;
    }
    // The account was deactivated since: a guest too, and the login page says why.
    if (isDeactivatedError(failure)) {
      markSignedOut(queryClient);
      const url = new URL(request.url);
      throw redirect(
        paths.auth.login.getHref(url.pathname + url.search, "deactivated"),
      );
    }
    // Any other failure keeps the user already known; the components that
    // render the user surface the error.
    const known = queryClient.getQueryData(getUserQueryOptions().queryKey);
    if (known) {
      return known.data;
    }
    throw error;
  }
};

export const resolveCurrentUser =
  (queryClient: QueryClient): MiddlewareFunction =>
  async ({ context, request }, next) => {
    context.set(
      currentUserContext,
      await fetchCurrentUser(queryClient, request),
    );
    return next();
  };

export const requireAuth: MiddlewareFunction = ({ context, request }, next) => {
  if (!context.get(currentUserContext)) {
    const url = new URL(request.url);
    throw redirect(paths.auth.login.getHref(url.pathname + url.search));
  }
  return next();
};

export const requireRole =
  (role: ROLE): MiddlewareFunction =>
  ({ context }, next) => {
    if (context.get(currentUserContext)?.role !== role) {
      throw new Response(null, { status: 404, statusText: "Not Found" });
    }
    return next();
  };
