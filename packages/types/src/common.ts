import z from "zod";
import { IdValidator } from "./validators.js";

// ** Common Types (single field types and interfaces - TCategoryName)

// Common Param Types

// Common schemas(get,create, update, delete)

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

// params is used on controllers
// schema is used on routes middlewares

// on front end we need the body,response and params for each request

// PostCategorySchema
// PostCategoryInput
// PostCategoryResult
// PostCategoryParams (not sure all of this is needed in general types,consider moving to server/web only if needed)

// Common
// GetByIdSchema → GetByIdParams

// Product
// GetProductBySlugSchema → GetProductBySlugParams
// GetProductsByCategorySchema → GetProductsByCategoryParams

// User
// CreateUserSchema → CreateUserInput
// UpdateUserDetailsSchema → UpdateUserDetailsInput
// UpdateUserPasswordSchema → UpdateUserPasswordInput

// Auth (special case - use domain verbs)
// LoginUserSchema → LoginUserInput  // ✅ (not GetUser - login is the action)
