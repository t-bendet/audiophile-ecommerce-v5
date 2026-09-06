import { ErrorCode } from "@repo/domain";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import {
  authCookie,
  createUser,
  expiredAuthCookie,
  resetDatabase,
  tamperedAuthCookie,
  TEST_PASSWORD,
} from "./helpers/database.js";

const signupBody = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: TEST_PASSWORD,
  passwordConfirm: TEST_PASSWORD,
};

beforeEach(resetDatabase);

describe("POST /api/v1/auth/signup", () => {
  it("creates the user and sets a jwt cookie", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send(signupBody);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: signupBody.name,
      email: signupBody.email,
      role: "USER",
    });
    expect(res.body.data.password).toBeUndefined();
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^jwt=.+HttpOnly/i);
  });

  // The unique index this leans on only exists because the global setup pushes
  // the schema; without it Prisma never raises P2002 and the 409 never happens.
  it("rejects an email that is already taken", async () => {
    await createUser({ email: signupBody.email });

    const res = await request(app).post("/api/v1/auth/signup").send(signupBody);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe(ErrorCode.DUPLICATE_ENTRY);
  });

  it("rejects a passwordConfirm that does not match", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({ ...signupBody, passwordConfirm: "something-else" });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ path: ["body", "passwordConfirm"] }],
    });
  });
});

describe("POST /api/v1/auth/login", () => {
  it("returns the user for correct credentials", async () => {
    const user = await createUser({ email: "grace@example.com" });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: user.id, email: user.email });
  });

  it("rejects a wrong password without saying which field was wrong", async () => {
    const user = await createUser({ email: "hopper@example.com" });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.INVALID_CREDENTIALS,
      message: "Incorrect email or password",
    });
  });
});

describe("PATCH /api/v1/auth/updateMyPassword", () => {
  it("re-issues a cookie for an authenticated user", async () => {
    const user = await createUser();

    const res = await request(app)
      .patch("/api/v1/auth/updateMyPassword")
      .set("Cookie", authCookie(user.id))
      .send({
        currentPassword: TEST_PASSWORD,
        password: "new-password-1",
        passwordConfirm: "new-password-1",
      });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^jwt=/);
  });

  it("rejects an unauthenticated caller", async () => {
    const res = await request(app).patch("/api/v1/auth/updateMyPassword").send({
      currentPassword: TEST_PASSWORD,
      password: "new-password-1",
      passwordConfirm: "new-password-1",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCode.UNAUTHORIZED);
  });
});

describe("GET /api/v1/auth/status", () => {
  it("reports a signed-in user as authenticated", async () => {
    const user = await createUser();

    const res = await request(app)
      .get("/api/v1/auth/status")
      .set("Cookie", authCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ isAuthenticated: true });
  });

  it("reports an anonymous caller as not authenticated", async () => {
    const res = await request(app).get("/api/v1/auth/status");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ isAuthenticated: false });
  });

  // The status route answers a question; a dead cookie is an answer, not a
  // failure. A 401 here breaks the client loaders that gate on it.
  it("reports an expired token as not authenticated", async () => {
    const user = await createUser();

    const res = await request(app)
      .get("/api/v1/auth/status")
      .set("Cookie", expiredAuthCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ isAuthenticated: false });
  });

  it("reports a tampered token as not authenticated", async () => {
    const user = await createUser();

    const res = await request(app)
      .get("/api/v1/auth/status")
      .set("Cookie", tamperedAuthCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ isAuthenticated: false });
  });

  it("reports a deleted user as not authenticated", async () => {
    const user = await createUser();
    const cookie = authCookie(user.id);
    await resetDatabase();

    const res = await request(app)
      .get("/api/v1/auth/status")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ isAuthenticated: false });
  });
});

describe("protected routes still reject a dead cookie", () => {
  it("returns TOKEN_EXPIRED for an expired token", async () => {
    const user = await createUser();

    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Cookie", expiredAuthCookie(user.id));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCode.TOKEN_EXPIRED);
  });

  it("returns INVALID_TOKEN for a tampered token", async () => {
    const user = await createUser();

    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Cookie", tamperedAuthCookie(user.id));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCode.INVALID_TOKEN);
  });
});
