import {
  requireAuth,
  requireRole,
  resolveCurrentUser,
} from "@/app/middleware/auth";
import { performanceMiddleware } from "@/app/middleware/performance";
import { MainErrorFallback } from "@/components/errors/main";
import { RootErrorBoundary } from "@/components/errors/root-error-boundary";
import { RouteErrorBoundary } from "@/components/errors/route-error-boundary";
import {
  RootHydrateFallback,
  RootLayout,
  clientLoader as rootLoader,
} from "@/components/layouts/root-layout";
import { paths } from "@/config/paths";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { ComponentType } from "react";
import {
  ActionFunction,
  createBrowserRouter,
  LoaderFunction,
  Navigate,
  RouterProvider,
} from "react-router";
// import { ProtectedRoute } from "@/lib/auth";

type RouteModule = {
  default: ComponentType;
  clientLoader?: (queryClient: QueryClient) => LoaderFunction;
  clientAction?: (queryClient: QueryClient) => ActionFunction;
};

const convert = (queryClient: QueryClient) => (m: RouteModule) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  };
};

const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      element: <RootLayout />,
      HydrateFallback: RootHydrateFallback,
      errorElement: <RootErrorBoundary />,
      // Timing first, so the user lookup is inside the measured time.
      middleware: [performanceMiddleware, resolveCurrentUser(queryClient)],
      loader: rootLoader(queryClient),
      children: [
        {
          lazy: () =>
            import("@/components/layouts/content-layout").then(
              convert(queryClient),
            ),
          path: paths.home.path,
          errorElement: <MainErrorFallback />,
          children: [
            {
              lazy: () => import("./routes/home").then(convert(queryClient)),
              path: paths.home.path,
              index: true,
              errorElement: <RouteErrorBoundary />,
            },
            {
              lazy: () => import("./routes/product").then(convert(queryClient)),
              path: paths.product.path,
              errorElement: <RouteErrorBoundary />,
            },
            {
              lazy: () =>
                import("./routes/category").then(convert(queryClient)),
              path: paths.category.path,
              errorElement: <RouteErrorBoundary />,
            },
            {
              lazy: () =>
                import("./routes/checkout").then(convert(queryClient)),
              path: paths.checkout.checkout.path,
              middleware: [requireAuth],
              errorElement: <RouteErrorBoundary />,
            },
            {
              lazy: () =>
                import("@/components/layouts/user-area-layout").then(
                  convert(queryClient),
                ),
              path: paths.account.root.path,
              middleware: [requireAuth],
              errorElement: <RouteErrorBoundary />,
              children: [
                {
                  element: <Navigate to={paths.account.profile.path} replace />,
                  index: true,
                },
                {
                  path: paths.account.profile.path,
                  lazy: () =>
                    import("./routes/account/profile").then(
                      convert(queryClient),
                    ),
                },
                {
                  path: paths.account.security.path,
                  lazy: () =>
                    import("./routes/account/security").then(
                      convert(queryClient),
                    ),
                },
                {
                  path: paths.account.orders.path,
                  lazy: () =>
                    import("./routes/account/orders").then(
                      convert(queryClient),
                    ),
                },
              ],
            },
            {
              path: "*",
              lazy: () =>
                import("./routes/not-found").then(convert(queryClient)),
            },
          ],
        },
        {
          lazy: () =>
            import("@/features/admin/components/admin-layout").then(
              convert(queryClient),
            ),
          path: paths.admin.root.path,
          // requireRole after requireAuth: alone it answers a guest with not-found.
          middleware: [requireAuth, requireRole("ADMIN")],
          errorElement: <RouteErrorBoundary />,
          // Slices add their pages here; see the client guide's admin section.
          children: [
            {
              element: <Navigate to={paths.admin.orders.getHref()} replace />,
              index: true,
            },
            {
              lazy: () =>
                import("@/features/admin/orders/routes/orders-list").then(
                  convert(queryClient),
                ),
              path: paths.admin.orders.path,
              errorElement: <RouteErrorBoundary />,
            },
            {
              lazy: () =>
                import("@/features/admin/orders/routes/order-detail").then(
                  convert(queryClient),
                ),
              path: paths.admin.order.path,
              errorElement: <RouteErrorBoundary />,
            },
            {
              lazy: () =>
                import("@/features/admin/users/routes/users-list").then(
                  convert(queryClient),
                ),
              path: paths.admin.users.path,
              errorElement: <RouteErrorBoundary />,
            },
            {
              lazy: () =>
                import("@/features/admin/users/routes/user-detail").then(
                  convert(queryClient),
                ),
              path: paths.admin.user.path,
              errorElement: <RouteErrorBoundary />,
            },
            {
              lazy: () =>
                import("@/features/admin/products/routes/products-list").then(
                  convert(queryClient),
                ),
              path: paths.admin.products.path,
              errorElement: <RouteErrorBoundary />,
            },
            {
              lazy: () =>
                import("@/features/admin/products/routes/product-edit").then(
                  convert(queryClient),
                ),
              path: paths.admin.product.path,
              errorElement: <RouteErrorBoundary />,
            },
            {
              lazy: () =>
                import("@/features/admin/homepage/routes/homepage").then(
                  convert(queryClient),
                ),
              path: paths.admin.homepage.path,
              errorElement: <RouteErrorBoundary />,
            },
          ],
        },
        {
          lazy: () =>
            import("@/components/layouts/auth-layout").then(
              convert(queryClient),
            ),
          children: [
            {
              lazy: () =>
                import("./routes/auth/login").then(convert(queryClient)),
              path: paths.auth.login.path,
            },
            {
              lazy: () =>
                import("./routes/auth/signup").then(convert(queryClient)),
              path: paths.auth.signup.path,
            },
          ],
        },
      ],
    },
  ]);

// Created on first render: StrictMode re-runs useMemo, and loaders need <InitializeEnv /> first.
let router: ReturnType<typeof createAppRouter> | undefined;
import.meta.hot?.dispose(() => router?.dispose());

export const AppRouter = () => {
  const queryClient = useQueryClient();

  router ??= createAppRouter(queryClient);

  return <RouterProvider router={router} />;
};

// const onError: ClientOnErrorFunction = (
//   error,
//   { location, params, unstable_pattern, errorInfo },
// ) => {
//   // make sure to still log the error so you can see it
//   console.log({ location, params, unstable_pattern, errorInfo, error });
// };
