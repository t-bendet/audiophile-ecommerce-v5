import { ErrorCode } from "@repo/domain";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import {
  ABSENT_ID,
  authCookie,
  createAdmin,
  createCategory,
  createProduct,
  image,
  resetDatabase,
  thumbnail,
} from "./helpers/database.js";

/** A complete create body; every unique field is keyed off `name`. */
const productBody = (categoryId: string, name: string) => ({
  category: { connect: { id: categoryId } },
  cartLabel: name,
  name,
  shortLabel: name,
  description: `${name} description`,
  price: 1000,
  fullLabel: [name],
  featuresText: [`${name} feature`],
  featuredImageText: null,
  showCaseImageText: null,
  isNewProduct: true,
  includedItems: [{ item: "Cable", quantity: 1 }],
  images: {
    featuredImage: null,
    showCaseImage: null,
    galleryImages: [image(`${name}-gallery`)],
    introImage: image(`${name}-intro`),
    primaryImage: image(`${name}-primary`),
    relatedProductImage: image(`${name}-related`),
    thumbnail: thumbnail(name),
  },
});

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

  it("returns VALIDATION_ERROR for a malformed slug", async () => {
    const res = await request(app).get("/api/v1/products/slug/Not_A_Slug");

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ path: ["params", "slug"] }],
    });
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

describe("POST /api/v1/products", () => {
  it("derives the slug from the name when the body omits one", async () => {
    const admin = await createAdmin();
    const category = await createCategory();

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", authCookie(admin.id))
      .send(productBody(category.id, "XX99 Mark II"));

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe("xx99-mark-ii");
  });

  it("suffixes a derived slug that is already taken", async () => {
    const admin = await createAdmin();
    const existing = await createProduct({ slug: "zx9-speaker" });

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", authCookie(admin.id))
      .send(productBody(existing.categoryId, "ZX9 Speaker"));

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe("zx9-speaker-2");
  });

  it("rejects a malformed explicit slug", async () => {
    const admin = await createAdmin();
    const category = await createCategory();

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", authCookie(admin.id))
      .send({ ...productBody(category.id, "ZX7 Speaker"), slug: "Bad Slug" });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ path: ["body", "slug"] }],
    });
  });

  it("rejects a name no valid slug can be derived from", async () => {
    const admin = await createAdmin();
    const category = await createCategory();

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", authCookie(admin.id))
      .send(productBody(category.id, "!!"));

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it("returns DUPLICATE_ENTRY for an explicit slug already in use", async () => {
    const admin = await createAdmin();
    const existing = await createProduct({ slug: "zx9-speaker" });

    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", authCookie(admin.id))
      .send({
        ...productBody(existing.categoryId, "ZX9 Speaker"),
        slug: "zx9-speaker",
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe(ErrorCode.DUPLICATE_ENTRY);
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

  it("leaves the slug alone when the name changes", async () => {
    const admin = await createAdmin();
    const product = await createProduct({ slug: "xx99-mark-one" });

    const res = await request(app)
      .patch(`/api/v1/products/${product.id}`)
      .set("Cookie", authCookie(admin.id))
      .send({ name: "XX99 Mark Two" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      name: "XX99 Mark Two",
      slug: "xx99-mark-one",
    });
  });
});
