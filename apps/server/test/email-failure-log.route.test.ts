import cookieParser from "cookie-parser";
import express from "express";
import { pinoHttp } from "pino-http";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import globalErrorHandler from "../src/middlewares/error.middleware.js";
import cartRouter from "../src/routes/cart.route.js";
import orderRouter from "../src/routes/order.route.js";
import { emailTransport, outbox } from "../src/utils/email.js";
import { httpLoggerOptions } from "../src/utils/logger.js";
import {
  authCookie,
  createProduct,
  createUser,
  resetDatabase,
} from "./helpers/database.js";
import { collectLogLines, type CollectedLogger } from "./helpers/log-lines.js";

// The real routers behind the real request logger, pointed at an in-memory
// stream instead of stdout as logger.test.ts does: the one way to read what
// `req.log` wrote while a checkout ran.
const appWith = (logger: CollectedLogger) => {
  const app = express();
  app.use(pinoHttp({ ...httpLoggerOptions, logger }));
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/v1/cart", cartRouter);
  app.use("/api/v1/orders", orderRouter);
  app.use(globalErrorHandler);
  return app;
};

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

beforeEach(async () => {
  await resetDatabase();
  outbox.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/v1/orders when the email transport fails", () => {
  it("logs the failure at error level with the request id and the order id", async () => {
    vi.spyOn(emailTransport, "send").mockRejectedValueOnce(
      new Error("Resend answered 500: Internal server error"),
    );
    const { logger, lines, linesReaching } = collectLogLines();
    const app = appWith(logger);
    const user = await createUser();
    const product = await createProduct({ price: 1000 });
    const cookie = authCookie(user.id);

    const added = await request(app)
      .post("/api/v1/cart")
      .set("Cookie", cookie)
      .send({ productId: product.id, quantity: 1 });
    expect(added.status).toBe(200);
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send(checkout);
    expect(res.status).toBe(201);

    // The cart line, the failure line and the checkout's completion line.
    await linesReaching(3);
    const failure = lines.find(
      (line) => line.msg === "order confirmation email failed",
    );
    expect(failure).toMatchObject({
      level: 50,
      requestId: res.headers["x-request-id"],
      orderId: res.body.data.id,
      err: { message: "Resend answered 500: Internal server error" },
    });
    expect(outbox.messages).toEqual([]);
  });
});
