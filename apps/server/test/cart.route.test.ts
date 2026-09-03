import { ErrorCode } from "@repo/domain";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import {
  ABSENT_ID,
  authCookie,
  createProduct,
  createUser,
  resetDatabase,
} from "./helpers/database.js";

beforeEach(resetDatabase);

describe("GET /api/v1/cart", () => {
  it("creates an empty cart on first read", async () => {
    const user = await createUser();

    const res = await request(app)
      .get("/api/v1/cart")
      .set("Cookie", authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      userId: user.id,
      items: [],
      itemCount: 0,
      subtotal: 0,
    });
  });

  it("rejects an anonymous caller", async () => {
    const res = await request(app).get("/api/v1/cart");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCode.UNAUTHORIZED);
  });
});

describe("POST /api/v1/cart", () => {
  it("adds a product and reports the running subtotal", async () => {
    const user = await createUser();
    const product = await createProduct({ price: 300 });

    const res = await request(app)
      .post("/api/v1/cart")
      .set("Cookie", authCookie(user.id))
      .send({ productId: product.id, quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ itemCount: 2, subtotal: 600 });
    expect(res.body.data.items[0]).toMatchObject({
      productId: product.id,
      productPrice: 300,
      quantity: 2,
    });
  });

  it("rejects a malformed product id", async () => {
    const user = await createUser();

    const res = await request(app)
      .post("/api/v1/cart")
      .set("Cookie", authCookie(user.id))
      .send({ productId: "not-an-id", quantity: 1 });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ path: ["body", "productId"] }],
    });
  });

  it("returns NOT_FOUND for a product that does not exist", async () => {
    const user = await createUser();

    const res = await request(app)
      .post("/api/v1/cart")
      .set("Cookie", authCookie(user.id))
      .send({ productId: ABSENT_ID, quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe(ErrorCode.NOT_FOUND);
  });
});

describe("PATCH /api/v1/cart/items/:cartItemId", () => {
  it("updates the quantity of an item the caller owns", async () => {
    const user = await createUser();
    const product = await createProduct({ price: 100 });
    const cookie = authCookie(user.id);

    const added = await request(app)
      .post("/api/v1/cart")
      .set("Cookie", cookie)
      .send({ productId: product.id, quantity: 1 });

    const res = await request(app)
      .patch(`/api/v1/cart/items/${added.body.data.items[0].id}`)
      .set("Cookie", cookie)
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ itemCount: 5, subtotal: 500 });
  });

  it("refuses to touch another user's cart item", async () => {
    const owner = await createUser();
    const intruder = await createUser();
    const product = await createProduct();

    const added = await request(app)
      .post("/api/v1/cart")
      .set("Cookie", authCookie(owner.id))
      .send({ productId: product.id, quantity: 1 });

    const res = await request(app)
      .patch(`/api/v1/cart/items/${added.body.data.items[0].id}`)
      .set("Cookie", authCookie(intruder.id))
      .send({ quantity: 2 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
  });
});

describe("DELETE /api/v1/cart", () => {
  it("clears every item", async () => {
    const user = await createUser();
    const product = await createProduct();
    const cookie = authCookie(user.id);

    await request(app)
      .post("/api/v1/cart")
      .set("Cookie", cookie)
      .send({ productId: product.id, quantity: 3 });

    const res = await request(app).delete("/api/v1/cart").set("Cookie", cookie);

    expect(res.status).toBe(200);

    const after = await request(app).get("/api/v1/cart").set("Cookie", cookie);
    expect(after.body.data.items).toEqual([]);
  });
});
