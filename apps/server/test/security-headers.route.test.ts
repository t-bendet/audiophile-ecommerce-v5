import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";

// A short-circuiting middleware (CORS rejection, rate limiting) still has to
// leave through the same chain as any other request, so it must carry
// Helmet's security headers too. Exercised through the real app: helmet has
// to sit ahead of anything that can reject a request before helmet runs.

describe("security headers on short-circuited requests", () => {
  it("still sets helmet headers when CORS rejects the origin", async () => {
    const res = await request(app)
      .get("/api/v1/products")
      .set("Origin", "https://not-allowed.example.com");

    expect(res.status).toBe(500);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });
});
