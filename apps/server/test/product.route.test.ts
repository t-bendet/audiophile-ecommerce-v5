import { ErrorCode } from "@repo/domain";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";

// Exercises the real Express app end to end without a database: the malformed
// id is rejected by `validateSchema` before any controller runs, and the
// resulting AppError is shaped by the global error middleware. The status is
// whatever `getStatusCode(VALIDATION_ERROR)` maps to (400 today).

describe("GET /api/v1/products/:id", () => {
  it("returns VALIDATION_ERROR for a malformed id", async () => {
    const res = await request(app).get("/api/v1/products/not-an-id");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      data: null,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        details: [{ path: ["params", "id"] }],
      },
    });
  });
});
