import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { paths } from "@/config/paths";
import { isCriticalError, normalizeError } from "@/lib/errors/errors";
import { ErrorCode } from "@repo/domain";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";

export function RouteErrorBoundary() {
  const error = useRouteError();
  console.log({ error });
  const normalizedError = normalizeError(error); // Normalize all incoming errors

  const navigate = useNavigate();

  let statusCode = normalizedError.statusCode;
  let title = "Something went wrong";
  let message = normalizedError.message;

  if (isRouteErrorResponse(error)) {
    console.log(error, "isRouteErrorResponse");
    // React Router Response errors take precedence for status/title/message if available
    statusCode = error.status;
    title = error.statusText || `Error ${statusCode}`;
    message = error.data || message;

    if (statusCode === 404) {
      title = "Page Not Found";
      message = "The page you're looking for doesn't exist.";
    } else if (statusCode === 400) {
      title = "Bad Request";
    }
  } else {
    // For other normalized errors (AppError, ZodError, generic Error)
    title =
      normalizedError.code === ErrorCode.NOT_FOUND
        ? "Not Found"
        : normalizedError.code === ErrorCode.VALIDATION_ERROR
          ? "Validation Error"
          : "Request Failed";
  }

  if (isCriticalError(normalizedError)) {
    // Override with a generic critical error message for public display if truly critical
    title = "Critical Application Error";
    message = "A critical error occurred. Please try again later.";
  }

  return (
    <Container classes="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-primary-500 mb-4 text-6xl font-bold">
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
