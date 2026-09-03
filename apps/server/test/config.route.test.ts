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
