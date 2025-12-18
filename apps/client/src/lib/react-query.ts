import { classifyHttpError } from "@/lib/errors/errors";
import { DefaultOptions } from "@tanstack/react-query";

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
      const classifiedError = classifyHttpError(error);
      const status = classifiedError.statusCode;

      // Don't retry client errors (4xx)
      if (status >= 400 && status < 500) {
        return false;
      }

      // Retry server/network errors up to 2 times
      return failureCount < 2;
    },
    staleTime: 1000 * 60, // 1 minute
  },
} satisfies DefaultOptions;
