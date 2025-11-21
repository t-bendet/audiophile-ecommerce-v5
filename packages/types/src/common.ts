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

export type getByIdParams = z.infer<typeof GetByIdSchema>["params"];

// params is used on controllers
// schema is used on routes middlewares

// types (input / output, create, read, update, delete)
