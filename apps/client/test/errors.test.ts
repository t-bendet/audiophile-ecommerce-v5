import { ErrorCode, ErrorResponse, getStatusCode } from "@repo/domain";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { normalizeError, processAxiosError } from "../src/lib/errors/errors";

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
