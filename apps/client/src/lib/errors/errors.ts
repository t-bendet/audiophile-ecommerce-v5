import { AppError, ErrorCode, ErrorResponse } from "@repo/domain";
import { AxiosError, isAxiosError } from "axios";
import { ZodError } from "zod";

// Type guards
export const isClientZodError = (err: unknown): err is ZodError => {
  return err instanceof ZodError;
};

const isAppError = (err: unknown): err is AppError => {
  return (
    typeof err === "object" &&
    err !== null &&
    typeof (err as any).code === "string" &&
    Object.values(ErrorCode).includes((err as any).code) &&
    typeof (err as any).statusCode === "number" &&
    typeof (err as any).message === "string"
  );
};

// schema validation on api requests payloads(client side) or responses(server side)?
const handleZodError = (err: ZodError) => {
  const message = `Validation failed: ${err.issues.length} error(s)`;
  // Parse Zod issues into structured details
  // TODO consider using treeifyError for better error paths
  // TODO consider which error messages to expose to client(on route level and feature level and form level)
  const details = err.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path.length > 0 ? issue.path.map(String) : undefined,
  }));
  return new AppError(message, ErrorCode.VALIDATION_ERROR, 422, details);
};

/**
 * Helper to classify Axios errors into AppError. Used internally by normalizeError.
 */
export function processAxiosError(error: AxiosError<ErrorResponse>): AppError {
  // Network/connection errors
  // do we have an error.response.data
  if (error.code == "ERR_NETWORK" || !error.response) {
    return new AppError(
      "Network connection failed. Please check your internet connection.",
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      503,
    );
  }

  if (error.code == "ERR_BAD_RESPONSE" || error.code == "ERR_BAD_REQUEST") {
    const originalError = error.response.data.error;
    if (isAppError(originalError)) {
      const formattedError = new AppError(
        originalError.message,
        originalError.code,
        originalError.statusCode,
        originalError.details,
      );
      return formattedError;
    }
  }

  // Server errors or unknown HTTP errors
  return new AppError(
    "Something went very wrong!",
    ErrorCode.INTERNAL_ERROR,
    500,
  );
}

/**
 * Check if error is critical and should bubble up to router boundary.
 * Critical errors: env validation, auth failures, token issues, internal server errors.
 */
export function isCriticalError(error: AppError): boolean {
  // Assumes error is already normalized to AppError type
  // TODO rethink criteria for critical errors on client side
  return (
    error.code === ErrorCode.INTERNAL_ERROR ||
    error.code === ErrorCode.EXTERNAL_SERVICE_ERROR || // Network issues are critical
    error.statusCode >= 500 // Generic server errors
  );
}

/**
 * Normalizes any error into an AppError. This is the central function
 * to process all errors in the client application.
 *
 * Order matters: Check specific error types (AxiosError, ZodError) before generic Error.
 */
export function normalizeError(error: unknown): AppError {
  // Already normalized
  if (import.meta.env.MODE === "development") {
    console.log({ error }, "normalizeError DEV ONLY");
  }

  if (error instanceof AppError) {
    return error;
  }

  // Axios errors (HTTP/network) - check before generic Error since AxiosError extends Error
  if (isAxiosError(error)) {
    // either network error or HTTP error response
    // if we have a response with data, try to extract AppError from it
    // otherwise classify as network error and create generic AppError
    // TODO if it is a post/create/update request, and we have error.response.data.error.details as zod error details,
    // TODO it means server side validation failed, and something was wrong with the request payload or params(usually payload on this kind of requests)
    // TODO we can reconstruct a zod error from the details and provide more specific validation error to client

    return processAxiosError(error);
  }

  // Zod validation errors - check before generic Error since ZodError extends Error
  // to check schema validation errors on client side
  // on client side we only expect zod errors from schema validation of api responses or local form validations
  if (isClientZodError(error)) {
    return handleZodError(error);
  }

  // Generic JavaScript errors (after specific Error subtypes)
  if (error instanceof Error) {
    return new AppError(
      "We encountered an unexpected issue. Please try again later.",
      ErrorCode.INTERNAL_ERROR,
    );
  }

  // String errors
  if (typeof error === "string") {
    return new AppError(
      "Something unexpected happened. Please refresh the page and try again.",
      ErrorCode.INTERNAL_ERROR,
    );
  }

  // Fallback for unknown error types
  return new AppError(
    "An unknown error occurred",
    ErrorCode.INTERNAL_ERROR,
    500,
  );
}
