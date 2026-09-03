import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  GetOrderRequestSchema,
  UpdateOrderStatusRequestSchema,
} from "../src/index.js";

// Regression for #93: both param schemas once passed the `IdValidator` factory
// itself instead of calling it, so every parse blew up with a non-Zod
// TypeError and the routes answered 500. A valid id must parse cleanly and an
// invalid one must fail with a ZodError, not anything else.

const VALID_ORDER_ID = "507f1f77bcf86cd799439011";

describe("GetOrderRequestSchema", () => {
  it("parses a valid orderId", () => {
    const parsed = GetOrderRequestSchema.parse({
      params: { orderId: VALID_ORDER_ID },
      body: undefined,
      query: {},
    });

    expect(parsed.params).toEqual({ orderId: VALID_ORDER_ID });
  });

  it("rejects a malformed orderId with a ZodError", () => {
    expect(() =>
      GetOrderRequestSchema.parse({
        params: { orderId: "not-an-id" },
        body: undefined,
        query: {},
      }),
    ).toThrow(ZodError);
  });
});

describe("UpdateOrderStatusRequestSchema", () => {
  it("parses a valid orderId and status", () => {
    const parsed = UpdateOrderStatusRequestSchema.parse({
      params: { orderId: VALID_ORDER_ID },
      body: { status: "SHIPPED" },
      query: {},
    });

    expect(parsed.params).toEqual({ orderId: VALID_ORDER_ID });
    expect(parsed.body).toEqual({ status: "SHIPPED" });
  });

  it("rejects a malformed orderId with a ZodError", () => {
    expect(() =>
      UpdateOrderStatusRequestSchema.parse({
        params: { orderId: "not-an-id" },
        body: { status: "SHIPPED" },
        query: {},
      }),
    ).toThrow(ZodError);
  });
});
