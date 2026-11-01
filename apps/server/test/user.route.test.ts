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

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });
});

const listUsers = (adminId: string, query = "") =>
  request(app).get(`/api/v1/users${query}`).set("Cookie", authCookie(adminId));

const emails = (res: request.Response) =>
  (res.body.data as { email: string }[]).map((user) => user.email).sort();

describe("GET /api/v1/users", () => {
  it("lists users for an admin, deactivated ones included", async () => {
    const admin = await createAdmin();
    await createUser({ email: "gone@example.com", active: false });

    const res = await listUsers(admin.id);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 1, total: 2 });
    expect(res.body.data).toContainEqual(
      expect.objectContaining({ email: "gone@example.com", active: false }),
    );
  });

  it("searches name and email case-insensitively", async () => {
    const admin = await createAdmin({ name: "owner", email: "o@example.com" });
    await createUser({ name: "Ada Lovelace", email: "ada@example.com" });
    await createUser({ name: "Grace", email: "grace@LOVELACE.org" });
    await createUser({ name: "Bob", email: "bob@example.com" });

    const res = await listUsers(admin.id, "?search=lovelace");

    expect(res.status).toBe(200);
    expect(emails(res)).toEqual(["ada@example.com", "grace@LOVELACE.org"]);
  });

  it("filters by role and active state", async () => {
    const admin = await createAdmin({ email: "admin@example.com" });
    await createUser({ email: "on@example.com" });
    await createUser({ email: "off@example.com", active: false });

    const admins = await listUsers(admin.id, "?role=ADMIN");
    expect(emails(admins)).toEqual(["admin@example.com"]);

    const inactive = await listUsers(admin.id, "?active=false");
    expect(emails(inactive)).toEqual(["off@example.com"]);

    const activeShoppers = await listUsers(admin.id, "?role=USER&active=true");
    expect(activeShoppers.body.meta.total).toBe(1);
    expect(emails(activeShoppers)).toEqual(["on@example.com"]);
  });

  it("rejects an unknown filter value", async () => {
    const admin = await createAdmin();

    for (const query of ["?active=maybe", "?role=OWNER", "?sort=password"]) {
      const res = await listUsers(admin.id, query);
      expect(res.status, query).toBe(422);
      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    }
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

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ path: ["params", "id"] }],
    });
  });
});

describe("DELETE /api/v1/users/deleteMe", () => {
  it("deactivates the signed-in user, whose session ends on its next request", async () => {
    const user = await createUser();
    const cookie = authCookie(user.id);

    const res = await request(app)
      .delete("/api/v1/users/deleteMe")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);

    const after = await request(app)
      .get("/api/v1/users/me")
      .set("Cookie", cookie);
    expect(after.status).toBe(403);
    expect(after.body.error).toMatchObject({
      code: ErrorCode.ACCOUNT_DEACTIVATED,
      message: "This account has been deactivated.",
    });
  });
});

describe("PATCH /api/v1/users/:id", () => {
  it("lets an admin promote a user", async () => {
    const admin = await createAdmin();
    const user = await createUser();

    const res = await request(app)
      .patch(`/api/v1/users/${user.id}`)
      .set("Cookie", authCookie(admin.id))
      .send({ name: user.name, role: "ADMIN" });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("ADMIN");
  });

  it("lets an admin deactivate and reactivate a user", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const cookie = authCookie(admin.id);

    const off = await request(app)
      .patch(`/api/v1/users/${user.id}`)
      .set("Cookie", cookie)
      .send({ active: false });
    expect(off.status).toBe(200);
    expect(off.body.data.active).toBe(false);

    const shown = await request(app)
      .get(`/api/v1/users/${user.id}`)
      .set("Cookie", cookie);
    expect(shown.status).toBe(200);
    expect(shown.body.data.active).toBe(false);

    const on = await request(app)
      .patch(`/api/v1/users/${user.id}`)
      .set("Cookie", cookie)
      .send({ active: true });
    expect(on.status).toBe(200);
    expect(on.body.data.active).toBe(true);
  });

  it("refuses to deactivate the requesting admin", async () => {
    const admin = await createAdmin();

    const res = await request(app)
      .patch(`/api/v1/users/${admin.id}`)
      .set("Cookie", authCookie(admin.id))
      .send({ active: false });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);

    const still = await request(app)
      .get("/api/v1/users/me")
      .set("Cookie", authCookie(admin.id));
    expect(still.status).toBe(200);
    expect(still.body.data.active).toBe(true);
  });
});
