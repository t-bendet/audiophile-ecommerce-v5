import { AppError, ErrorCode } from "@repo/domain";

// Type guards
export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof AppError ||
    Boolean((error as any)?.code && (error as any)?.statusCode)
  );
}

/**
 * Check if error is critical and should bubble up to router boundary.
 * Critical errors: env validation, auth failures, token issues.
 */
export function isCriticalError(error: unknown): boolean {
  if (!isAppError(error)) return false;
  return (
    error.code === ErrorCode.UNAUTHORIZED ||
    error.code === ErrorCode.INVALID_TOKEN ||
    error.code === ErrorCode.TOKEN_EXPIRED ||
    error.code === ErrorCode.VALIDATION_ERROR ||
    error.code === ErrorCode.INTERNAL_ERROR
  );
}

// Helper to extract user-friendly error message
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

// Helper to classify axios/fetch errors
export function classifyHttpError(error: unknown): Error {
  const axiosError = error as {
    response?: { status: number; data?: { message?: string } };
    message: string;
    code?: string;
  };
  // Network/connection errors
  if (axiosError.code === "ERR_NETWORK" || !axiosError.response) {
    return new AppError(
      "Network connection failed. Please check your internet connection.",
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      503,
    );
  }

  const status = axiosError.response.status;
  const message =
    axiosError.response.data?.message || axiosError.message || "Request failed";

  // Map common statuses to codes
  if (status === 400 || status === 422) {
    return new AppError(message, ErrorCode.VALIDATION_ERROR, status);
  }
  if (status === 401) {
    return new AppError(message, ErrorCode.UNAUTHORIZED, status);
  }
  if (status === 403) {
    return new AppError(message, ErrorCode.FORBIDDEN, status);
  }
  if (status === 404) {
    return new AppError(message, ErrorCode.NOT_FOUND, status);
  }

  // Server errors or unknown
  return new AppError(message, ErrorCode.INTERNAL_ERROR, status ?? 500);
}
