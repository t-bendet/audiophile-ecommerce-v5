// ===== Standard Error Codes =====

/**
 * Standard application error codes
 * Use these for consistent error handling across the API
 */

// TODO add validation error codes for different scenarios (e.g. invalid input, missing fields, etc.) 400 422
// TODO make sure accross the app we use these error codes consistently and with right http status codes

export enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_ID = "INVALID_ID",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // Resource errors (404, 409)
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",

  // Authentication errors (401)
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",

  // Authorization errors (403)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Request errors (400, 422)
  BAD_REQUEST = "BAD_REQUEST",
  UNPROCESSABLE_ENTITY = "UNPROCESSABLE_ENTITY",

  // Server errors (500, 502, 503)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",

  // Business logic errors
  OPERATION_FAILED = "OPERATION_FAILED",
  CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",
}

/**
 * Maps error codes to their corresponding HTTP status codes
 */
export const ERROR_CODE_TO_STATUS: Record<ErrorCode, number> = {
  // Validation errors (400)
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.INVALID_ID]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.BAD_REQUEST]: 400,

  // Resource errors
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.DUPLICATE_ENTRY]: 409,

  // Authentication errors (401)
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,

  // Authorization errors (403)
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,

  // Request errors
  [ErrorCode.UNPROCESSABLE_ENTITY]: 422,

  // Server errors (500)
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.OPERATION_FAILED]: 500,
  [ErrorCode.CONSTRAINT_VIOLATION]: 400,
};

/**
 * Get HTTP status code for an error code
 */
export const getStatusCode = (code: ErrorCode): number => {
  return ERROR_CODE_TO_STATUS[code] || 500;
};
