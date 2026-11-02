import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import { outbox, type EmailMessage } from "../src/utils/email.js";

const toAda: EmailMessage = {
  to: "ada@example.com",
  subject: "Order received: 1",
  text: "one",
  html: "<p>one</p>",
  idempotencyKey: "order-confirmation/1",
};

const toGrace: EmailMessage = {
  ...toAda,
  to: "grace@example.com",
  subject: "Order received: 2",
  idempotencyKey: "order-confirmation/2",
};

// Only mounted under NODE_ENV=test, which is what the suite runs as; the
// outbox is what the E2E suite reads over HTTP.
beforeEach(async () => {
  outbox.clear();
  await outbox.send(toAda);
  await outbox.send(toGrace);
});

describe("GET /api/v1/test/outbox", () => {
  it("returns only the recipient's messages when `to` is given", async () => {
    const res = await request(app)
      .get("/api/v1/test/outbox")
      .query({ to: "grace@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([toGrace]);
  });

  it("returns every message without a filter", async () => {
    const res = await request(app).get("/api/v1/test/outbox");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([toAda, toGrace]);
  });

  it("rejects a `to` that is not an email address", async () => {
    const res = await request(app)
      .get("/api/v1/test/outbox")
      .query({ to: "grace" });

    expect(res.status).toBe(422);
  });
});

describe("DELETE /api/v1/test/outbox", () => {
  it("empties the outbox", async () => {
    const cleared = await request(app).delete("/api/v1/test/outbox");
    expect(cleared.status).toBe(200);

    const res = await request(app).get("/api/v1/test/outbox");
    expect(res.body.data).toEqual([]);
  });
});
