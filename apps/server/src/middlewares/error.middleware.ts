import { Prisma } from "@repo/database";
import { AppError, createErrorResponse, ErrorCode } from "@repo/domain";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../utils/env.js";

// ------------------ Specific Error Handlers ------------------

const handleCastErrorDB = (err: Prisma.PrismaClientKnownRequestError) => {
  const message = `${err.meta?.message}`;
  return new AppError(message, ErrorCode.INVALID_ID);
};

const handleDuplicateFieldsDB = (err: Prisma.PrismaClientKnownRequestError) => {
  const message = `Duplicate field value: ${err.meta?.target}. Please use another value!`;
  return new AppError(message, ErrorCode.DUPLICATE_ENTRY);
};

const handleMissingDocumentDB = (err: Prisma.PrismaClientKnownRequestError) => {
  // for unhandled non-existing document
  const message = `No matching ${err.meta?.modelName ?? "document"} was found`;
  return new AppError(message, ErrorCode.NOT_FOUND);
};

const handleValidationErrorDB = (err: Error) => {
  // ** should get caught by zod before this point
  const message = `Invalid query data. -  Unprocessable Content`;
  return new AppError(message, ErrorCode.VALIDATION_ERROR);
};

// safety net for unexpected zod errors
const handleZodError = (err: ZodError) => {
  const message = `Validation failed: ${err.issues.length} error(s)`;

  // Parse Zod issues into structured details
  const details = err.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path.length > 0 ? issue.path.map(String) : undefined,
  }));

  return new AppError(message, ErrorCode.VALIDATION_ERROR, undefined, details);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", ErrorCode.INVALID_TOKEN);

const handleJWTExpiredError = () =>
  new AppError(
    "Your token has expired! Please log in again.",
    ErrorCode.TOKEN_EXPIRED
  );

// ------------------ Type guards ------------------
const isPrismaKnownRequestError = (
  err: unknown
): err is Prisma.PrismaClientKnownRequestError => {
  return (
    typeof err === "object" &&
    err !== null &&
    ("code" in err || (err as any).name === "PrismaClientKnownRequestError")
  );
};

const isPrismaValidationError = (
  err: unknown
): err is Prisma.PrismaClientValidationError => {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as any).name === "PrismaClientValidationError"
  );
};

const isJwtExpiredError = (err: unknown): boolean => {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as any).name === "TokenExpiredError"
  );
};

const isJwtError = (err: unknown): err is Error => {
  return (
    typeof err === "object" &&
    err !== null &&
    ((err as any).name === "JsonWebTokenError" ||
      (err as any).name === "TokenExpiredError")
  );
};

const isZodError = (err: unknown): err is ZodError => {
  return err instanceof ZodError;
};
// -------------------------------------------------

/**
 * Convert known error types to AppError
 * Returns the original error if it's already an AppError or unknown type
 */
const normalizeError = (err: unknown): AppError | unknown => {
  // Already an AppError - use as is
  if (err instanceof AppError) {
    return err;
  }

  // Zod validation errors
  if (isZodError(err)) {
    return handleZodError(err);
  }

  // Prisma errors
  if (isPrismaKnownRequestError(err)) {
    if (err.code === "P2023") return handleCastErrorDB(err);
    if (err.code === "P2002") return handleDuplicateFieldsDB(err);
    if (err.code === "P2025") return handleMissingDocumentDB(err);
  }

  if (isPrismaValidationError(err)) {
    return handleValidationErrorDB(err);
  }

  // JWT errors
  if (isJwtError(err)) {
    return isJwtExpiredError(err) ? handleJWTExpiredError() : handleJWTError();
  }

  // Unknown error type - return as is
  return err;
};

const sendErrorDev = (err: unknown, _req: Request, res: Response) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = (
    err instanceof AppError ? err.code : ErrorCode.INTERNAL_ERROR
  ) as ErrorCode;
  const message = err instanceof Error ? err.message : "Unknown error";
  const stack = err instanceof Error ? err.stack : undefined;
  const details = err instanceof AppError ? err.details : undefined;

  return res.status(statusCode).json(
    createErrorResponse(message, {
      code,
      stack,
      details,
    })
  );
};

const sendErrorProd = (err: unknown, _req: Request, res: Response) => {
  // Operational, trusted error: send message to client
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      createErrorResponse(err.message, {
        code: err.code,
        details: err.details,
      })
    );
  }

  // Programming or other unknown error: don't leak error details
  console.error("ERROR 💥", err);
  return res.status(500).json(
    createErrorResponse("Something went very wrong!", {
      code: ErrorCode.INTERNAL_ERROR,
    })
  );
};

export default (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Convert known error types to AppError
  const normalizedError = normalizeError(err);

  // Send appropriate response based on environment
  if (env.NODE_ENV === "development") {
    return sendErrorDev(normalizedError, req, res);
  }

  return sendErrorProd(normalizedError, req, res);
};

//* if we pass 4 parameters express will recognize
//* this as a Error handling  middleware
