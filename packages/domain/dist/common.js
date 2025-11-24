import { z } from "zod";
import { IdValidator } from "@repo/validators";
export const GetByIdSchema = z.object({
    params: z
        .object({
        id: IdValidator(),
    })
        .strict(),
});
