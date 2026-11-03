import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { createContext, type MiddlewareFunction } from "react-router";
import { proto, setTimings } from "./store";

const timingContext = createContext<{ start: number; wait?: number }>();

export const probeStart: MiddlewareFunction = async (
  { context, request },
  next,
) => {
  const timing = {
    start: performance.now(),
    wait: undefined as number | undefined,
  };
  context.set(timingContext, timing);
  setTimings({});
  try {
    return await next();
  } finally {
    if (!request.signal.aborted) {
      setTimings({
        wait: timing.wait,
        total: Math.round(performance.now() - timing.start),
      });
    }
  }
};

function destinationKeys(_pathname: string): QueryKey[] {
  // Map each route pattern to the app's query keys before comparing cold navigations.
  return [];
}

export const probeAfterUser =
  (queryClient: QueryClient): MiddlewareFunction =>
  async ({ context, request }, next) => {
    const timing = context.get(timingContext);
    timing.wait = Math.round(performance.now() - timing.start);
    setTimings({ wait: timing.wait });
    const { pathname } = new URL(request.url);
    const state = proto();
    if (
      "cache" in state &&
      state.cache === "cold" &&
      pathname !== window.location.pathname
    ) {
      for (const queryKey of destinationKeys(pathname)) {
        queryClient.removeQueries({ queryKey });
      }
    }
    return next();
  };
