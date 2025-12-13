import { ContentLayout, RootLayout } from "@/components/layouts";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { MainErrorFallback } from "@/components/errors/main";
import { paths } from "@/config/paths";

// import { ProtectedRoute } from "@/lib/auth";

const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,

      children: [
        {
          path: "/",
          element: <ContentLayout />,
          ErrorBoundary: MainErrorFallback,
          children: [
            {
              lazy: {
                loader: async () => {
                  return (await import("./routes/home")).clientLoader(
                    queryClient,
                  );
                },
                Component: async () => {
                  return (await import("./routes/home")).default;
                },
              },
              path: paths.home.path,
              index: true,
            },
            {
              lazy: {
                Component: async () => {
                  return (await import("./routes/product")).default;
                },
                loader: async () => {
                  return (await import("./routes/product")).clientLoader(
                    queryClient,
                  );
                },
              },
              path: paths.product.path,
            },
            {
              lazy: {
                Component: async () => {
                  return (await import("./routes/category")).default;
                },
                loader: async () => {
                  return (await import("./routes/category")).clientLoader(
                    queryClient,
                  );
                },
              },
              path: paths.category.path,
            },

            {
              path: "*",
              lazy: {
                Component: async () => {
                  return (await import("./routes/not-found")).default;
                },
              },
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
//   (queryClient: QueryClient) =>
//   async ({ request }: LoaderFunctionArgs) => {
//     await queryClient.prefetchQuery(getFeaturedProductQueryOptions());
//     await queryClient.prefetchQuery(getShowCaseProductsQueryOptions());
//     console.log(request.url);

//     return null;
//   };
