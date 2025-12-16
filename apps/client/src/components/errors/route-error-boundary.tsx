import { Button } from "@components/ui/button";
import { Container } from "@components/ui/container";
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import {
  isApiError,
  isNetworkError,
  getErrorMessage,
  isCriticalError,
} from "@/lib/errors";

export function RouteErrorBoundary() {
  const error = useRouteError();
  console.log({ error }, "router level");
  const navigate = useNavigate();

  let statusCode = 500;
  let title = "Something went wrong";
  let message = getErrorMessage(error);

  // React Router Response errors (thrown from loaders)
  if (isRouteErrorResponse(error)) {
    console.log("isRouteErrorResponse");
    statusCode = error.status;
    title = error.statusText || `Error ${statusCode}`;
    message = error.data || message;

    if (statusCode === 404) {
      title = "Page Not Found";
      message = "The page you're looking for doesn't exist.";
    } else if (statusCode === 400) {
      title = "Bad Request";
    }
  }
  // Custom API errors
  else if (isApiError(error)) {
    console.log({ error }, "isApiError");
    statusCode = error.status;
    title = statusCode === 404 ? "Not Found" : "Request Failed";
    message = error.message;
  }
  // Network errors
  else if (isNetworkError(error)) {
    console.log("isNetworkError");

    title = "Connection Error";
    message = error.message;
  } else if (isCriticalError(error)) {
    // For critical errors, show generic message
    title = "Critical Error";
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
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    </Container>
  );
}
