import { Prisma } from "@repo/database";

const RECORD_NOT_FOUND = "P2025";
const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

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

export const isUniqueConstraintError = (
  err: unknown,
): err is Prisma.PrismaClientKnownRequestError =>
  isPrismaKnownRequestError(err) && err.code === UNIQUE_CONSTRAINT_VIOLATION;
