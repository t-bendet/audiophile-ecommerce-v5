import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  AdminOrderQueryParamsSchema,
  canTransitionOrderStatus,
  canTransitionPaymentStatus,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  GetOrderRequestSchema,
  ORDER_STATUS_TRANSITIONS,
  OrderQueryParamsSchema,
  PAYMENT_STATUS_TRANSITIONS,
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

describe("OrderQueryParamsSchema pagination", () => {
  it("falls back to the shared defaults", () => {
    expect(OrderQueryParamsSchema.parse({})).toMatchObject({
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
    });
  });
});

describe("status transition tables", () => {
  it("lets an order move along fulfilment or be cancelled, and no further", () => {
    expect(ORDER_STATUS_TRANSITIONS).toEqual({
      PENDING: ["PROCESSING", "CANCELLED"],
      PROCESSING: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["DELIVERED", "CANCELLED"],
      DELIVERED: ["CANCELLED"],
      CANCELLED: [],
    });
    expect(canTransitionOrderStatus("PENDING", "PROCESSING")).toBe(true);
    expect(canTransitionOrderStatus("PENDING", "SHIPPED")).toBe(false);
    expect(canTransitionOrderStatus("DELIVERED", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("CANCELLED", "PENDING")).toBe(false);
    expect(canTransitionOrderStatus("PENDING", "PENDING")).toBe(false);
  });

  it("lets payment be settled, retried or refunded by hand", () => {
    expect(PAYMENT_STATUS_TRANSITIONS).toEqual({
      PENDING: ["PAID", "FAILED"],
      PAID: ["REFUNDED"],
      FAILED: ["PAID"],
      REFUNDED: [],
    });
    expect(canTransitionPaymentStatus("PENDING", "PAID")).toBe(true);
    expect(canTransitionPaymentStatus("FAILED", "PAID")).toBe(true);
    expect(canTransitionPaymentStatus("PAID", "PENDING")).toBe(false);
    expect(canTransitionPaymentStatus("REFUNDED", "PAID")).toBe(false);
  });
});

describe("AdminOrderQueryParamsSchema", () => {
  it("accepts the admin filters and rejects an unknown one", () => {
    expect(
      AdminOrderQueryParamsSchema.parse({
        status: "PENDING",
        customerEmail: " Ada@Example.com ",
        userId: VALID_ORDER_ID,
        orderId: VALID_ORDER_ID,
      }),
    ).toMatchObject({ customerEmail: "Ada@Example.com", page: DEFAULT_PAGE });
    expect(() => AdminOrderQueryParamsSchema.parse({ email: "x" })).toThrow(
      ZodError,
    );
    expect(() => AdminOrderQueryParamsSchema.parse({ status: "LOST" })).toThrow(
      ZodError,
    );
  });
});
