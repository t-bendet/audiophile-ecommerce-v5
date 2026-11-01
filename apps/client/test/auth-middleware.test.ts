import type { UserDTO } from "@repo/domain";
import { QueryClient } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import {
  createMemoryRouter,
  isRouteErrorResponse,
  type LoaderFunctionArgs,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The HTTP boundary is the only mock: the router, middleware and query client
// are the real ones, so a navigation here exercises the same redirect and
// error plumbing the browser does.
const { api } = vi.hoisted(() => ({ api: { get: vi.fn() } }));
vi.mock("@/lib/api-client", () => ({ getApi: () => api }));

import {
  currentUserContext,
  requireAuth,
  requireRole,
  resolveCurrentUser,
} from "../src/app/middleware/auth";

const shopper: UserDTO = {
  id: "64b7f0c2e4b0a1a2b3c4d5e6",
  name: "Sam Shopper",
  email: "shopper@example.com",
  role: "USER",
  emailVerified: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  v: 0,
};

const admin: UserDTO = {
  ...shopper,
  id: "64b7f0c2e4b0a1a2b3c4d5e7",
  role: "ADMIN",
};

const envelope = <T>(data: T) => ({
  success: true as const,
  timestamp: "2026-11-01T12:00:00.000Z",
  data,
});

const unauthorized = () =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {
      success: false,
      timestamp: "2026-11-01T12:00:00.000Z",
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Please log in",
        statusCode: 401,
      },
    },
  });

const serverError = () =>
  new AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, undefined, {
    status: 500,
    statusText: "Internal Server Error",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {
      success: false,
      timestamp: "2026-11-01T12:00:00.000Z",
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Boom", statusCode: 500 },
    },
  });

/** Answers /auth/status and /users/me the way the server would for `user`. */
const serverSession = (user: UserDTO | null) => {
  api.get.mockImplementation(async (url: string) => {
    if (url === "/auth/status") {
      return { data: envelope({ isAuthenticated: user !== null }) };
    }
    if (url === "/users/me") {
      if (!user) throw unauthorized();
      // Over the wire the date is a string; the schema coerces it back.
      return {
        data: envelope({ ...user, createdAt: user.createdAt.toISOString() }),
      };
    }
    throw new Error(`Unexpected request: ${url}`);
  });
};

const createRouter = (queryClient: QueryClient) =>
  createMemoryRouter([
    {
      path: "/",
      middleware: [resolveCurrentUser(queryClient)],
      children: [
        {
          id: "checkout",
          path: "checkout",
          middleware: [requireAuth],
          loader: ({ context }: LoaderFunctionArgs) =>
            context.get(currentUserContext),
        },
        {
          id: "admin",
          path: "admin",
          // A guarded group owns a boundary, as the app's do, so its
          // middleware's not-found lands on it rather than on the root.
          ErrorBoundary: () => null,
          middleware: [requireAuth, requireRole("ADMIN")],
          loader: () => "admin page",
        },
        {
          id: "account-orders",
          path: "account/orders",
          middleware: [requireAuth],
          loader: () => "orders",
        },
        { path: "auth/login", loader: () => null },
      ],
    },
  ]);

const locationOf = (router: ReturnType<typeof createRouter>) =>
  router.state.location.pathname + router.state.location.search;

// Which boundary catches a middleware error depends on the navigation (the
// group's on a client navigation, the root's on a full page load), so look
// at every boundary.
const boundaryStatuses = (router: ReturnType<typeof createRouter>) =>
  Object.values(router.state.errors ?? {}).map((error) =>
    isRouteErrorResponse(error) ? error.status : error,
  );

describe("auth middleware", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    api.get.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("sends a guest to login with the page they asked for as the return URL", async () => {
    serverSession(null);
    const router = createRouter(queryClient);

    await router.navigate("/checkout?step=2");

    expect(locationOf(router)).toBe(
      "/auth/login?redirectTo=%2Fcheckout%3Fstep%3D2",
    );
  });

  it("lets a signed-in shopper through and hands loaders the user from the context", async () => {
    serverSession(shopper);
    const router = createRouter(queryClient);

    await router.navigate("/checkout");

    expect(locationOf(router)).toBe("/checkout");
    expect(router.state.loaderData.checkout).toEqual(shopper);
  });

  it("answers a signed-in shopper at an admin route with not-found, staying on the URL", async () => {
    serverSession(shopper);
    const router = createRouter(queryClient);

    await router.navigate("/admin");

    expect(locationOf(router)).toBe("/admin");
    expect(boundaryStatuses(router)).toEqual([404]);
    expect(router.state.loaderData.admin).toBeUndefined();
  });

  it("lets an admin through to an admin route", async () => {
    serverSession(admin);
    const router = createRouter(queryClient);

    await router.navigate("/admin");

    expect(locationOf(router)).toBe("/admin");
    expect(router.state.loaderData.admin).toBe("admin page");
  });

  it("treats a session that died since the last status check as a guest", async () => {
    serverSession(shopper);
    const router = createRouter(queryClient);
    await router.navigate("/checkout");
    // The cookie expires: the cached status still says signed in, but the
    // server now rejects the user lookup.
    api.get.mockImplementation(async (url: string) => {
      if (url === "/users/me") throw unauthorized();
      throw new Error(`Unexpected request: ${url}`);
    });

    await router.navigate("/account/orders");

    expect(locationOf(router)).toBe(
      "/auth/login?redirectTo=%2Faccount%2Forders",
    );
    expect(boundaryStatuses(router)).toEqual([]);
  });

  it("keeps the last known user when the lookup fails for a reason other than auth", async () => {
    serverSession(shopper);
    const router = createRouter(queryClient);
    await router.navigate("/checkout");
    api.get.mockImplementation(async (url: string) => {
      if (url === "/users/me") throw serverError();
      throw new Error(`Unexpected request: ${url}`);
    });

    await router.navigate("/account/orders");

    expect(locationOf(router)).toBe("/account/orders");
    expect(boundaryStatuses(router)).toEqual([]);
    expect(router.state.loaderData["account-orders"]).toBe("orders");
  });

  it("sees a role change on the next navigation without a reload", async () => {
    serverSession(shopper);
    const router = createRouter(queryClient);
    await router.navigate("/admin");
    expect(boundaryStatuses(router)).toEqual([404]);
    serverSession({ ...shopper, role: "ADMIN" });

    await router.navigate("/checkout");
    await router.navigate("/admin");

    expect(boundaryStatuses(router)).toEqual([]);
    expect(router.state.loaderData.admin).toBe("admin page");
  });
});
