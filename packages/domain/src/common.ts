import { z } from "zod";
import { IdValidator } from "./shared.js";

export const GetByIdSchema = z.object({
  params: z
    .object({
      id: IdValidator(),
    })
    .strict(),
});

export type GetByIdParams = z.infer<typeof GetByIdSchema>["params"];

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

// ===== Envelope Pattern - Response Wrapper =====

/**
 * Pagination metadata for list responses
 */
export const PaginationSchema = z.object({
  page: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * Error details for structured error responses
 */
export const ErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  field: z.string().optional(),
  path: z.string().optional(),
});

export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

/**
 * Envelope wrapper for all API responses
 * Separates metadata (success, timestamp, etc.) from payload (data)
 */
export const ResponseEnvelopeSchema = <T extends z.ZodTypeAny>(payload: T) =>
  z.object({
    success: z.boolean(),
    timestamp: z.string().datetime(),
    data: payload.nullable(),
    pagination: PaginationSchema.optional(),
    error: z
      .object({
        message: z.string(),
        code: z.string().optional(),
        details: z.array(ErrorDetailSchema).optional(),
        stack: z.string().optional(),
      })
      .optional(),
  });

export type ResponseEnvelope<T> = {
  success: boolean;
  timestamp: string;
  data: T | null;
  pagination?: Pagination;
  error?: {
    message: string;
    code?: string;
    details?: ErrorDetail[];
    stack?: string;
  };
};

// ===== Specific Response Types =====

/**
 * Success response for single item
 */
export type SuccessResponse<T> = {
  success: true;
  timestamp: string;
  data: T;
  pagination?: never;
  error?: never;
};

/**
 * Success response for list of items with pagination
 */
export type ListResponse<T> = {
  success: true;
  timestamp: string;
  data: T[];
  pagination: Pagination;
  error?: never;
};

/**
 * Success response for operations with no data (e.g., DELETE)
 */
export type EmptyResponse = {
  success: true;
  timestamp: string;
  data: null;
  pagination?: never;
  error?: never;
};

/**
 * Error response
 */
export type ErrorResponse = {
  success: false;
  timestamp: string;
  data: null;
  pagination?: never;
  error: {
    message: string;
    code?: string;
    details?: ErrorDetail[];
    stack?: string;
  };
};

/**
 * Union of all possible response types
 */
export type ApiResponse<T = unknown> =
  | SuccessResponse<T>
  | ListResponse<T>
  | EmptyResponse
  | ErrorResponse;

// ===== Helper Functions =====

/**
 * Create a successful response for a single item
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Create a successful list response with pagination
 */
export function createListResponse<T>(
  data: T[],
  pagination: Omit<Pagination, "totalPages" | "hasNext" | "hasPrev">
): ListResponse<T> {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const hasNext = pagination.page < totalPages;
  const hasPrev = pagination.page > 1;

  return {
    success: true,
    timestamp: new Date().toISOString(),
    data,
    pagination: {
      ...pagination,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
}

/**
 * Create an empty response (for DELETE operations)
 */
export function createEmptyResponse(): EmptyResponse {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data: null,
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  message: string,
  options?: {
    code?: ErrorCode | string;
    details?: ErrorDetail[];
    stack?: string;
  }
): ErrorResponse {
  return {
    success: false,
    timestamp: new Date().toISOString(),
    data: null,
    error: {
      message,
      ...options,
    },
  };
}

// ===== Type Guards =====

/**
 * Check if response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is SuccessResponse<T> | ListResponse<T> | EmptyResponse {
  return response.success === true;
}

/**
 * Check if response is an error
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ErrorResponse {
  return response.success === false;
}

/**
 * Check if response is a paginated list
 */
export function isListResponse<T>(
  response: ApiResponse<T>
): response is ListResponse<T> {
  return response.success === true && "pagination" in response;
}

/**
 * Check if response is a single item
 */
export function isSingleItemResponse<T>(
  response: ApiResponse<T>
): response is SuccessResponse<T> {
  return (
    response.success === true &&
    response.data !== null &&
    !("pagination" in response)
  );
}

/**
 * Check if response is empty (DELETE)
 */
export function isEmptyResponse<T>(
  response: ApiResponse<T>
): response is EmptyResponse {
  return response.success === true && response.data === null;
}

// ===== Zod Schemas for Validation =====

export const SuccessResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    success: z.literal(true),
    timestamp: z.string().datetime(),
    data: item,
  });

export const ListResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    success: z.literal(true),
    timestamp: z.string().datetime(),
    data: z.array(item),
    pagination: PaginationSchema,
  });

export const EmptyResponseSchema = z.object({
  success: z.literal(true),
  timestamp: z.string().datetime(),
  data: z.null(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  timestamp: z.string().datetime(),
  data: z.null(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.array(ErrorDetailSchema).optional(),
    stack: z.string().optional(),
  }),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.discriminatedUnion("success", [
    SuccessResponseSchema(item),
    ListResponseSchema(item),
    EmptyResponseSchema,
    ErrorResponseSchema,
  ]);

// Legacy aliases for backward compatibility
export type Meta = Pagination;
export const MetaSchema = PaginationSchema;
