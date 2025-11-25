import Z from "zod";
import { RequestHandler } from "express";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

// * Middleware to validate request body against a Zod schema

export const validateSchema = (schema: Z.ZodSchema): RequestHandler =>
  catchAsync(async (req, _res, next) => {
    console.log("object");
    const parsedRequest = schema.safeParse({
      params: req.params,
      body: req.body,
      query: req.query,
    });

    if (!parsedRequest.success) {
      const message = `Unprocessable Content.The following variables are missing or invalid:"\n"${Z.prettifyError(parsedRequest.error)}`;
      return next(new AppError(message.trim(), 422));
    }
    return next();
  });
