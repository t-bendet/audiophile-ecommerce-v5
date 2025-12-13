import { DefaultOptions } from "@tanstack/react-query";

export const queryConfig = {
  queries: {
    // throwOnError: true,
    refetchOnWindowFocus: true,
    retry: false,
    // staleTime: 1000 * 60,
  },
} satisfies DefaultOptions;
