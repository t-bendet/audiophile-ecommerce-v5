import { ErrorCode } from "@repo/domain";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";
import { env } from "../src/utils/env.js";

describe("request body errors", () => {
  it("returns a safe 413 envelope without a stack in production", async () => {
    const previousEnv = env.NODE_ENV;
    env.NODE_ENV = "production";
    try {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ password: "secret".repeat(2000) });

      expect(res.status).toBe(413);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: {
          code: ErrorCode.PAYLOAD_TOO_LARGE,
          message: "Request body exceeds 10kb",
          statusCode: 413,
          requestId: res.headers["x-request-id"],
        },
      });
      expect(res.headers["x-request-id"]).toBeTruthy();
      expect(res.body.error.stack).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain("secret");
    } finally {
      env.NODE_ENV = previousEnv;
    }
  });

  it("returns a safe 400 for malformed JSON", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send('{"password":"private fragment"');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.INVALID_BODY,
      statusCode: 400,
    });
    expect(JSON.stringify(res.body)).not.toContain("private fragment");
  });

  it("keeps valid JSON with invalid fields as a 422 validation error", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bad" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });
});
