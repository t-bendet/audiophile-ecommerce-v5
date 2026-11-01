import { DEFAULT_LIMIT, DEFAULT_PAGE, ErrorCode } from "@repo/domain";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import {
  ABSENT_ID,
  authCookie,
  createAdmin,
  createProduct,
  createUser,
  resetDatabase,
  resolvedVariant,
} from "./helpers/database.js";

const checkout = {
  shippingAddress: {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "555-0100",
    address: "1 Analytical Way",
    city: "London",
    state: "London",
    zipCode: "E1 6AN",
    country: "UK",
  },
  billingAddress: {
    fullName: "Ada Lovelace",
    address: "1 Analytical Way",
    city: "London",
    state: "London",
    zipCode: "E1 6AN",
    country: "UK",
  },
  paymentMethod: "e-Money",
};

/** Every caller reads the order this returns, so the setup asserts itself. */
const expectStatus = (res: request.Response, status: number, step: string) =>
  expect(
    res.status,
    `${step} returned ${res.status}: ${JSON.stringify(res.body)}`,
  ).toBe(status);

const orderFromCart = async (userId: string, price: number) => {
  const product = await createProduct({ price });
  const cookie = authCookie(userId);

  const added = await request(app)
    .post("/api/v1/cart")
    .set("Cookie", cookie)
    .send({ productId: product.id, quantity: 1 });
  expectStatus(added, 200, "POST /cart");

  const res = await request(app)
    .post("/api/v1/orders")
    .set("Cookie", cookie)
    .send(checkout);
  expectStatus(res, 201, "POST /orders");

  return { cookie, product, res };
};

beforeEach(resetDatabase);

describe("POST /api/v1/orders", () => {
  it("turns the cart into an order and empties it", async () => {
    const user = await createUser();
    const { cookie, res } = await orderFromCart(user.id, 1000);

    expect(res.status).toBe(201);
    // 1000 subtotal + 50 flat shipping + 20% tax
    expect(res.body.data).toMatchObject({
      userId: user.id,
      status: "PENDING",
      paymentStatus: "PENDING",
      subtotal: 1000,
      shippingCost: 50,
      tax: 200,
      total: 1250,
    });
    expect(res.body.data.items).toHaveLength(1);

    const cart = await request(app).get("/api/v1/cart").set("Cookie", cookie);
    expect(cart.body.data.items).toEqual([]);
  });

  it("carries the product thumbnail resolved to the media host", async () => {
    const user = await createUser();
    const { product, res } = await orderFromCart(user.id, 1000);

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].productImage).toEqual(
      resolvedVariant(product.images.thumbnail.image),
    );
  });

  it("refuses to order from an empty cart", async () => {
    const user = await createUser();

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Cookie", authCookie(user.id))
      .send(checkout);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.CART_EMPTY);
  });

  it("rejects a checkout missing a shipping field", async () => {
    const user = await createUser();

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Cookie", authCookie(user.id))
      .send({
        ...checkout,
        shippingAddress: { ...checkout.shippingAddress, city: "" },
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ path: ["body", "shippingAddress", "city"] }],
    });
  });
});

describe("GET /api/v1/orders", () => {
  it("lists only the caller's orders", async () => {
    const user = await createUser();
    const { cookie } = await orderFromCart(user.id, 500);

    const res = await request(app).get("/api/v1/orders").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      total: 1,
    });

    const other = await createUser();
    const otherRes = await request(app)
      .get("/api/v1/orders")
      .set("Cookie", authCookie(other.id));
    expect(otherRes.body.data).toEqual([]);
  });

  it("rejects an unknown query key and names it in the error details", async () => {
    const user = await createUser();

    const res = await request(app)
      .get("/api/v1/orders?status=PENDING&userId=abc")
      .set("Cookie", authCookie(user.id));

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ code: "unrecognized_keys", path: ["query", "userId"] }],
    });
  });
});

describe("GET /api/v1/orders/:orderId", () => {
  it("returns the caller's own order", async () => {
    const user = await createUser();
    const { cookie, res: created } = await orderFromCart(user.id, 800);

    const res = await request(app)
      .get(`/api/v1/orders/${created.body.data.id}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(created.body.data.id);
  });

  it("refuses to read another user's order", async () => {
    const owner = await createUser();
    const intruder = await createUser();
    const { res: created } = await orderFromCart(owner.id, 800);

    const res = await request(app)
      .get(`/api/v1/orders/${created.body.data.id}`)
      .set("Cookie", authCookie(intruder.id));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("returns VALIDATION_ERROR for a malformed order id", async () => {
    const user = await createUser();

    const res = await request(app)
      .get("/api/v1/orders/not-an-id")
      .set("Cookie", authCookie(user.id));

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ path: ["params", "orderId"] }],
    });
  });
});

describe("PATCH /api/v1/orders/:orderId/status", () => {
  it("moves a pending order to processing for an admin", async () => {
    const user = await createUser();
    const admin = await createAdmin();
    const { res: created } = await orderFromCart(user.id, 400);

    const res = await request(app)
      .patch(`/api/v1/orders/${created.body.data.id}/status`)
      .set("Cookie", authCookie(admin.id))
      .send({ status: "PROCESSING" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("PROCESSING");
  });

  it("refuses a move the transition table does not allow", async () => {
    const user = await createUser();
    const admin = await createAdmin();
    const { res: created } = await orderFromCart(user.id, 400);

    const res = await request(app)
      .patch(`/api/v1/orders/${created.body.data.id}/status`)
      .set("Cookie", authCookie(admin.id))
      .send({ status: "SHIPPED" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.ORDER_ALREADY_PROCESSED,
      message: "Order status cannot move from PENDING to SHIPPED",
    });
  });

  it("answers ORDER_NOT_FOUND for an order that does not exist", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .patch(`/api/v1/orders/${ABSENT_ID}/status`)
      .set("Cookie", authCookie(admin.id))
      .send({ status: "PROCESSING" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe(ErrorCode.ORDER_NOT_FOUND);
  });

  it("refuses a non-admin", async () => {
    const user = await createUser();
    const { cookie, res: created } = await orderFromCart(user.id, 400);

    const res = await request(app)
      .patch(`/api/v1/orders/${created.body.data.id}/status`)
      .set("Cookie", cookie)
      .send({ status: "SHIPPED" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
  });
});

describe("PATCH /api/v1/orders/:orderId/payment-status", () => {
  it("marks a pending order paid for an admin", async () => {
    const user = await createUser();
    const admin = await createAdmin();
    const { res: created } = await orderFromCart(user.id, 400);

    const res = await request(app)
      .patch(`/api/v1/orders/${created.body.data.id}/payment-status`)
      .set("Cookie", authCookie(admin.id))
      .send({ paymentStatus: "PAID" });

    expect(res.status).toBe(200);
    expect(res.body.data.paymentStatus).toBe("PAID");
    // Payment status moves independently of order status.
    expect(res.body.data.status).toBe("PENDING");
  });

  it("refuses to refund an order that was never paid", async () => {
    const user = await createUser();
    const admin = await createAdmin();
    const { res: created } = await orderFromCart(user.id, 400);

    const res = await request(app)
      .patch(`/api/v1/orders/${created.body.data.id}/payment-status`)
      .set("Cookie", authCookie(admin.id))
      .send({ paymentStatus: "REFUNDED" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.ORDER_ALREADY_PROCESSED,
      message: "Payment status cannot move from PENDING to REFUNDED",
    });
  });

  it("refuses a non-admin", async () => {
    const user = await createUser();
    const { cookie, res: created } = await orderFromCart(user.id, 400);

    const res = await request(app)
      .patch(`/api/v1/orders/${created.body.data.id}/payment-status`)
      .set("Cookie", cookie)
      .send({ paymentStatus: "PAID" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
  });
});
