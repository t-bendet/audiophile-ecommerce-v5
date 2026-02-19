import { isClientZodError, processAxiosError } from "@/lib/errors/errors";
import { ErrorResponse } from "@repo/domain";
import { DefaultOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

export const queryConfig = {
  queries: {
    // Enable for Suspense error boundaries
    throwOnError: (_error, query) => {
      // Don't throw for certain query keys (e.g., optional data)
      if (query.queryKey[0] === "optional-data") return false;

      // Throw for Suspense to catch errors
      return true;
    },
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Classify error to check its type
      const classifiedError = processAxiosError(
        error as AxiosError<ErrorResponse>,
      );
      const status = classifiedError.statusCode;

      // Don't retry client errors (4xx)
      if ((status >= 400 && status < 500) || isClientZodError(error)) {
        return false;
      }

      // Retry server/network errors up to 2 times
      return failureCount < 2;
    },
    staleTime: 1000 * 60, // 1 minute
  },
} satisfies DefaultOptions;
