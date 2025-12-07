import { z } from "zod";
import { ErrorCode } from "./error-codes.js";

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
  path: z.array(z.string()).optional(),
});

export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

/**
 * Envelope wrapper for all API responses
 * Separates metadata (success, timestamp, etc.) from payload (data)
 */
export const ResponseEnvelopeSchema = <T extends z.ZodTypeAny>(payload: T) =>
  z.object({
    success: z.boolean(),
    timestamp: z.iso.datetime(),
    data: payload.nullable(),
    pagination: PaginationSchema.optional(),
    error: z
      .object({
        message: z.string(),
        code: z.enum(ErrorCode),
        details: z.array(ErrorDetailSchema).optional(),
        stack: z.string().optional(),
      })
      .optional(),
  });

export type ResponseEnvelope<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof ResponseEnvelopeSchema<T>>
>;

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
  options: {
    code: ErrorCode;
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
    timestamp: z.iso.datetime(),
    data: z.array(item),
    pagination: PaginationSchema,
  });

export const EmptyResponseSchema = z.object({
  success: z.literal(true),
  timestamp: z.iso.datetime(),
  data: z.null(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  timestamp: z.iso.datetime(),
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
