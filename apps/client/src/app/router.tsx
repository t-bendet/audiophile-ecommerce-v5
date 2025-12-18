import { ContentLayout, RootLayout } from "@/components/layouts";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { MainErrorFallback } from "@/components/errors/main";
import { RouteErrorBoundary } from "@/components/errors/route-error-boundary";
import { paths } from "@/config/paths";

// import { ProtectedRoute } from "@/lib/auth";

/**
 * Converts a lazily-loaded route module into a React Router v6+ route configuration.
 * 
 * React Router v6+ Pattern:
 * - For static routes: Use `element` prop with JSX (e.g., `element: <Home />`)
 * - For lazy routes: Use `Component` property with the component function/class (e.g., `Component: Home`)
 * 
 * When using the `lazy` property, React Router expects the loaded module to return an object with:
 * - `Component`: The component function/class itself (NOT JSX) - extracted from the module's default export
 * - `loader`: Optional data loading function - extracted from the module's `clientLoader` export
 * - `action`: Optional action handler function - extracted from the module's `clientAction` export
 * 
 * This function transforms our route modules (which export default components and named `clientLoader`/`clientAction`)
 * into the format React Router expects for lazy routes.
 * 
 * React Router will instantiate the `Component` internally, so we pass the function
 * reference directly, not a JSX element.
 */
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
      // Static route: Use `element` prop with JSX element (<Component />)
      // This is the React Router v6+ standard for non-lazy routes
      element: <RootLayout />,
      errorElement: <MainErrorFallback />,
      children: [
        {
          path: "/",
          // Static route: Use `element` prop with JSX element (<Component />)
          element: <ContentLayout />,
          ErrorBoundary: MainErrorFallback,
          children: [
            // Lazy routes: Use `lazy` property with dynamic import
            // The loaded module exports `Component` (function/class), not JSX
            // The `convert` function extracts Component and passes it to React Router
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
