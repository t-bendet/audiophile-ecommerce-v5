import { ErrorCode } from "@repo/domain";
import { describe, expect, it } from "vitest";
import {
  isBodyParserError,
  toBodyParserAppError,
} from "../src/utils/body-parser-errors.js";

describe("body parser errors", () => {
  it.each([
    "entity.parse.failed",
    "request.aborted",
    "entity.verify.failed",
    "encoding.unsupported",
    "charset.unsupported",
  ])("converts %s without exposing its message", (type) => {
    const error = Object.assign(new Error("private fragment"), { type });
    expect(isBodyParserError(error)).toBe(true);
    if (!isBodyParserError(error))
      throw new Error("Expected body parser error");
    expect(toBodyParserAppError(error)).toMatchObject({
      code: ErrorCode.INVALID_BODY,
      statusCode: 400,
      message: "Request body is invalid",
      isOperational: true,
    });
  });

  it("leaves unknown error types alone", () => {
    expect(
      isBodyParserError(
        Object.assign(new Error("unexpected"), { type: "unknown" }),
      ),
    ).toBe(false);
  });
});
