import { prisma } from "@repo/database";
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
const placeOrder = async (
  userId: string,
  line: { product?: { id: string }; quantity?: number } = {},
) => {
  const product = line.product ?? (await createProduct({ price: 1000 }));
  const cookie = authCookie(userId);

  const added = await request(app)
    .post("/api/v1/cart")
    .set("Cookie", cookie)
    .send({ productId: product.id, quantity: line.quantity ?? 1 });
  expect(added.status, JSON.stringify(added.body)).toBe(200);

  const res = await request(app)
    .post("/api/v1/orders")
    .set("Cookie", cookie)
    .send(checkout);
  expect(res.status, JSON.stringify(res.body)).toBe(201);

  return res.body.data as { id: string; total: number };
};

/** Moves an order's creation back `days` days; the API offers no way to. */
const placedDaysAgo = async (orderId: string, days: number) => {
  const createdAt = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  await prisma.order.update({ where: { id: orderId }, data: { createdAt } });
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
    for (const path of ["/orders", `/orders/${ABSENT_ID}`, "/stats"]) {
      const res = await request(app).get(`/api/v1/admin${path}`);
      expect(res.status, path).toBe(401);
      expect(res.body.error.code).toBe(ErrorCode.UNAUTHORIZED);
    }
  });

  it("answers a shopper with 403 on every path", async () => {
    const user = await createUser();
    for (const path of ["/orders", `/orders/${ABSENT_ID}`, "/stats"]) {
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

describe("GET /api/v1/admin/stats", () => {
  const getStats = (adminId: string, query = "") =>
    request(app)
      .get(`/api/v1/admin/stats${query}`)
      .set("Cookie", authCookie(adminId));

  const zeroByStatus = {
    PENDING: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };

  it("answers zeros and no best sellers for an empty shop", async () => {
    const admin = await createAdmin();

    const res = await getStats(admin.id, "?period=7d");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      period: "7d",
      ordersCount: 0,
      ordersByStatus: zeroByStatus,
      revenue: 0,
      topProducts: [],
      // The admin signed up just now.
      newUsers: 1,
    });
  });

  it("defaults to thirty days", async () => {
    const admin = await createAdmin();

    const res = await getStats(admin.id);

    expect(res.status).toBe(200);
    expect(res.body.data.period).toBe("30d");
  });

  it("counts the period's orders by status and sums only Paid totals", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const pending = await placeOrder(user.id);
    const processing = await placeOrder(user.id);
    await setStatus(admin, processing.id, { status: "PROCESSING" });
    await setStatus(admin, processing.id, { paymentStatus: "PAID" });
    // Paid and later cancelled: still revenue, since the order status is
    // not what the sum looks at.
    const cancelled = await placeOrder(user.id);
    await setStatus(admin, cancelled.id, { paymentStatus: "PAID" });
    await setStatus(admin, cancelled.id, { status: "CANCELLED" });
    // Paid then refunded: no longer revenue.
    const refunded = await placeOrder(user.id);
    await setStatus(admin, refunded.id, { paymentStatus: "PAID" });
    await setStatus(admin, refunded.id, { paymentStatus: "REFUNDED" });
    const failed = await placeOrder(user.id);
    await setStatus(admin, failed.id, { paymentStatus: "FAILED" });

    const res = await getStats(admin.id, "?period=7d");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      ordersCount: 5,
      ordersByStatus: {
        ...zeroByStatus,
        PENDING: 3,
        PROCESSING: 1,
        CANCELLED: 1,
      },
      revenue: processing.total + cancelled.total,
    });
    expect(pending.total).toBeGreaterThan(0);
  });

  it("ranks the best sellers by quantity sold, five at most", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const products = await Promise.all(
      Array.from({ length: 6 }, () => createProduct()),
    );
    // Product n sells n units across one or two orders.
    for (const [index, product] of products.entries()) {
      const quantity = index + 1;
      await placeOrder(user.id, { product, quantity: quantity - 1 || 1 });
      if (quantity > 1) await placeOrder(user.id, { product, quantity: 1 });
    }

    const res = await getStats(admin.id, "?period=30d");

    expect(res.status).toBe(200);
    expect(res.body.data.topProducts).toEqual(
      [...products]
        .reverse()
        .slice(0, 5)
        .map((product, index) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          thumbnail: {
            src: `https://audiophile-media.t-bendet.com/${product.images.thumbnail.image.key}`,
            width: 150,
            height: 150,
          },
          quantity: 6 - index,
        })),
    );
  });

  it("counts the users created in the period", async () => {
    const admin = await createAdmin();
    const recent = await createUser();
    const old = await createUser();
    await prisma.user.update({
      where: { id: old.id },
      data: { createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
    });

    const month = await getStats(admin.id, "?period=30d");
    const all = await getStats(admin.id, "?period=all");

    expect(month.body.data.newUsers).toBe(2);
    expect(all.body.data.newUsers).toBe(3);
    expect(recent.id).not.toBe(old.id);
  });

  it("leaves an order placed before the period out of every number", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const product = await createProduct();
    const recent = await placeOrder(user.id, { product, quantity: 1 });
    await setStatus(admin, recent.id, { paymentStatus: "PAID" });
    const old = await placeOrder(user.id, { product, quantity: 10 });
    await setStatus(admin, old.id, { paymentStatus: "PAID" });
    await placedDaysAgo(old.id, 8);

    const week = await getStats(admin.id, "?period=7d");
    const month = await getStats(admin.id, "?period=30d");
    const all = await getStats(admin.id, "?period=all");

    expect(week.body.data).toMatchObject({
      ordersCount: 1,
      ordersByStatus: { ...zeroByStatus, PENDING: 1 },
      revenue: recent.total,
      topProducts: [{ id: product.id, quantity: 1 }],
    });
    for (const res of [month, all]) {
      expect(res.body.data).toMatchObject({
        ordersCount: 2,
        ordersByStatus: { ...zeroByStatus, PENDING: 2 },
        revenue: recent.total + old.total,
        topProducts: [{ id: product.id, quantity: 11 }],
      });
    }
  });

  it("rejects an unknown period and names it", async () => {
    const admin = await createAdmin();

    const res = await getStats(admin.id, "?period=1y");

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ path: ["query", "period"] }],
    });
  });
});
