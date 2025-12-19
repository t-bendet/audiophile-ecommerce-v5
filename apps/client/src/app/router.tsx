import { RootLayout } from "@/components/layouts";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { MainErrorFallback } from "@/components/errors/main";
import { RouteErrorBoundary } from "@/components/errors/route-error-boundary";
import { paths } from "@/config/paths";
import { errorMiddleware } from "@/lib/errors/middleware";

// import { ProtectedRoute } from "@/lib/auth";

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
      path: paths.home.path,
      element: <RootLayout />,
      errorElement: <MainErrorFallback />,
      middleware: [errorMiddleware],
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
              path: "*",
              lazy: () =>
                import("./routes/not-found").then(convert(queryClient)),
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

// const onError: ClientOnErrorFunction = (
//   error,
//   { location, params, unstable_pattern, errorInfo },
// ) => {
//   // make sure to still log the error so you can see it
//   console.log({ location, params, unstable_pattern, errorInfo, error });
// };
