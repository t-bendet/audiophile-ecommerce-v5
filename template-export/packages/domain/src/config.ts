import type { Prisma, Config as PrismaConfig } from "@repo/database";
import { string, z } from "zod";
import type {
  EmptyResponse,
  ListResponse,
  SingleItemResponse,
} from "./common.js";
import {
  createRequestSchema,
  EmptyResponseSchema,
  ListResponseSchema,
  SingleItemResponseSchema,
} from "./common.js";
import { IdValidator, NameValidator } from "./shared.js";

// * ===== Database Type Re-exports (Service Generics )=====

export type Config = PrismaConfig;
export type ConfigCreateInput = Prisma.ConfigUncheckedCreateInput;
export type ConfigUpdateInput = Prisma.ConfigUncheckedUpdateInput;
export type ConfigWhereInput = Prisma.ConfigWhereInput;
export type ConfigSelect = Prisma.ConfigSelect;
export type ConfigScalarFieldEnum = Prisma.ConfigScalarFieldEnum;

// *  ===== Entity Specific Types =====

export type ConfigDTO = Config;

// * =====  Common Schemas =====

export const ConfigShowCaseProductsSchema = z.object({
  cover: IdValidator("ShowcaseCover Product"),
  wide: IdValidator("ShowcaseWide Product"),
  grid: IdValidator("ShowcaseGrid Product"),
});

// * ===== RequestSchemas =====
// GET - Get single config by ID
export const ConfigGetUniqueRequestSchema = createRequestSchema({
  params: z.object().strict(),
});

// GET - Get single config by ID
export const ConfigGetByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Config") }).strict(),
});

// CREATE - Create new config
export const ConfigCreateRequestSchema = createRequestSchema({
  body: z
    .object({
      name: NameValidator("Config"),
      featuredProductId: IdValidator("Featured Product"),
      showCaseCoverId: string("ShowcaseCover Product"),
      showCaseWideId: string("ShowcaseWide Product"),
      showCaseGridId: string("ShowcaseGrid Product"),
    })
    .strict() satisfies z.Schema<ConfigCreateInput>,
});

// UPDATE - Update existing config (partial)
export const ConfigUpdateByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Config") }).strict(),
  body: z
    .object({
      name: NameValidator("Config").optional(),
      featuredProductId: IdValidator("Featured Product").optional(),
      showCaseCoverId: IdValidator("ShowcaseCover Product").optional(),
      showCaseWideId: IdValidator("ShowcaseWide Product").optional(),
      showCaseGridId: IdValidator("ShowcaseGrid Product").optional(),
    })
    .strict() satisfies z.ZodType<ConfigUpdateInput>,
});

// DELETE - Delete config by ID
export const ConfigDeleteByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Config") }).strict(),
});

// * =====  DTO Schemas ( base and others if needed)=====

export const ConfigDTOSchema = z.object({
  id: IdValidator("Config"),
  name: z.string(),
  createdAt: z.coerce.date(),
  v: z.number(),
  featuredProductId: IdValidator("Featured Product"),
  showCaseCoverId: string("ShowcaseCover Product"),
  showCaseWideId: string("ShowcaseWide Product"),
  showCaseGridId: string("ShowcaseGrid Product"),
}) satisfies z.ZodType<Config>;

// * =====   Response Schemas & Types ( For Frontend)=====

// List response (array + pagination)
export const ConfigGetAllResponseSchema = ListResponseSchema(ConfigDTOSchema);
export type ConfigGetAllResponse = ListResponse<Config>;

// Detail/Get response (single DTO)
export const ConfigGetByIdResponseSchema =
  SingleItemResponseSchema(ConfigDTOSchema);
export type ConfigGetByIdResponse = SingleItemResponse<Config>;

// Create response (single DTO)
export const ConfigCreateResponseSchema =
  SingleItemResponseSchema(ConfigDTOSchema);
export type ConfigCreateResponse = SingleItemResponse<Config>;

// Update response (single DTO)
export const ConfigUpdateByIdResponseSchema =
  SingleItemResponseSchema(ConfigDTOSchema);
export type ConfigUpdateByIdResponse = SingleItemResponse<Config>;

// Delete response (no content)
export const ConfigDeleteByIdResponseSchema = EmptyResponseSchema;
export type ConfigDeleteByIdResponse = EmptyResponse;
