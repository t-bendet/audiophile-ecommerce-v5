import { ErrorCode } from "@repo/domain";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";

// Correlation contract, end to end through the real app: whatever id the
// response header carries is the id the error envelope reports, so a
// client-reported failure can be looked up in the server logs.

describe("request id correlation", () => {
  it("echoes a client-sent x-request-id and reports it in the error envelope", async () => {
    const res = await request(app)
      .get("/api/v1/products/not-an-id")
      .set("x-request-id", "client-supplied-id");

    expect(res.headers["x-request-id"]).toBe("client-supplied-id");
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      requestId: "client-supplied-id",
    });
  });

  it("generates a request id for unmatched routes and reports it", async () => {
    const res = await request(app).get("/api/v1/no-such-route");

    expect(res.status).toBe(404);
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.body.error).toMatchObject({
      code: ErrorCode.NOT_FOUND,
      requestId: res.headers["x-request-id"],
    });
  });
});
