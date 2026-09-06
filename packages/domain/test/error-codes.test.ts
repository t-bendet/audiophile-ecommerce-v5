import { describe, expect, it } from "vitest";
import {
  ERROR_CODE_TO_STATUS,
  ErrorCode,
  ErrorObjectSchema,
  getStatusCode,
} from "../src/index.js";

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

// The map is typed `Record<ErrorCode, number>`, so the compiler catches a
// missing row - this pins the other direction, that no stale row outlives the
// member it was written for, and that every status is a real HTTP failure.

describe("ERROR_CODE_TO_STATUS", () => {
  it("covers every ErrorCode member and nothing else", () => {
    expect(Object.keys(ERROR_CODE_TO_STATUS).sort()).toEqual(
      Object.values(ErrorCode).sort(),
    );
  });

  it("maps every code to an HTTP error status", () => {
    for (const [code, status] of Object.entries(ERROR_CODE_TO_STATUS)) {
      expect(status, code).toBeGreaterThanOrEqual(400);
      expect(status, code).toBeLessThanOrEqual(599);
    }
  });
});
