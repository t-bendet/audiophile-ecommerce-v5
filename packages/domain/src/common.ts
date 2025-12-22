import { z } from "zod";
import { AppError } from "./app-error.js";
import { ErrorCode } from "./error-codes.js";

// ===== Envelope Pattern - Response Wrapper =====

/**
 * Pagination metadata for list responses
 */
export const MetaSchema = z.object({
  page: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export type Meta = z.infer<typeof MetaSchema>;

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
 * Error Object Schema
 */
export const ErrorObjectSchema = z.object({
  code: z.enum(ErrorCode),
  message: z.string(),
  details: z.array(ErrorDetailSchema).optional(),
  stack: z.string().optional(),
  statusCode: z.number(),
}) satisfies z.ZodType<Omit<AppError, "name" | "cause">>;

export type ErrorObject = z.infer<typeof ErrorObjectSchema>;

// ===== Specific Response Types =====

/**
 * Success response for single item
 */
export type SingleItemResponse<T> = {
  success: true;
  timestamp: string;
  data: T;
};

/**
 * Success response for list of items with metadata
 */
export type ListResponse<T> = {
  success: true;
  timestamp: string;
  data: T[];
  meta: Meta;
};

/**
 * Success response for operations with no data (e.g., DELETE)
 */
export type EmptyResponse = {
  success: true;
  timestamp: string;
  data: null;
};

/**
 * Error response
 */
export type ErrorResponse = {
  success: false;
  timestamp: string;
  data: null;
  error: ErrorObject;
};

/**
 * Union of all possible response types
 */
export type ApiResponse<T = unknown> =
  | SingleItemResponse<T>
  | ListResponse<T>
  | EmptyResponse
  | ErrorResponse;

// ===== Helper Functions =====

/**
 * Create a successful response for a single item
 */
export function createSingleItemResponse<T>(data: T): SingleItemResponse<T> {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Create a successful list response with pagination
 */
export function createListResponse<T>(data: T[], meta: Meta): ListResponse<T> {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data,
    meta,
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
export function createErrorResponse(options: ErrorObject): ErrorResponse {
  return {
    success: false,
    timestamp: new Date().toISOString(),
    data: null,
    error: {
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
): response is SingleItemResponse<T> | ListResponse<T> | EmptyResponse {
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
  return response.success === true && "meta" in response;
}

/**
 * Check if response is a single item
 */
export function isSingleItemResponse<T>(
  response: ApiResponse<T>
): response is SingleItemResponse<T> {
  return (
    response.success === true && response.data !== null && !("meta" in response)
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

export const SingleItemResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    success: z.literal(true),
    timestamp: z.iso.datetime(),
    data: item,
  });

export const ListResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    success: z.literal(true),
    timestamp: z.iso.datetime(),
    data: z.array(item),
    meta: MetaSchema,
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
  error: ErrorObjectSchema,
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.discriminatedUnion("success", [
    SingleItemResponseSchema(item),
    ListResponseSchema(item),
    EmptyResponseSchema,
    ErrorResponseSchema,
  ]);

// ===== Request Schema Helper =====

/**
 * Create a typed request schema that validates params, body, and query
 * All fields are required to be present but may have empty/default objects
 */
export const createRequestSchema = <
  P extends z.ZodTypeAny,
  B extends z.ZodTypeAny,
  Q extends z.ZodTypeAny,
>(options?: {
  params?: P;
  body?: B;
  query?: Q;
}): z.ZodType<RequestSchema> => {
  return z.object({
    params: options?.params || z.object({}).strict(),
    body: options?.body || z.undefined(),
    query: options?.query || z.object({}),
  }) as any;
};

export type RequestSchema<
  P = Record<string, any>,
  B = Record<string, any>,
  Q = Record<string, any>,
> = {
  params: P;
  body: B;
  query: Q;
};

export interface baseQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
}

export type ExtendedQueryParams<T> = baseQueryParams & T;
