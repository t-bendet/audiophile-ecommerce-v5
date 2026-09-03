import { describe, expect, it } from "vitest";
import { AppError, createErrorResponse, ErrorCode } from "../src/index.js";

// `isOperational` separates a fault the caller caused from a bug of ours, so
// the log severity of an error no longer has to be read off its status code.
// It is a server-side signal: the error envelope must never carry it.

describe("AppError.isOperational", () => {
  it("defaults to true", () => {
    expect(new AppError("nope", ErrorCode.NOT_FOUND).isOperational).toBe(true);
  });

  it("can be constructed false", () => {
    const err = new AppError(
      "bad query",
      ErrorCode.VALIDATION_ERROR,
      undefined,
      undefined,
      false,
    );

    expect(err.isOperational).toBe(false);
  });

  it("is not serialized into the error envelope", () => {
    const err = new AppError("nope", ErrorCode.NOT_FOUND);

    const response = createErrorResponse({
      message: err.message,
      code: err.code,
      details: err.details,
      statusCode: err.statusCode,
    });

    expect(JSON.stringify(response)).not.toContain("isOperational");
  });
});
