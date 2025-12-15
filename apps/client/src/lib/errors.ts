// Error classification for better handling across the app

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public issues: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NetworkError extends Error {
  constructor(
    message = "Network connection failed. Please check your internet connection.",
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvValidationError";
  }
}

// Type guards
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError || (error as Error)?.name === "ApiError";
}

export function isValidationError(error: unknown): error is ValidationError {
  return (
    error instanceof ValidationError ||
    (error as Error)?.name === "ValidationError"
  );
}

export function isNetworkError(error: unknown): error is NetworkError {
  return (
    error instanceof NetworkError || (error as Error)?.name === "NetworkError"
  );
}

export function isEnvError(error: unknown): error is EnvValidationError {
  return (
    error instanceof EnvValidationError ||
    (error as Error)?.name === "EnvValidationError"
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
  if (axiosError.code === "ERR_BAD_REQUEST") {
    return new ApiError("Bad Request", axiosError.response?.status || 400);
  }

  // Network/connection errors
  if (axiosError.code === "ERR_NETWORK" || !axiosError.response) {
    return new NetworkError();
  }

  const status = axiosError.response.status;
  const message =
    axiosError.response.data?.message || axiosError.message || "Request failed";

  return new ApiError(message, status);
}
