import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { Prisma } from "@repo/database";
import AppError from "../utils/appError";
import { env } from "../utils/env";

// TODO refactor response structure,so we need status ?,reshape the error object for a normal error response
// https://www.youtube.com/watch?v=T4Q1NvSePxs
// (e.g., "warning", "partial").

const handleCastErrorDB = (err: Prisma.PrismaClientKnownRequestError) => {
  const message = `${err.meta?.message}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: Prisma.PrismaClientKnownRequestError) => {
  const message = `Duplicate field value: ${err.meta?.target}. Please use another value!`;
  return new AppError(message, 400);
};

const handleMissingDocumentDB = (err: Prisma.PrismaClientKnownRequestError) => {
  // for unhandled non-existing document
  const message = `No matching ${err.meta?.modelName ?? "document"} was found`;
  return new AppError(message, 404);
};

const handleValidationErrorDB = (err: Error) => {
  // ** should get caught by zod before this point
  const message = `Invalid query data. -  Unprocessable Content`;
  return new AppError(message, 422);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const sendErrorDev = (err: any, _req: Request, res: Response) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (
  err: AppError | unknown,
  _req: Request,
  res: Response
) => {
  // A) Operational, trusted error: send message to client
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error("ERROR 💥", err);
  // 2) Send generic message
  return res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};

export default (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (env.NODE_ENV === "development") {
    //* don't really need to check type for dev?
    sendErrorDev(err, req, res);
  } else if (env.NODE_ENV === "production") {
    let error: AppError | null = null;

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2023") error = handleCastErrorDB(err); // PrismaClientKnownRequestError
      if (err.code === "P2002") error = handleDuplicateFieldsDB(err); // PrismaClientKnownRequestError
      if (err.code === "P2025") error = handleMissingDocumentDB(err); // PrismaClientKnownRequestError
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
      error = handleValidationErrorDB(err); // PrismaClientValidationError
    }
    if (err instanceof JsonWebTokenError) {
      if (err.name === "JsonWebTokenError") error = handleJWTError();
    }
    if (err instanceof TokenExpiredError) {
      if (err.name === "TokenExpiredError") error = handleJWTExpiredError();
    }
    if (err instanceof AppError) {
      error = err;
    }

    sendErrorProd(error || err, req, res);
  }
};

//* if we pass 4 parameters express will recognize
//* this as a Error handling  middleware
