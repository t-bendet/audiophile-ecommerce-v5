import { ErrorCode } from "@repo/domain";
import { RequestHandler } from "express";
import { ZodType } from "zod";
import { AppError } from "@repo/domain";
import catchAsync from "../utils/catchAsync.js";
import { zodIssuesToDetails } from "../utils/zodDetails.js";

// * Middleware to validate request (params, body, query) against a Zod schema

export const validateSchema = (schema: ZodType<any>): RequestHandler =>
  catchAsync(async (req, _res, next) => {
    const parsedRequest = schema.safeParse({
      params: req.params,
      body: req.body,
      query: req.query,
    });

    if (!parsedRequest.success) {
      const message = `Validation failed: ${parsedRequest.error.issues.length} error(s)`;
      const details = zodIssuesToDetails(parsedRequest.error);

      return next(
        new AppError(message, ErrorCode.VALIDATION_ERROR, undefined, details),
      );
    }

    req.verified = parsedRequest.data;

    return next();
  });
