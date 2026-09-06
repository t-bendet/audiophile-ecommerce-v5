import { AppError, ErrorCode } from "@repo/domain";

const isErrorNamed = (err: unknown, name: string): err is Error =>
  err instanceof Error && err.name === name;

export const isJwtExpiredError = (err: unknown): boolean =>
  isErrorNamed(err, "TokenExpiredError");

export const isJwtError = (err: unknown): err is Error =>
  isErrorNamed(err, "JsonWebTokenError") || isJwtExpiredError(err);

/** The AppError a raw `jsonwebtoken` rejection stands for. */
export const toJwtAppError = (err: unknown): AppError =>
  isJwtExpiredError(err)
    ? new AppError(
        "Your token has expired! Please log in again.",
        ErrorCode.TOKEN_EXPIRED,
      )
    : new AppError(
        "Invalid token. Please log in again!",
        ErrorCode.INVALID_TOKEN,
      );
