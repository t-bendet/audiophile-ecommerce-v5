import { cn } from "@/lib/cn";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { PropsWithChildren, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import LoadingSpinner from "../layouts/loading-spinner";
import ErrorBlock from "./ErrorBlock";

type TSafeRenderWithErrorBlockProps = {
  title: string;
  containerClasses?: string;
  spinnerClasses?: string;
};

export const SafeRenderWithErrorBlock = ({
  title,
  containerClasses,
  children,
  spinnerClasses,
}: PropsWithChildren<TSafeRenderWithErrorBlockProps>) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={({ error, resetErrorBoundary }) => {
            return (
              <ErrorBlock
                title={title}
                message={error.message}
                onReset={resetErrorBoundary}
                error={error}
                containerClasses={containerClasses}
              />
            );
          }}
          onReset={reset}
        >
          <Suspense fallback={<LoadingSpinner classes={cn(spinnerClasses)} />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
