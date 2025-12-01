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
export const MetaSchema = z.object({
  page: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export const ListResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: z.array(item), meta: MetaSchema });

export type Meta = z.infer<typeof MetaSchema>;
export type ListResponse<T> = { data: T[]; meta: Meta };
