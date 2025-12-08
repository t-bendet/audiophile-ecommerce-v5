import { RequestHandler } from "express";
import { ZodType } from "zod";
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
      const message = `Validation failed: ${parsedRequest.error.issues.length} error(s)`;

      // Parse Zod issues into structured details
      const details = parsedRequest.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path.length > 0 ? issue.path.map(String) : undefined,
      }));

      return next(
        new AppError(message, ErrorCode.VALIDATION_ERROR, undefined, details)
      );
    }
    return next();
  });
