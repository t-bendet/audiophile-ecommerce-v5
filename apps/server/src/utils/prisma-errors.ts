import { Prisma } from "@repo/database";

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
