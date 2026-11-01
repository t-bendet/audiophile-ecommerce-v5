import { isNotFoundResponse } from "@/lib/errors/errors";
import { useRouteError } from "react-router";
import { MainErrorFallback } from "./main";
import { NotFound } from "./not-found";

/** The root route's boundary; on a full page load a middleware's 404 lands here. */
export function RootErrorBoundary() {
  const error = useRouteError();
  if (isNotFoundResponse(error)) {
    return <NotFound />;
  }
  return <MainErrorFallback />;
}
