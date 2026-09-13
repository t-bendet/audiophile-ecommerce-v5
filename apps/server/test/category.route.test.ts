import { ErrorCode } from "@repo/domain";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import {
  authCookie,
  createAdmin,
  createCategory,
  createProduct,
  createUser,
  resetDatabase,
  singleImage,
} from "./helpers/database.js";

const thumbnail = singleImage("speakers");

/** What the API returns for a stored thumbnail: the key joined onto the host. */
const resolved = ({ altText, image }: ReturnType<typeof singleImage>) => ({
  altText,
  src: `https://audiophile-media.t-bendet.com/${image.key}`,
  width: image.width,
  height: image.height,
});

beforeEach(resetDatabase);

describe("GET /api/v1/categories", () => {
  it("lists the seeded categories", async () => {
    const category = await createCategory("Earphones");

    const res = await request(app).get("/api/v1/categories");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      id: category.id,
      name: "Earphones",
    });
  });
});

describe("GET /api/v1/categories/:id", () => {
  it("returns one category", async () => {
    const category = await createCategory();

    const res = await request(app).get(`/api/v1/categories/${category.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      id: category.id,
      name: "Headphones",
      createdAt: category.createdAt.toISOString(),
      v: category.v,
      thumbnail: resolved(category.thumbnail),
    });
  });

  it("returns VALIDATION_ERROR for a malformed id", async () => {
    const res = await request(app).get("/api/v1/categories/not-an-id");

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ path: ["params", "id"] }],
    });
  });
});

describe("GET /api/v1/categories/:category/products", () => {
  it("returns the products in that category", async () => {
    const category = await createCategory("Speakers");
    const product = await createProduct({ categoryId: category.id });

    const res = await request(app).get("/api/v1/categories/Speakers/products");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(product.id);
  });

  it("rejects a category name outside the enum", async () => {
    const res = await request(app).get(
      "/api/v1/categories/Turntables/products",
    );

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });
});

describe("POST /api/v1/categories", () => {
  it("creates a category for an admin", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/v1/categories")
      .set("Cookie", authCookie(admin.id))
      .send({ name: "Speakers", thumbnail });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: "Speakers",
      thumbnail: resolved(thumbnail),
    });
  });

  it("refuses a non-admin", async () => {
    const user = await createUser();

    const res = await request(app)
      .post("/api/v1/categories")
      .set("Cookie", authCookie(user.id))
      .send({ name: "Speakers", thumbnail });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
  });
});

describe("POST /api/v1/categories validation", () => {
  const reject = async (image: unknown) => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/v1/categories")
      .set("Cookie", authCookie(admin.id))
      .send({ name: "Speakers", thumbnail: { altText: "Speakers", image } });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    return res.body.error.details;
  };

  it("rejects a URL in place of a key", async () => {
    const details = await reject({
      ...thumbnail.image,
      key: `https://audiophile-media.t-bendet.com/${thumbnail.image.key}`,
    });

    expect(details).toContainEqual(
      expect.objectContaining({ path: ["body", "thumbnail", "image", "key"] }),
    );
  });

  it("rejects a missing dimension", async () => {
    const details = await reject({
      key: thumbnail.image.key,
      width: thumbnail.image.width,
    });

    expect(details).toContainEqual(
      expect.objectContaining({
        path: ["body", "thumbnail", "image", "height"],
      }),
    );
  });
});

describe("PATCH /api/v1/categories/:id", () => {
  it.for([
    [
      "a URL in place of a key",
      {
        ...thumbnail.image,
        key: `https://audiophile-media.t-bendet.com/${thumbnail.image.key}`,
      },
    ],
    ["a missing dimension", { key: thumbnail.image.key, width: 438 }],
  ] as const)("rejects %s", async ([, image]) => {
    const admin = await createAdmin();
    const category = await createCategory();

    const res = await request(app)
      .patch(`/api/v1/categories/${category.id}`)
      .set("Cookie", authCookie(admin.id))
      .send({ thumbnail: { altText: "Speakers", image } });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });
});

describe("DELETE /api/v1/categories/:id", () => {
  it("deletes a category for an admin", async () => {
    const admin = await createAdmin();
    const category = await createCategory();

    const res = await request(app)
      .delete(`/api/v1/categories/${category.id}`)
      .set("Cookie", authCookie(admin.id));

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });
});
