import type { Prisma, Config as PrismaConfig } from "@repo/database";
import { z } from "zod";
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
export type ConfigCreateInput = Prisma.ConfigCreateInput;
export type ConfigUpdateInput = Prisma.ConfigUpdateInput;
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
      featuredProduct: IdValidator("Featured Product"),
      showCaseProducts: ConfigShowCaseProductsSchema,
    })
    .strict() satisfies z.Schema<ConfigCreateInput>,
});

// UPDATE - Update existing config (partial)
export const ConfigUpdateByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("Config") }).strict(),
  body: z
    .object({
      name: NameValidator("Config").optional(),
      featuredProduct: IdValidator("Featured Product").optional(),
      showCaseProducts: ConfigShowCaseProductsSchema.optional(),
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
  createdAt: z.date(),
  v: z.number(),
  featuredProduct: IdValidator("Featured Product"),
  showCaseProducts: ConfigShowCaseProductsSchema,
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
