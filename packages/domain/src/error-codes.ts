// ===== Standard Error Codes =====

/**
 * Standard application error codes
 * Use these for consistent error handling across the API
 */

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

  // Component/UI errors (400)
  COMPONENT_COMPOSITION_ERROR = "COMPONENT_COMPOSITION_ERROR",

  // Cart errors (400, 404)
  CART_NOT_FOUND = "CART_NOT_FOUND",
  CART_ITEM_NOT_FOUND = "CART_ITEM_NOT_FOUND",
  CART_EMPTY = "CART_EMPTY",
  INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK",
  INVALID_QUANTITY = "INVALID_QUANTITY",

  // Order errors (400, 404)
  ORDER_NOT_FOUND = "ORDER_NOT_FOUND",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  INVALID_ORDER_STATUS = "INVALID_ORDER_STATUS",
  ORDER_ALREADY_PROCESSED = "ORDER_ALREADY_PROCESSED",

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

  // Component/UI errors (400)
  [ErrorCode.COMPONENT_COMPOSITION_ERROR]: 400,

  // Cart errors
  [ErrorCode.CART_NOT_FOUND]: 404,
  [ErrorCode.CART_ITEM_NOT_FOUND]: 404,
  [ErrorCode.CART_EMPTY]: 400,
  [ErrorCode.INSUFFICIENT_STOCK]: 400,
  [ErrorCode.INVALID_QUANTITY]: 400,

  // Order errors
  [ErrorCode.ORDER_NOT_FOUND]: 404,
  [ErrorCode.PAYMENT_FAILED]: 400,
  [ErrorCode.INVALID_ORDER_STATUS]: 400,
  [ErrorCode.ORDER_ALREADY_PROCESSED]: 400,

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
