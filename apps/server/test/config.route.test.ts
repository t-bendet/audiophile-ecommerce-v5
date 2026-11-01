import { ErrorCode } from "@repo/domain";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import {
  ABSENT_ID,
  authCookie,
  createAdmin,
  createConfig,
  createProduct,
  createUser,
  resetDatabase,
} from "./helpers/database.js";

beforeEach(resetDatabase);

describe("GET /api/v1/config", () => {
  it("returns the singleton config", async () => {
    const config = await createConfig();

    const res = await request(app).get("/api/v1/config");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: config.id,
      featuredProductId: config.featuredProductId,
    });
  });

  it("returns null when no config has been seeded", async () => {
    const res = await request(app).get("/api/v1/config");

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });
});

describe("POST /api/v1/config", () => {
  it("creates a config for an admin", async () => {
    const admin = await createAdmin();
    const [featured, cover, grid, wide] = await Promise.all([
      createProduct(),
      createProduct(),
      createProduct(),
      createProduct(),
    ]);

    const res = await request(app)
      .post("/api/v1/config")
      .set("Cookie", authCookie(admin.id))
      .send({
        name: "primary",
        featuredProductId: featured.id,
        showCaseCoverId: cover.id,
        showCaseGridId: grid.id,
        showCaseWideId: wide.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: "primary",
      featuredProductId: featured.id,
    });
  });

  it("rejects a malformed featured product id", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .post("/api/v1/config")
      .set("Cookie", authCookie(admin.id))
      .send({
        name: "primary",
        featuredProductId: "not-an-id",
        showCaseCoverId: ABSENT_ID,
        showCaseGridId: ABSENT_ID,
        showCaseWideId: ABSENT_ID,
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ path: ["body", "featuredProductId"] }],
    });
  });

  it("refuses a non-admin", async () => {
    const user = await createUser();

    const res = await request(app)
      .post("/api/v1/config")
      .set("Cookie", authCookie(user.id))
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
  });
});

describe("PATCH /api/v1/config/:id", () => {
  const patch = (adminId: string, configId: string, body: unknown) =>
    request(app)
      .patch(`/api/v1/config/${configId}`)
      .set("Cookie", authCookie(adminId))
      .send(body);

  it("moves a slot to another product that carries its image", async () => {
    const admin = await createAdmin();
    const config = await createConfig();
    const next = await createProduct();

    const res = await patch(admin.id, config.id, {
      featuredProductId: next.id,
      showCaseCoverId: config.showCaseWideId,
      showCaseWideId: config.showCaseCoverId,
    });

    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.data).toMatchObject({
      id: config.id,
      featuredProductId: next.id,
      showCaseCoverId: config.showCaseWideId,
      showCaseWideId: config.showCaseCoverId,
      showCaseGridId: config.showCaseGridId,
    });
  });

  it("rejects slots that share a product, with a detail on each", async () => {
    const admin = await createAdmin();
    const config = await createConfig();

    const res = await patch(admin.id, config.id, {
      featuredProductId: config.showCaseGridId,
      showCaseCoverId: config.showCaseGridId,
      showCaseWideId: config.showCaseWideId,
      showCaseGridId: config.showCaseGridId,
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(
      (res.body.error.details as { path: string[] }[]).map((d) => d.path),
    ).toEqual([
      ["body", "featuredProductId"],
      ["body", "showCaseCoverId"],
      ["body", "showCaseGridId"],
    ]);
    expect(await request(app).get("/api/v1/config")).toMatchObject({
      body: { data: { featuredProductId: config.featuredProductId } },
    });
  });

  it("rejects one sent slot that collides with a stored one", async () => {
    const admin = await createAdmin();
    const config = await createConfig();

    const res = await patch(admin.id, config.id, {
      showCaseWideId: config.showCaseCoverId,
    });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual([
      expect.objectContaining({ path: ["body", "showCaseWideId"] }),
    ]);
  });

  it("rejects a featured product without a featured image", async () => {
    const admin = await createAdmin();
    const config = await createConfig();
    const plain = await createProduct({ featuredImage: null });

    const res = await patch(admin.id, config.id, {
      featuredProductId: plain.id,
    });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [
        {
          path: ["body", "featuredProductId"],
          message: "The featured product needs a featured image",
        },
      ],
    });
  });

  it("rejects a showcase product without a showcase image", async () => {
    const admin = await createAdmin();
    const config = await createConfig();
    const plain = await createProduct({ showCaseImage: null });

    const res = await patch(admin.id, config.id, {
      showCaseGridId: plain.id,
    });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [
        {
          path: ["body", "showCaseGridId"],
          message: "A showcase product needs a showcase image",
        },
      ],
    });
  });

  it("rejects a slot naming a product that does not exist", async () => {
    const admin = await createAdmin();
    const config = await createConfig();

    const res = await patch(admin.id, config.id, {
      showCaseCoverId: ABSENT_ID,
    });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual([
      expect.objectContaining({ path: ["body", "showCaseCoverId"] }),
    ]);
  });

  it("returns NOT_FOUND for a config that does not exist", async () => {
    const admin = await createAdmin();

    const res = await patch(admin.id, ABSENT_ID, { name: "primary" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe(ErrorCode.NOT_FOUND);
  });
});

describe("DELETE /api/v1/config/:id", () => {
  it("deletes the config for an admin", async () => {
    const admin = await createAdmin();
    const config = await createConfig();

    const res = await request(app)
      .delete(`/api/v1/config/${config.id}`)
      .set("Cookie", authCookie(admin.id));

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });
});
