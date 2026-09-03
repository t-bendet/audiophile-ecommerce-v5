import { ErrorCode } from "@repo/domain";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import {
  authCookie,
  createAdmin,
  createProduct,
  createUser,
  resetDatabase,
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

const orderFromCart = async (userId: string, price: number) => {
  const product = await createProduct({ price });
  const cookie = authCookie(userId);

  await request(app)
    .post("/api/v1/cart")
    .set("Cookie", cookie)
    .send({ productId: product.id, quantity: 1 });

  const res = await request(app)
    .post("/api/v1/orders")
    .set("Cookie", cookie)
    .send(checkout);

  return { cookie, res };
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

    expect(res.status).toBe(400);
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
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10, total: 1 });

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

    expect(res.status).toBe(400);
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

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ path: ["params", "orderId"] }],
    });
  });
});

describe("PATCH /api/v1/orders/:orderId/status", () => {
  it("moves the order on for an admin", async () => {
    const user = await createUser();
    const admin = await createAdmin();
    const { res: created } = await orderFromCart(user.id, 400);

    const res = await request(app)
      .patch(`/api/v1/orders/${created.body.data.id}/status`)
      .set("Cookie", authCookie(admin.id))
      .send({ status: "SHIPPED" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("SHIPPED");
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
