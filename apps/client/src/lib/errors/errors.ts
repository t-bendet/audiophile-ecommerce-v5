import { AppError, ErrorCode } from "@repo/domain";
import { isAxiosError } from "axios";
import { ZodError } from "zod";

// Type guards
export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof AppError ||
    Boolean((error as any)?.code && (error as any)?.statusCode)
  );
}

/**
 * Normalizes any error into an AppError. This is the central function
 * to process all errors in the client application.
 */
export function normalizeError(error: unknown): AppError {
  if (isAxiosError(error)) {
    // Axios errors (network, HTTP status) are classified first
    return classifyAxiosError(error);
  } else if (error instanceof ZodError) {
    // Zod validation errors
    const message = `Validation failed: ${error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")}`;
    const details = error.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      path: issue.path.length > 0 ? issue.path.map(String) : undefined,
    }));
    return new AppError(message, ErrorCode.VALIDATION_ERROR, 422, details);
  } else if (error instanceof Error) {
    // Generic JavaScript errors
    return new AppError(
      error.message,
      ErrorCode.INTERNAL_ERROR,
      500,
      undefined,
    );
  } else if (typeof error === "string") {
    // String errors
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
export function classifyAxiosError(error: {
  // Marked as private, for internal use in normalizeError
  response?: { status: number; data?: { message?: string; code?: ErrorCode } };
  message: string;
  code?: string;
}): AppError {
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

// Helper to extract user-friendly error message from a normalized AppError
export function getErrorMessage(error: AppError): string {
  // Assumes error is already normalized to AppError type
  return error.message;
}
