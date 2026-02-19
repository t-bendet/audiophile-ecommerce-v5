import { performanceMiddleware } from "@/app/middleware/performance";
import { MainErrorFallback } from "@/components/errors/main";
import { RouteErrorBoundary } from "@/components/errors/route-error-boundary";
import {
  RootLayout,
  clientLoader as rootLoader,
} from "@/components/layouts/root-layout";
import { paths } from "@/config/paths";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";

const convert = (queryClient: QueryClient) => (m: any) => {
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
      errorElement: <MainErrorFallback />,
      middleware: [performanceMiddleware],
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
              path: "*",
              lazy: () =>
                import("./routes/not-found").then(convert(queryClient)),
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

export const AppRouter = () => {
  const queryClient = useQueryClient();

  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);

  return <RouterProvider router={router} />;
};
