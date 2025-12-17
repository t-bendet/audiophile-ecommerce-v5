import { ContentLayout, RootLayout } from "@/components/layouts";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";

import { MainErrorFallback } from "@/components/errors/main";
import { RouteErrorBoundary } from "@/components/errors/route-error-boundary";
import { paths } from "@/config/paths";

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
      path: "/",
      element: <RootLayout />,
      errorElement: <MainErrorFallback />,
      children: [
        {
          path: "/",
          element: <ContentLayout />,
          ErrorBoundary: MainErrorFallback,
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

// export const clientLoader =
//   (queryClient: QueryClient) => async (context: LoaderFunctionArgs) => {
//     await queryClient.prefetchQuery(getFeaturedProductQueryOptions());
//     await queryClient.prefetchQuery(getShowCaseProductsQueryOptions());
//     console.log({ context });
//     return null;
//   };
