import { RequestHandler } from "express";
import { ZodType, prettifyError } from "zod";
import { ErrorCode } from "@repo/domain";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

// * Middleware to validate request body against a Zod schema

export const validateSchema = (schema: ZodType): RequestHandler =>
  catchAsync(async (req, _res, next) => {
    const parsedRequest = schema.safeParse({
      params: req.params,
      body: req.body,
      query: req.query,
    });

    if (!parsedRequest.success) {
      const message = `Unprocessable Content.The following variables are missing or invalid:
      ${prettifyError(parsedRequest.error)}`;
      return next(new AppError(message, ErrorCode.VALIDATION_ERROR));
    }
    return next();
  });
