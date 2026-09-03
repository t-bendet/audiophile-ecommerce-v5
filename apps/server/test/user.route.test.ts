import { ErrorCode } from "@repo/domain";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import {
  authCookie,
  createAdmin,
  createUser,
  resetDatabase,
} from "./helpers/database.js";

beforeEach(resetDatabase);

describe("GET /api/v1/users/me", () => {
  it("returns the signed-in user", async () => {
    const user = await createUser();

    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Cookie", authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: user.id,
      email: user.email,
      role: "USER",
    });
  });

  it("rejects an anonymous caller", async () => {
    const res = await request(app).get("/api/v1/users/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCode.UNAUTHORIZED);
  });
});

describe("PATCH /api/v1/users/updateMe", () => {
  it("updates the name", async () => {
    const user = await createUser();

    const res = await request(app)
      .patch("/api/v1/users/updateMe")
      .set("Cookie", authCookie(user.id))
      .send({ name: "Renamed" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Renamed");
  });

  it("rejects an unknown field", async () => {
    const user = await createUser();

    const res = await request(app)
      .patch("/api/v1/users/updateMe")
      .set("Cookie", authCookie(user.id))
      .send({ role: "ADMIN" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });
});

describe("GET /api/v1/users", () => {
  it("lists users for an admin", async () => {
    const admin = await createAdmin();
    await createUser();

    const res = await request(app)
      .get("/api/v1/users")
      .set("Cookie", authCookie(admin.id));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 1, total: 2 });
  });

  it("refuses a non-admin", async () => {
    const user = await createUser();

    const res = await request(app)
      .get("/api/v1/users")
      .set("Cookie", authCookie(user.id));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
  });
});

describe("GET /api/v1/users/:id", () => {
  it("returns VALIDATION_ERROR for a malformed id", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .get("/api/v1/users/not-an-id")
      .set("Cookie", authCookie(admin.id));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ path: ["params", "id"] }],
    });
  });
});
