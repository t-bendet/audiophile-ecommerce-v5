import { Request } from "express";
import { ZodType, z } from "zod";

// Narrows `req.verified` to the type inferred from the route's request schema.
export type ValidatedRequest<S extends ZodType> = Request & {
  verified: z.infer<S>;
};
