import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { paths } from "@/config/paths";
import {
  isAuthError,
  isCriticalError,
  isNotFoundResponse,
  normalizeError,
} from "@/lib/errors/errors";
import { ErrorCode } from "@repo/domain";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";
import { NotFound } from "./not-found";
import { RedirectToLogin } from "./redirect-to-login";

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let statusCode: number;
  let title: string;
  let message: string;

  if (isNotFoundResponse(error)) {
    return <NotFound />;
  }

  if (isRouteErrorResponse(error)) {
    // React Router Response errors - extract directly without normalization
    statusCode = error.status;
    title = error.statusText || `Error ${statusCode}`;
    message = error.data || "An error occurred";
  } else {
    // All other errors - normalize first
    const normalizedError = normalizeError(error);

    // A dead session cannot be retried; only signing in again fixes it.
    if (isAuthError(normalizedError)) {
      return <RedirectToLogin />;
    }

    statusCode = normalizedError.statusCode;
    title = "Request Failed";
    message = normalizedError.message;

    // Special case for NOT_FOUND code
    if (normalizedError.code === ErrorCode.NOT_FOUND) {
      title = "Not Found";
    }

    // Critical error override - don't leak internal details
    if (isCriticalError(normalizedError)) {
      title = "Critical Application Error";
      message = "A critical error occurred. Please try again later.";
    }
  }

  return (
    <Container classes="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary-500">
          {statusCode}
        </h1>
        <h2 className="mb-2 text-2xl font-semibold text-neutral-900">
          {title}
        </h2>
        <p className="mb-6 text-neutral-600">{message}</p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
          <Button onClick={() => navigate(paths.home.getHref())}>
            Go Home
          </Button>
        </div>
      </div>
    </Container>
  );
}
