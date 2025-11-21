import z from "zod";
import { IdValidator } from "./validators.js";
// Common schemas(get,create, update, delete)
export const GetByIdSchema = z.object({
    params: z
        .object({
        id: IdValidator(),
    })
        .strict(),
});
// types (input / output, create, read, update, delete)
