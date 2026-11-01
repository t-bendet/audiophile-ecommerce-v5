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

/** An order placed through the API by `userId`, so every DTO field is real. */
const placeOrder = async (userId: string) => {
  const product = await createProduct({ price: 1000 });
  const cookie = authCookie(userId);

  const added = await request(app)
    .post("/api/v1/cart")
    .set("Cookie", cookie)
    .send({ productId: product.id, quantity: 1 });
  expect(added.status, JSON.stringify(added.body)).toBe(200);

  const res = await request(app)
    .post("/api/v1/orders")
    .set("Cookie", cookie)
    .send(checkout);
  expect(res.status, JSON.stringify(res.body)).toBe(201);

  return res.body.data as { id: string };
};

const setStatus = async (
  admin: { id: string },
  orderId: string,
  body: { status: string } | { paymentStatus: string },
) => {
  const path = "status" in body ? "status" : "payment-status";
  const res = await request(app)
    .patch(`/api/v1/orders/${orderId}/${path}`)
    .set("Cookie", authCookie(admin.id))
    .send(body);
  expect(res.status, JSON.stringify(res.body)).toBe(200);
};

const listOrders = (adminId: string, query = "") =>
  request(app)
    .get(`/api/v1/admin/orders${query}`)
    .set("Cookie", authCookie(adminId));

const ids = (res: request.Response) =>
  (res.body.data as { id: string }[]).map((order) => order.id);

beforeEach(resetDatabase);

describe("the admin router", () => {
  it("answers a guest with 401 on every path", async () => {
    for (const path of ["/orders", `/orders/${ABSENT_ID}`]) {
      const res = await request(app).get(`/api/v1/admin${path}`);
      expect(res.status, path).toBe(401);
      expect(res.body.error.code).toBe(ErrorCode.UNAUTHORIZED);
    }
  });

  it("answers a shopper with 403 on every path", async () => {
    const user = await createUser();
    for (const path of ["/orders", `/orders/${ABSENT_ID}`]) {
      const res = await request(app)
        .get(`/api/v1/admin${path}`)
        .set("Cookie", authCookie(user.id));
      expect(res.status, path).toBe(403);
      expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
    }
  });
});

describe("GET /api/v1/admin/orders", () => {
  it("lists every user's orders newest first with the customer", async () => {
    const admin = await createAdmin();
    const ada = await createUser({ name: "ada", email: "Ada@Example.com" });
    const bob = await createUser({ name: "bob", email: "bob@example.com" });
    const first = await placeOrder(ada.id);
    const second = await placeOrder(bob.id);

    const res = await listOrders(admin.id);

    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([second.id, first.id]);
    expect(res.body.data[1].customer).toEqual({
      id: ada.id,
      name: "ada",
      email: "Ada@Example.com",
    });
    expect(res.body.meta).toMatchObject({
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      total: 2,
    });
  });

  it("filters by order status", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const pending = await placeOrder(user.id);
    const processing = await placeOrder(user.id);
    await setStatus(admin, processing.id, { status: "PROCESSING" });

    const res = await listOrders(admin.id, "?status=PROCESSING");

    expect(ids(res)).toEqual([processing.id]);
    expect(ids(res)).not.toContain(pending.id);
  });

  it("filters by payment status", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    await placeOrder(user.id);
    const paid = await placeOrder(user.id);
    await setStatus(admin, paid.id, { paymentStatus: "PAID" });

    const res = await listOrders(admin.id, "?paymentStatus=PAID");

    expect(ids(res)).toEqual([paid.id]);
  });

  it("filters by an exact order id", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    await placeOrder(user.id);
    const wanted = await placeOrder(user.id);

    const res = await listOrders(admin.id, `?orderId=${wanted.id}`);

    expect(ids(res)).toEqual([wanted.id]);
  });

  it("filters by part of the customer's email, ignoring case", async () => {
    const admin = await createAdmin();
    const ada = await createUser({ email: "Ada.Lovelace@example.com" });
    const bob = await createUser({ email: "bob@example.com" });
    const adas = await placeOrder(ada.id);
    await placeOrder(bob.id);

    const res = await listOrders(admin.id, "?customerEmail=lovelace");

    expect(ids(res)).toEqual([adas.id]);
  });

  it("filters by an exact user id", async () => {
    const admin = await createAdmin();
    const ada = await createUser();
    const bob = await createUser();
    const adas = await placeOrder(ada.id);
    await placeOrder(bob.id);

    const res = await listOrders(admin.id, `?userId=${ada.id}`);

    expect(ids(res)).toEqual([adas.id]);
  });

  it("rejects an unknown filter value and names it", async () => {
    const admin = await createAdmin();

    const res = await listOrders(admin.id, "?status=LOST");

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ path: ["query", "status"] }],
    });
  });
});

describe("GET /api/v1/admin/orders/:orderId", () => {
  it("returns another user's order with its customer", async () => {
    const admin = await createAdmin();
    const user = await createUser({ name: "ada", email: "ada@example.com" });
    const order = await placeOrder(user.id);

    const res = await request(app)
      .get(`/api/v1/admin/orders/${order.id}`)
      .set("Cookie", authCookie(admin.id));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: order.id,
      userId: user.id,
      status: "PENDING",
      paymentStatus: "PENDING",
      customer: { id: user.id, name: "ada", email: "ada@example.com" },
    });
    expect(res.body.data.items).toHaveLength(1);
  });

  it("answers ORDER_NOT_FOUND for an order that does not exist", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .get(`/api/v1/admin/orders/${ABSENT_ID}`)
      .set("Cookie", authCookie(admin.id));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe(ErrorCode.ORDER_NOT_FOUND);
  });
});
