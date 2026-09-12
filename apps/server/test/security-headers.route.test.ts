import { ErrorCode } from "@repo/domain";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";

// A short-circuiting middleware (schema validation, rate limiting) still has to
// leave through the same chain as any other request, so it must carry
// Helmet's security headers too. Exercised through the real app: helmet has
// to sit ahead of anything that can reject a request before helmet runs.

describe("security headers on short-circuited requests", () => {
  it("still sets helmet headers when validation rejects the query", async () => {
    const res = await request(app).get("/api/v1/products?limit=not-a-number");

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });
});
