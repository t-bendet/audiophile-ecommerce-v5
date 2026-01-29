import LoadingSpinner from "@/components/ui/loading-spinner";
import { cn } from "@/lib/cn";
import { isCriticalError, normalizeError } from "@/lib/errors/errors";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { PropsWithChildren, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import ErrorBlock from "./error-block";

type TSafeRenderWithErrorBlockProps = {
  title: string;
  containerClasses?: string;
  spinnerClasses?: string;
  fallback?: React.ReactNode;
};

export const SafeRenderWithErrorBlock = ({
  title,
  containerClasses,
  children,
  spinnerClasses,
  fallback,
}: PropsWithChildren<TSafeRenderWithErrorBlockProps>) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={({ error, resetErrorBoundary }) => {
            const normalizedError = normalizeError(error);
            // DEFENSIVE CHECK: Critical errors should be thrown from loaders using ensureQueryData()
            // and caught by RouteErrorBoundary. If a critical error reaches here, it means
            // we forgot to fail in the loader,rethrow it to prevent silent failures.
            if (isCriticalError(normalizedError)) {
              throw normalizeError(error);
            }
            return (
              <ErrorBlock
                title={title}
                message={normalizedError.message}
                onReset={resetErrorBoundary}
                containerClasses={containerClasses}
              />
            );
          }}
          onReset={reset}
        >
          <Suspense
            fallback={
              fallback ?? <LoadingSpinner className={cn(spinnerClasses)} />
            }
          >
            {children}
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
