import { Prisma } from "@repo/database";

/**
 * Prisma reports "the row you targeted does not exist" as P2025, which is how
 * update and delete tell a missing id apart from a real failure.
 */
const RECORD_NOT_FOUND = "P2025";

export const isPrismaKnownRequestError = (
  err: unknown,
): err is Prisma.PrismaClientKnownRequestError =>
  err instanceof Error &&
  err.name === "PrismaClientKnownRequestError" &&
  "code" in err;

export const isPrismaValidationError = (
  err: unknown,
): err is Prisma.PrismaClientValidationError =>
  err instanceof Error && err.name === "PrismaClientValidationError";

export const isRecordNotFoundError = (err: unknown): boolean =>
  isPrismaKnownRequestError(err) && err.code === RECORD_NOT_FOUND;
