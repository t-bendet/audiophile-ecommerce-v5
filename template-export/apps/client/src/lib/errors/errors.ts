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
  // Only data-loading and auth errors are critical and should crash the route.
  // Component composition errors and other 4xx errors should be caught by SafeRenderWithErrorBlock.
  const criticalCodes = [
    ErrorCode.INTERNAL_ERROR, // Server errors from loaders/API
    ErrorCode.EXTERNAL_SERVICE_ERROR, // Network issues from loaders
  ];

  const isCriticalCode = criticalCodes.includes(error.code as ErrorCode);
  const isServerError = error.statusCode >= 500;

  return isCriticalCode || isServerError;
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
