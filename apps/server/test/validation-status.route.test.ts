import { ErrorCode, getStatusCode } from "@repo/domain";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import app from "../src/app.js";
import globalErrorHandler from "../src/middlewares/error.middleware.js";

// One status for every rejected input, whichever part of the request carried
// it. These assert against the map rather than a literal so the wire can never
// drift from `ERROR_CODE_TO_STATUS`; the literal itself is pinned in the
// domain package.

const VALIDATION_STATUS = getStatusCode(ErrorCode.VALIDATION_ERROR);

// The safety net only fires for a ZodError that never went through
// `validateSchema`, which no real route can produce on purpose.
const appThatThrows = (fail: () => never) => {
  const throwing = express();
  throwing.get("/boom", () => fail());
  throwing.use(globalErrorHandler);
  return throwing;
};

describe("validation errors share one status", () => {
  it("rejects a malformed path param", async () => {
    const res = await request(app).get("/api/v1/products/not-an-id");

    expect(res.status).toBe(VALIDATION_STATUS);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: VALIDATION_STATUS,
      },
    });
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it("rejects an unknown field in a strict body schema", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "test-password-123",
      passwordConfirm: "test-password-123",
      role: "ADMIN",
    });

    expect(res.status).toBe(VALIDATION_STATUS);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: VALIDATION_STATUS,
        details: [{ code: "unrecognized_keys", path: ["body", "role"] }],
      },
    });
  });

  it("rejects a ZodError that escaped the validation middleware", async () => {
    const zodError = z.object({ name: z.string() }).safeParse({}).error!;

    const res = await request(
      appThatThrows(() => {
        throw zodError;
      }),
    ).get("/boom");

    expect(res.status).toBe(VALIDATION_STATUS);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: VALIDATION_STATUS,
        details: [{ path: ["name"] }],
      },
    });
  });

  it("rejects an invalid query value on a list route", async () => {
    const res = await request(app).get("/api/v1/products?limit=abc");

    expect(res.status).toBe(VALIDATION_STATUS);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: VALIDATION_STATUS,
        details: [{ path: ["query", "limit"] }],
      },
    });
  });
});
