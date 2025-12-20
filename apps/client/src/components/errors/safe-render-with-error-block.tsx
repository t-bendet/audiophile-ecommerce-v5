import LoadingSpinner from "@/components/ui/loading-spinner";
import { cn } from "@/lib/cn";
import { isCriticalError } from "@/lib/errors/errors";
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
            if (isCriticalError(error)) {
              throw error;
            }
            return (
              <ErrorBlock
                title={title}
                message={error.message}
                onReset={resetErrorBoundary}
                containerClasses={containerClasses}
              />
            );
          }}
          onReset={reset}
        >
          <Suspense
            fallback={
              fallback ?? <LoadingSpinner classes={cn(spinnerClasses)} />
            }
          >
            {children}
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
