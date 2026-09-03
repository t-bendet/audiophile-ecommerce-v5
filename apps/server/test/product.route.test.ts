import { ErrorCode } from "@repo/domain";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import {
  ABSENT_ID,
  authCookie,
  createAdmin,
  createProduct,
  resetDatabase,
} from "./helpers/database.js";

beforeEach(resetDatabase);

describe("GET /api/v1/products", () => {
  it("lists the seeded products", async () => {
    const product = await createProduct();

    const res = await request(app).get("/api/v1/products");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(product.id);
    expect(res.body.meta).toMatchObject({ page: 1, total: 1 });
  });
});

describe("GET /api/v1/products/:id", () => {
  it("returns one product", async () => {
    const product = await createProduct({ price: 1499 });

    const res = await request(app).get(`/api/v1/products/${product.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: product.id,
      slug: product.slug,
      price: 1499,
    });
  });

  // Exercises the real Express app end to end: the malformed id is rejected by
  // `validateSchema` before any controller runs, and the resulting AppError is
  // shaped by the global error middleware.
  it("returns VALIDATION_ERROR for a malformed id", async () => {
    const res = await request(app).get("/api/v1/products/not-an-id");

    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({
      success: false,
      data: null,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 422,
        details: [{ path: ["params", "id"] }],
      },
    });
  });

  it("returns NOT_FOUND for a well-formed id that matches nothing", async () => {
    const res = await request(app).get(`/api/v1/products/${ABSENT_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe(ErrorCode.NOT_FOUND);
  });
});

describe("GET /api/v1/products/slug/:slug", () => {
  it("returns the product with that slug", async () => {
    const product = await createProduct({ slug: "xx99-mark-two" });

    const res = await request(app).get("/api/v1/products/slug/xx99-mark-two");

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(product.id);
  });
});

describe("DELETE /api/v1/products/:id", () => {
  it("deletes a product for an admin", async () => {
    const admin = await createAdmin();
    const product = await createProduct();

    const res = await request(app)
      .delete(`/api/v1/products/${product.id}`)
      .set("Cookie", authCookie(admin.id));

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();

    const after = await request(app).get(`/api/v1/products/${product.id}`);
    expect(after.status).toBe(404);
  });

  it("rejects an anonymous caller", async () => {
    const product = await createProduct();

    const res = await request(app).delete(`/api/v1/products/${product.id}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  // The message pins the service path; a raw Prisma error would 404 too.
  it("returns NOT_FOUND for a well-formed id that matches nothing", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .delete(`/api/v1/products/${ABSENT_ID}`)
      .set("Cookie", authCookie(admin.id));

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.NOT_FOUND,
      message: "No document found with that ID",
    });
  });
});

describe("PATCH /api/v1/products/:id", () => {
  it("returns NOT_FOUND for a well-formed id that matches nothing", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .patch(`/api/v1/products/${ABSENT_ID}`)
      .set("Cookie", authCookie(admin.id))
      .send({ price: 999 });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.NOT_FOUND,
      message: "No document found with that ID",
    });
  });
});
