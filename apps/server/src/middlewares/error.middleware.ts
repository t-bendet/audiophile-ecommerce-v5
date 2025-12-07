import { Prisma } from "@repo/database";
import { createErrorResponse, ErrorCode } from "@repo/domain";
import { NextFunction, Request, Response } from "express";
import { prettifyError, ZodError } from "zod";
import AppError from "../utils/appError.js";
import { env } from "../utils/env.js";

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

const handleZodError = (err: ZodError) => {
  const message = `Unprocessable Content.The following variables are missing or invalid:
      ${prettifyError(err)}`;
  return new AppError(message, ErrorCode.VALIDATION_ERROR);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", ErrorCode.INVALID_TOKEN);

const handleJWTExpiredError = () =>
  new AppError(
    "Your token has expired! Please log in again.",
    ErrorCode.TOKEN_EXPIRED
  );

const sendErrorDev = (err: any, _req: Request, res: Response) => {
  err.statusCode = err.statusCode || 500;
  return res.status(err.statusCode).json(
    createErrorResponse(err.message, {
      code: err.code || err.statusCode?.toString(),
      stack: err.stack,
    })
  );
};

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

const isJwtError = (err: unknown): err is Error => {
  return (
    typeof err === "object" &&
    err !== null &&
    ((err as any).name === "JsonWebTokenError" ||
      (err as any).name === "TokenExpiredError")
  );
};

const isJwtExpiredError = (err: unknown): boolean => {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as any).name === "TokenExpiredError"
  );
};

const isZodError = (err: unknown): err is ZodError => {
  return err instanceof ZodError;
};
// -------------------------------------------------

const sendErrorProd = (err: unknown, _req: Request, res: Response) => {
  // A) Operational, trusted error: send message to client
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json(
      createErrorResponse(err.message, {
        code: err.code,
      })
    );
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error("ERROR 💥", err);
  // 2) Send generic message
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
  if (env.NODE_ENV === "development") {
    // show full error for development
    sendErrorDev(err as any, req, res);
    return;
  }

  if (env.NODE_ENV === "production") {
    let error: AppError | null = null;

    if (isZodError(err)) {
      error = handleZodError(err);
    }

    if (isPrismaKnownRequestError(err)) {
      if (err.code === "P2023") error = handleCastErrorDB(err);
      if (err.code === "P2002") error = handleDuplicateFieldsDB(err);
      if (err.code === "P2025") error = handleMissingDocumentDB(err);
    }

    if (isPrismaValidationError(err)) {
      error = handleValidationErrorDB(err);
    }

    if (isJwtError(err)) {
      if (isJwtExpiredError(err)) error = handleJWTExpiredError();
      else error = handleJWTError();
    }

    if (err instanceof AppError) {
      error = err;
    }

    sendErrorProd(error || err, req, res);
  }
};

//* if we pass 4 parameters express will recognize
//* this as a Error handling  middleware
