import { AppError, ErrorCode } from "@repo/domain";
import { AxiosError, isAxiosError } from "axios";
import { ZodError } from "zod";

// Type guards
const isZodError = (err: unknown): err is ZodError => {
  return err instanceof ZodError;
};

// TODO is server error with app error
// TODO continue to copy from server error.middleware.ts as needed
// TODO move to common package if shared between client/server
// safety net for unexpected zod errors
const handleZodError = (err: ZodError) => {
  const message = `Validation failed: ${err.issues.length} error(s)`;

  // Parse Zod issues into structured details
  const details = err.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path.length > 0 ? issue.path.map(String) : undefined,
  }));

  return new AppError(message, ErrorCode.VALIDATION_ERROR, undefined, details);
};

/**
 * Normalizes any error into an AppError. This is the central function
 * to process all errors in the client application.
 *
 * Order matters: Check specific error types (AxiosError, ZodError) before generic Error.
 */
export function normalizeError(error: unknown): AppError {
  // Already normalized
  if (error instanceof AppError) {
    return error;
  }

  // Axios errors (HTTP/network) - check before generic Error since AxiosError extends Error
  if (isAxiosError(error)) {
    return classifyAxiosError(error);
  }

  // Zod validation errors - check before generic Error since ZodError extends Error
  if (error instanceof ZodError) {
    const message = `Validation failed: ${error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")}`;
    const details = error.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      path: issue.path.length > 0 ? issue.path.map(String) : undefined,
    }));
    return new AppError(message, ErrorCode.VALIDATION_ERROR, 422, details);
  }

  // Generic JavaScript errors (after specific Error subtypes)
  if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorCode.INTERNAL_ERROR,
      500,
      undefined,
    );
  }

  // String errors
  if (typeof error === "string") {
    return new AppError(error, ErrorCode.INTERNAL_ERROR, 500);
  }

  // Fallback for unknown error types
  return new AppError(
    "An unknown error occurred",
    ErrorCode.INTERNAL_ERROR,
    500,
  );
}

/**
 * Helper to classify Axios errors into AppError. Used internally by normalizeError.
 */
export function classifyAxiosError(
  error: AxiosError<AppError | undefined>,
): AppError {
  // Network/connection errors
  if (error.code === "ERR_NETWORK" || !error.response) {
    return new AppError(
      "Network connection failed. Please check your internet connection.",
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      503,
    );
  }
  const status = error.response.status;
  const message =
    error.response.data?.message || error.message || "Request failed";
  const code = error.response.data?.code; // Attempt to get custom backend error code

  // Map common statuses to codes, prioritizing backend code if available
  if (code) {
    // If backend provided an explicit ErrorCode
    return new AppError(message, code, status);
  } else if (status === 400 || status === 422) {
    return new AppError(message, ErrorCode.VALIDATION_ERROR, status);
  } else if (status === 401) {
    return new AppError(message, ErrorCode.UNAUTHORIZED, status);
  } else if (status === 403) {
    return new AppError(message, ErrorCode.FORBIDDEN, status);
  } else if (status === 404) {
    return new AppError(message, ErrorCode.NOT_FOUND, status);
  }

  // Server errors or unknown HTTP errors
  return new AppError(message, ErrorCode.INTERNAL_ERROR, status ?? 500);
}

/**
 * Check if error is critical and should bubble up to router boundary.
 * Critical errors: env validation, auth failures, token issues, internal server errors.
 */
export function isCriticalError(error: AppError): boolean {
  // Assumes error is already normalized to AppError type
  return (
    error.code === ErrorCode.UNAUTHORIZED ||
    error.code === ErrorCode.INVALID_TOKEN ||
    error.code === ErrorCode.TOKEN_EXPIRED ||
    error.code === ErrorCode.VALIDATION_ERROR || // Client-side validation is critical for form UX
    error.code === ErrorCode.INTERNAL_ERROR ||
    error.code === ErrorCode.EXTERNAL_SERVICE_ERROR || // Network issues are critical
    error.statusCode >= 500 // Generic server errors
  );
}
