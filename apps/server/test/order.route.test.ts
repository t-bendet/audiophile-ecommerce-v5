import { prisma } from "@repo/database";
import { DEFAULT_LIMIT, DEFAULT_PAGE, ErrorCode } from "@repo/domain";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../src/app.js";
import { emailTransport, outbox } from "../src/utils/email.js";
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

beforeEach(async () => {
  await resetDatabase();
  outbox.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

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
    expect(res.body.data.events).toMatchObject([
      { status: "PENDING", actor: user.id },
    ]);
    expect(res.body.data.items).toHaveLength(1);

    const cart = await request(app).get("/api/v1/cart").set("Cookie", cookie);
    expect(cart.body.data.items).toEqual([]);
  });

  it("synthesizes Pending for legacy orders with missing or empty events", async () => {
    const user = await createUser();
    const { cookie, res } = await orderFromCart(user.id, 1000);
    const id = res.body.data.id;
    for (const update of [
      { $set: { events: [] } },
      { $unset: { events: "" } },
    ]) {
      await prisma.$runCommandRaw({
        update: "Order",
        updates: [{ q: { _id: { $oid: id } }, u: update }],
      });
      const read = await request(app)
        .get(`/api/v1/orders/${id}`)
        .set("Cookie", cookie);
      expect(read.status).toBe(200);
      expect(read.body.data.events).toEqual([
        { status: "PENDING", at: read.body.data.createdAt, actor: user.id },
      ]);
    }
  });

  it("carries the product thumbnail resolved to the media host", async () => {
    const user = await createUser();
    const { product, res } = await orderFromCart(user.id, 1000);

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].productImage).toEqual(
      resolvedVariant(product.images.thumbnail.image),
    );
  });

  it("sends one 'order received' email to the order's email address", async () => {
    const user = await createUser();
    const { product, res } = await orderFromCart(user.id, 1000);
    const order = res.body.data;

    expect(outbox.messages).toHaveLength(1);
    const [email] = outbox.addressedTo("ada@example.com");
    expect(email).toMatchObject({
      to: "ada@example.com",
      subject: `Order received: ${order.id}`,
      idempotencyKey: `order-confirmation/${order.id}`,
    });
    for (const body of [email!.text, email!.html]) {
      expect(body).toContain(order.id);
      expect(body).toContain(`/account/orders/${order.id}`);
      expect(body).toContain(product.cartLabel);
      expect(body).toContain("$ 1,000");
      expect(body).toContain("$ 1,250");
      expect(body).toContain(
        "Payment by e-Money is taken when your order is dispatched.",
      );
    }
  });

  it("still creates the order when the email cannot be sent", async () => {
    vi.spyOn(emailTransport, "send").mockRejectedValueOnce(
      new Error("Resend answered 500: Internal server error"),
    );
    const user = await createUser();
    const { cookie, res } = await orderFromCart(user.id, 1000);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ userId: user.id, total: 1250 });
    expect(outbox.messages).toEqual([]);

    const read = await request(app)
      .get(`/api/v1/orders/${res.body.data.id}`)
      .set("Cookie", cookie);
    expect(read.status).toBe(200);
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
    expect(outbox.messages).toHaveLength(1);
  });

  it("records shipment tracking and rejects missing tracking", async () => {
    const user = await createUser();
    const admin = await createAdmin();
    const { res: created } = await orderFromCart(user.id, 400);
    const url = `/api/v1/orders/${created.body.data.id}/status`;
    const cookie = authCookie(admin.id);
    await request(app)
      .patch(url)
      .set("Cookie", cookie)
      .send({ status: "PROCESSING" });
    const missing = await request(app)
      .patch(url)
      .set("Cookie", cookie)
      .send({ status: "SHIPPED" });
    expect(missing.status).toBe(422);
    expect(
      missing.body.error.details.map(
        (detail: { path: string[] }) => detail.path,
      ),
    ).toEqual(
      expect.arrayContaining([
        ["body", "carrier"],
        ["body", "trackingNumber"],
      ]),
    );
    const shipped = await request(app)
      .patch(url)
      .set("Cookie", cookie)
      .send({ status: "SHIPPED", carrier: " DHL ", trackingNumber: " 123 " });
    expect(shipped.status).toBe(200);
    expect(shipped.body.data.events).toHaveLength(3);
    expect(shipped.body.data.events[2]).toMatchObject({
      status: "SHIPPED",
      actor: admin.id,
      carrier: "DHL",
      trackingNumber: "123",
    });
    const email = outbox.messages[1]!;
    expect(email).toMatchObject({
      subject: "Your order has shipped",
      idempotencyKey: `order-status/${created.body.data.id}/SHIPPED`,
    });
    for (const body of [email.text, email.html]) {
      expect(body).toContain("DHL");
      expect(body).toContain("123");
      expect(body).toContain(`/account/orders/${created.body.data.id}`);
    }
  });

  it.each([false, true])(
    "sends cancellation copy for paid=%s",
    async (paid) => {
      const user = await createUser();
      const admin = await createAdmin();
      const { res: created } = await orderFromCart(user.id, 1000);
      const id = created.body.data.id;
      const cookie = authCookie(admin.id);
      if (paid) {
        const payment = await request(app)
          .patch(`/api/v1/orders/${id}/payment-status`)
          .set("Cookie", cookie)
          .send({ paymentStatus: "PAID" });
        expect(payment.status).toBe(200);
      }
      const cancelled = await request(app)
        .patch(`/api/v1/orders/${id}/status`)
        .set("Cookie", cookie)
        .send({ status: "CANCELLED" });
      expect(cancelled.status).toBe(200);
      const email = outbox.messages[1]!;
      expect(email).toMatchObject({
        subject: "Your order was cancelled",
        idempotencyKey: `order-status/${id}/CANCELLED`,
      });
      for (const body of [email.text, email.html]) {
        expect(body).toContain(`/account/orders/${id}`);
        expect(body).toContain(
          paid
            ? "$ 1,250 will be refunded to your e-Money account."
            : "Nothing was charged.",
        );
      }
      const refused = await request(app)
        .patch(`/api/v1/orders/${id}/status`)
        .set("Cookie", cookie)
        .send({ status: "CANCELLED" });
      expect(refused.status).toBe(400);
      expect(outbox.messages).toHaveLength(2);
    },
  );

  it("keeps the status update when sending fails", async () => {
    const user = await createUser();
    const admin = await createAdmin();
    const { res: created } = await orderFromCart(user.id, 400);
    vi.spyOn(emailTransport, "send").mockRejectedValueOnce(
      new Error("send failed"),
    );
    const res = await request(app)
      .patch(`/api/v1/orders/${created.body.data.id}/status`)
      .set("Cookie", authCookie(admin.id))
      .send({ status: "CANCELLED" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("CANCELLED");
  });

  it("allows only one concurrent move from the same status", async () => {
    const user = await createUser();
    const admin = await createAdmin();
    const { res: created } = await orderFromCart(user.id, 400);
    const url = `/api/v1/orders/${created.body.data.id}/status`;
    const cookie = authCookie(admin.id);
    const results = await Promise.all(
      ["PROCESSING", "CANCELLED"].map((status) =>
        request(app).patch(url).set("Cookie", cookie).send({ status }),
      ),
    );
    expect(results.map((res) => res.status).sort()).toEqual([200, 400]);
    expect(results.find((res) => res.status === 400)?.body.error.code).toBe(
      ErrorCode.ORDER_ALREADY_PROCESSED,
    );
  });

  it("refuses a move the transition table does not allow", async () => {
    const user = await createUser();
    const admin = await createAdmin();
    const { res: created } = await orderFromCart(user.id, 400);

    const res = await request(app)
      .patch(`/api/v1/orders/${created.body.data.id}/status`)
      .set("Cookie", authCookie(admin.id))
      .send({ status: "SHIPPED", carrier: "DHL", trackingNumber: "123" });

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
