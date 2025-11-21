import z from "zod";
import { IdValidator } from "./validators.js";

// TODO common.schema export only(params body and query)
// TODO. common.types export only(types and interfaces)
// TODO  common.validators export only(single field validators)
// TODO go over all of schemas ant types folder structure and refactor them accordingly baaaahahahh

// ** Common Validators (single field validators)

// ** Common Types (single field types and interfaces - TCategoryName)

// Common Param Types

export type getByIdParams = z.infer<typeof GetByIdSchema>["params"];

// Common schemas(get,create, update, delete)

export const GetByIdSchema = z.object({
  params: z
    .object({
      id: IdValidator(),
    })
    .strict(),
});

// types (input / output, create, read, update, delete)
