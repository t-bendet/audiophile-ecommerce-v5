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

// ===== Generic Response Schemas & Types =====

// Meta schema for paginated list responses
export const MetaSchema = z.object({
  page: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export type Meta = z.infer<typeof MetaSchema>;

// Success response for single item (GET, CREATE, UPDATE)
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    status: z.literal("success"),
    data: item,
  });

export type SuccessResponse<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof SuccessResponseSchema<T>>
>;

// Success response for list of items (LIST)
export const ListResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    status: z.literal("success"),
    data: z.array(item),
    meta: MetaSchema,
  });

export type ListResponse<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof ListResponseSchema<T>>
>;

// Success response for delete operations (DELETE)
export const DeleteResponseSchema = z.object({
  status: z.literal("success"),
  data: z.null(),
});

export type DeleteResponse = z.infer<typeof DeleteResponseSchema>;

// Error response schema
export const ErrorResponseSchema = z.object({
  status: z.enum(["error", "fail"]),
  message: z.string(),
  stack: z.string().optional(), // Only in development
  error: z.any().optional(), // Only in development
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ===== Discriminated Union for API Responses =====

/**
 * Discriminated union for all API responses.
 * TypeScript can narrow the type based on the `status` field.
 *
 * @example
 * ```typescript
 * function handleResponse(response: ApiResponse<User>) {
 *   if (response.status === "success") {
 *     console.log(response.data); // TypeScript knows `data` exists
 *   } else {
 *     console.error(response.message); // TypeScript knows `message` exists
 *   }
 * }
 * ```
 */
export type ApiResponse<T = unknown> =
  | { status: "success"; data: T }
  | { status: "success"; data: T[]; meta: Meta }
  | { status: "success"; data: null }
  | { status: "error" | "fail"; message: string; stack?: string; error?: any };

/**
 * Type guard to check if a response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is Extract<ApiResponse<T>, { status: "success" }> {
  return response.status === "success";
}

/**
 * Type guard to check if a response is an error
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is Extract<ApiResponse<T>, { status: "error" | "fail" }> {
  return response.status === "error" || response.status === "fail";
}

/**
 * Type guard to check if a success response contains a list (has meta)
 */
export function isListResponse<T>(
  response: ApiResponse<T>
): response is Extract<ApiResponse<T>, { status: "success"; meta: Meta }> {
  return response.status === "success" && "meta" in response;
}

/**
 * Type guard to check if a success response is a single item
 */
export function isSingleItemResponse<T>(
  response: ApiResponse<T>
): response is Extract<ApiResponse<T>, { status: "success"; data: T }> {
  return (
    response.status === "success" &&
    !("meta" in response) &&
    response.data !== null
  );
}

// Zod schema for the discriminated union
export const ApiResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.discriminatedUnion("status", [
    SuccessResponseSchema(item),
    ListResponseSchema(item),
    DeleteResponseSchema,
    ErrorResponseSchema,
  ]);
