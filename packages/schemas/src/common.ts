import z from "zod";
import { IdValidator } from "./validators.js";

export const GetByIdSchema = z.object({
  params: z
    .object({
      id: IdValidator(),
    })
    .strict(),
});

export type GetByIdParams = z.infer<typeof GetByIdSchema>["params"];

// Align with REST/CRUD operations:
// GET    → Get (retrieve single/multiple)
// POST   → Create
// PUT    → Update (full replacement)
// PATCH  → Update (partial)
// DELETE → Delete

// Pattern:

// Schema: <Verb><Entity>[By<Field>]Schema
// Params: <Verb><Entity>[By<Field>]Params
// Body Input: <Verb><Entity>Input
// GetProductBySlugSchema → GetProductBySlugParams

// on server params is used on controllers
// on server schema is used on routes middlewares
// on front end we need the body,response and params for each request

// CreateCategorySchema
// CreateCategoryInput
// CreateCategoryResult
// CreateCategoryParams (not sure all of this is needed in general types,consider moving to server/web only if needed)

// Auth (special case - use domain verbs)
// LoginUserSchema → LoginUserInput  // ✅ (not GetUser - login is the action)
