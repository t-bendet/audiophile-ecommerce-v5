import { describe, expect, it } from "vitest";
import { ErrorCode, ErrorObjectSchema, getStatusCode } from "../src/index.js";

// The error envelope is closed over the enum - `ErrorObjectSchema.code` is
// `z.enum(ErrorCode)` - so a rate-limit rejection could not be expressed as an
// `ErrorResponse` at all until `TOO_MANY_REQUESTS` existed. These pin both
// halves: the status mapping, and the envelope actually accepting the code.

describe("TOO_MANY_REQUESTS", () => {
  it("maps to 429", () => {
    expect(getStatusCode(ErrorCode.TOO_MANY_REQUESTS)).toBe(429);
  });

  it("is accepted by the error envelope", () => {
    const parsed = ErrorObjectSchema.safeParse({
      code: ErrorCode.TOO_MANY_REQUESTS,
      message: "Too many requests",
      statusCode: 429,
    });

    expect(parsed.success).toBe(true);
  });
});

// The status for a rejected input is a cross-package contract: the server
// middleware, the client's own Zod handling and every validation doc read it
// off this map, so a silent edit here would split them apart again.

describe("VALIDATION_ERROR", () => {
  it("maps to 422", () => {
    expect(getStatusCode(ErrorCode.VALIDATION_ERROR)).toBe(422);
  });

  it("is accepted by the error envelope", () => {
    const parsed = ErrorObjectSchema.safeParse({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Validation failed: 1 error(s)",
      statusCode: getStatusCode(ErrorCode.VALIDATION_ERROR),
    });

    expect(parsed.success).toBe(true);
  });
});
