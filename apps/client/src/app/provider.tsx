import { MainErrorFallback } from "@/components/errors/main";
import { Spinner } from "@/components/ui/spinner";
import { Toaster } from "@/components/ui/toaster";
import { initializeEnv } from "@/config/env";
import { queryConfig } from "@/lib/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
const ReactQueryDevtoolsLazy = React.lazy(() =>
  import("@tanstack/react-query-devtools").then((m) => ({
    default: m.ReactQueryDevtools,
  })),
);

// import { AuthLoader } from "@/lib/auth";

type AppProviderProps = {
  children: React.ReactNode;
};

// Inner component that initializes env within ErrorBoundary
const AppProviderInner = ({ children }: AppProviderProps) => {
  // Initialize and validate environment at app startup
  // If validation fails, ErrorBoundary (parent) will catch it
  React.useMemo(() => initializeEnv(), []);

  return <>{children}</>;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      }),
  );

  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center">
          <Spinner size="xl" />
        </div>
      }
    >
      <ErrorBoundary FallbackComponent={MainErrorFallback}>
        <QueryClientProvider client={queryClient}>
          <AppProviderInner>
            {import.meta.env.DEV && (
              <React.Suspense fallback={null}>
                <ReactQueryDevtoolsLazy />
              </React.Suspense>
            )}
            <Toaster />
            {/* <AuthLoader
              renderLoading={() => (
                <div className="flex h-screen w-screen items-center justify-center">
                  <Spinner size="xl" />
                </div>
              )}
            >
              {children}
            </AuthLoader> */}
            {children}
          </AppProviderInner>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.Suspense>
  );
};
