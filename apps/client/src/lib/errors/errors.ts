import { AppError, ErrorCode, ErrorResponse } from "@repo/domain";
import { AxiosError, isAxiosError } from "axios";
import { ZodError } from "zod";

// Type guards
const isClientSchemaValidationError = (err: unknown): err is ZodError => {
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

// TODO is server error with app error
// TODO continue to copy from server error.middleware.ts as needed
// TODO move to common package if shared between client/server
// schema validation on api requests payloads(client side) or responses(server side)?
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
    // either network error or HTTP error response
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
export function classifyAxiosError(error: AxiosError<ErrorResponse>): AppError {
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
    if (isAppError(error.response.data.error)) {
      return error.response.data.error;
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
