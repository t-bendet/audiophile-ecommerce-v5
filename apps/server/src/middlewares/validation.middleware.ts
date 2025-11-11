import { ZodSchema } from "zod";
import { RequestHandler } from "express";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";

// * Middleware to validate request body against a Zod schema

export const validateSchema = (schema: ZodSchema): RequestHandler =>
  catchAsync(async (req, _res, next) => {
    const parsedRequest = schema.safeParse({
      params: req.params,
      body: req.body,
      query: req.query,
    });

    if (!parsedRequest.success) {
      const message = `Unprocessable Content.The following variables are missing or invalid:
    ${Object.entries(parsedRequest.error.flatten().fieldErrors)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n")}
      `;
      return next(new AppError(message.trim(), 422));
    }
    return next();
  });
