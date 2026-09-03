import { NextFunction, RequestHandler, Response } from "express";
import { ZodType } from "zod";
import { validateSchema } from "../middlewares/validation.middleware.js";
import { ValidatedRequest } from "../types/validated-request.js";
import catchAsync from "./catchAsync.js";

export type ValidatedHandler = readonly [RequestHandler, RequestHandler];

// Binds a schema to the handler that reads it, so the two cannot drift.
export const defineHandler = <S extends ZodType>(
  schema: S,
  fn: (
    req: ValidatedRequest<S>,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): ValidatedHandler => [validateSchema(schema), catchAsync(fn)];
