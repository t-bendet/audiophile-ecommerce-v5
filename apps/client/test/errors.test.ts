import {
  AppError,
  ErrorCode,
  ErrorResponse,
  getStatusCode,
} from "@repo/domain";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  isAuthError,
  isCriticalError,
  normalizeError,
  processAxiosError,
} from "../src/lib/errors/errors";

// The same rejection can be produced by the API or by a schema parse in the
// browser. Both have to carry one status, or a form would branch differently
// depending on where the input happened to be checked.

const VALIDATION_STATUS = getStatusCode(ErrorCode.VALIDATION_ERROR);

const axiosValidationError = () => {
  const body: ErrorResponse = {
    success: false,
    timestamp: new Date().toISOString(),
    data: null,
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      message: "Validation failed: 1 error(s)",
      statusCode: VALIDATION_STATUS,
      details: [
        { code: "invalid_type", message: "Required", path: ["body", "name"] },
      ],
    },
  };

  const error = new AxiosError<ErrorResponse>(
    "Request failed",
    "ERR_BAD_REQUEST",
  );
  error.response = {
    data: body,
    status: VALIDATION_STATUS,
    statusText: "",
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };

  return error;
};

describe("client validation errors", () => {
  it("mirrors the status the server put in the body", () => {
    const axiosError = axiosValidationError();

    const appError = processAxiosError(axiosError);

    expect(appError.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(appError.statusCode).toBe(
      axiosError.response?.data.error.statusCode,
    );
    expect(appError.statusCode).toBe(VALIDATION_STATUS);
  });

  it("gives a client-side ZodError the same status as a server-side one", () => {
    const zodError = z
      .object({ name: z.string() })
      .safeParse({ name: 1 }).error;

    const clientSide = normalizeError(zodError);
    const serverSide = normalizeError(axiosValidationError());

    expect(clientSide.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(clientSide.statusCode).toBe(serverSide.statusCode);
    expect(clientSide.statusCode).toBe(VALIDATION_STATUS);
  });
});

// A dead session and a rejected login are both 401s, but only one of them is
// fixed by signing in again. The two predicates have to disagree about them.

describe("auth errors", () => {
  it.each([
    ErrorCode.UNAUTHORIZED,
    ErrorCode.INVALID_TOKEN,
    ErrorCode.TOKEN_EXPIRED,
  ])("treats %s as an auth error, not a critical one", (code) => {
    const error = new AppError("dead session", code);

    expect(isAuthError(error)).toBe(true);
    expect(isCriticalError(error)).toBe(false);
  });

  it("leaves INVALID_CREDENTIALS to the login form", () => {
    const error = new AppError(
      "Invalid email or password",
      ErrorCode.INVALID_CREDENTIALS,
    );

    expect(isAuthError(error)).toBe(false);
    expect(isCriticalError(error)).toBe(false);
  });

  it.each([ErrorCode.INTERNAL_ERROR, ErrorCode.EXTERNAL_SERVICE_ERROR])(
    "keeps %s critical and not an auth error",
    (code) => {
      const error = new AppError("boom", code);

      expect(isCriticalError(error)).toBe(true);
      expect(isAuthError(error)).toBe(false);
    },
  );

  it("does not treat a 404 as either", () => {
    const error = new AppError("nope", ErrorCode.NOT_FOUND);

    expect(isAuthError(error)).toBe(false);
    expect(isCriticalError(error)).toBe(false);
  });
});
