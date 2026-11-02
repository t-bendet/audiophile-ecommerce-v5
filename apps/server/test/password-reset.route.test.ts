import { prisma } from "@repo/database";
import { ErrorCode, PASSWORD_RESET_EXPIRY_MS } from "@repo/domain";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../src/app.js";
import globalErrorHandler from "../src/middlewares/error.middleware.js";
import authRouter from "../src/routes/auth.route.js";
import { emailTransport, outbox } from "../src/utils/email.js";
import { httpLogger } from "../src/utils/logger.js";
import { hashPasswordResetToken } from "../src/utils/password-reset-token.js";
import {
  createRateLimiter,
  PASSWORD_RESET_LIMIT,
} from "../src/utils/rateLimiters.js";
import {
  createUser,
  resetDatabase,
  staleAuthCookie,
  TEST_PASSWORD,
} from "./helpers/database.js";

const FORGOT_PASSWORD = "/api/v1/auth/forgot-password";
const RESET_PASSWORD = "/api/v1/auth/reset-password";
const RESET_LINK =
  /http:\/\/localhost:5173\/auth\/reset-password\?token=([a-f0-9]{64})/;

const forgotPassword = (body: object, target: express.Express = app) =>
  request(target).post(FORGOT_PASSWORD).send(body);

const tokenIn = (text: string): string => {
  const match = RESET_LINK.exec(text);
  expect(match, text).not.toBeNull();
  return match![1]!;
};

const storedReset = (userId: string) =>
  prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { passwordResetToken: true, passwordResetExpires: true },
  });

const SAME_ANSWER = { success: true, data: null };

beforeEach(async () => {
  await resetDatabase();
  outbox.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/v1/auth/forgot-password", () => {
  it("emails an active user a one-time link and stores only its hash with an expiry", async () => {
    const user = await createUser({ name: "Ada", email: "ada@example.com" });
    const before = Date.now();

    const res = await forgotPassword({ email: "ada@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(SAME_ANSWER);
    expect(outbox.messages).toHaveLength(1);
    const [email] = outbox.addressedTo("ada@example.com");
    expect(email).toMatchObject({
      to: "ada@example.com",
      subject: "Reset your Audiophile password",
    });
    const token = tokenIn(email!.text);
    expect(email!.html).toContain(`?token=${token}`);

    const stored = await storedReset(user.id);
    expect(stored.passwordResetToken).toBe(hashPasswordResetToken(token));
    expect(stored.passwordResetToken).not.toBe(token);
    const expiresIn = stored.passwordResetExpires!.getTime() - before;
    expect(expiresIn).toBeGreaterThanOrEqual(PASSWORD_RESET_EXPIRY_MS - 5000);
    expect(expiresIn).toBeLessThanOrEqual(PASSWORD_RESET_EXPIRY_MS + 5000);
    expect(email!.idempotencyKey).toBe(
      `password-reset/${user.id}/${stored.passwordResetExpires!.getTime()}`,
    );
  });

  it("answers an unknown email the same and sends nothing", async () => {
    const res = await forgotPassword({ email: "nobody@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(SAME_ANSWER);
    expect(outbox.messages).toEqual([]);
  });

  it("answers a deactivated user the same, sends nothing and stores no token", async () => {
    const user = await createUser({
      email: "gone@example.com",
      active: false,
    });

    const res = await forgotPassword({ email: "gone@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(SAME_ANSWER);
    expect(outbox.messages).toEqual([]);
    expect(await storedReset(user.id)).toEqual({
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  });

  it("replaces the first token with the second on a new request", async () => {
    const user = await createUser({ email: "ada@example.com" });

    await forgotPassword({ email: "ada@example.com" });
    await forgotPassword({ email: "ada@example.com" });

    const [first, second] = outbox.addressedTo("ada@example.com");
    const firstToken = tokenIn(first!.text);
    const secondToken = tokenIn(second!.text);
    expect(secondToken).not.toBe(firstToken);
    expect(second!.idempotencyKey).not.toBe(first!.idempotencyKey);
    const stored = await storedReset(user.id);
    expect(stored.passwordResetToken).toBe(hashPasswordResetToken(secondToken));
  });

  it("still answers the same when the email transport fails", async () => {
    vi.spyOn(emailTransport, "send").mockRejectedValueOnce(
      new Error("Resend answered 500: Internal server error"),
    );
    await createUser({ email: "ada@example.com" });

    const res = await forgotPassword({ email: "ada@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(SAME_ANSWER);
    expect(outbox.messages).toEqual([]);
  });

  it("rejects a body without an email at the email field", async () => {
    const res = await forgotPassword({});

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ path: ["body", "email"] }),
    );
  });

  it("rejects an unknown field", async () => {
    const res = await forgotPassword({
      email: "ada@example.com",
      role: "ADMIN",
    });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ code: "unrecognized_keys" }),
    );
    expect(outbox.messages).toEqual([]);
  });

  it("lets the test environment through however often it asks", async () => {
    for (let attempt = 0; attempt < PASSWORD_RESET_LIMIT.limit + 2; attempt++) {
      const res = await forgotPassword({ email: "nobody@example.com" });
      expect(res.status).toBe(200);
    }
  });
});

const NEW_PASSWORD = "new-password-42";

const RESET_TOKEN_INVALID = {
  code: ErrorCode.PASSWORD_RESET_TOKEN_INVALID,
  statusCode: 400,
  message: "This reset link is invalid or has expired.",
  details: [
    {
      code: "invalid",
      message: "This reset link is invalid or has expired.",
      path: ["body", "token"],
    },
  ],
};

const resetPassword = (body: object) =>
  request(app).post(RESET_PASSWORD).send(body);

const resetBody = (token: string, password = NEW_PASSWORD) => ({
  token,
  password,
  passwordConfirm: password,
});

const login = (email: string, password: string) =>
  request(app).post("/api/v1/auth/login").send({ email, password });

/** Asks the forgot route for a link and reads the raw token out of the newest email. */
const issuedToken = async (email: string): Promise<string> => {
  await forgotPassword({ email });
  const emails = outbox.addressedTo(email);
  return tokenIn(emails.at(-1)!.text);
};

const jwtCookieIn = (res: request.Response): string | undefined => {
  const cookies = res.headers["set-cookie"] as unknown as string[] | undefined;
  return cookies?.find((cookie) => cookie.startsWith("jwt="));
};

describe("POST /api/v1/auth/reset-password", () => {
  it("sets the new password, clears the token and signs the user in", async () => {
    const user = await createUser({ name: "Ada", email: "ada@example.com" });
    const token = await issuedToken("ada@example.com");

    const res = await resetPassword(resetBody(token));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { id: user.id, email: "ada@example.com", name: "Ada" },
    });
    expect(res.body.data).not.toHaveProperty("password");
    const cookie = jwtCookieIn(res);
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/HttpOnly/);
    expect(await storedReset(user.id)).toEqual({
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    expect((await login("ada@example.com", NEW_PASSWORD)).status).toBe(200);
    const oldPassword = await login("ada@example.com", TEST_PASSWORD);
    expect(oldPassword.status).toBe(401);
    expect(oldPassword.body.error.code).toBe(ErrorCode.INVALID_CREDENTIALS);
  });

  it("refuses the same token a second time", async () => {
    await createUser({ email: "ada@example.com" });
    const token = await issuedToken("ada@example.com");
    await resetPassword(resetBody(token));

    const res = await resetPassword(resetBody(token, "another-password"));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject(RESET_TOKEN_INVALID);
    expect(res.body.error.details).toEqual(RESET_TOKEN_INVALID.details);
    expect(jwtCookieIn(res)).toBeUndefined();
    expect((await login("ada@example.com", NEW_PASSWORD)).status).toBe(200);
  });

  it("refuses an expired token and keeps the old password", async () => {
    const user = await createUser({ email: "ada@example.com" });
    const token = await issuedToken("ada@example.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetExpires: new Date(Date.now() - 1000) },
    });

    const res = await resetPassword(resetBody(token));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject(RESET_TOKEN_INVALID);
    expect(jwtCookieIn(res)).toBeUndefined();
    expect((await login("ada@example.com", TEST_PASSWORD)).status).toBe(200);
  });

  it("refuses a token that was never issued", async () => {
    await createUser({ email: "ada@example.com" });
    await issuedToken("ada@example.com");

    const res = await resetPassword(resetBody("f".repeat(64)));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject(RESET_TOKEN_INVALID);
  });

  it("refuses an empty token with the same answer", async () => {
    const res = await resetPassword(resetBody(""));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject(RESET_TOKEN_INVALID);
  });

  it("refuses a token a newer request replaced, and takes the newer one", async () => {
    await createUser({ email: "ada@example.com" });
    const first = await issuedToken("ada@example.com");
    const second = await issuedToken("ada@example.com");

    const res = await resetPassword(resetBody(first));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject(RESET_TOKEN_INVALID);
    expect((await resetPassword(resetBody(second))).status).toBe(200);
  });

  it("ends the sessions signed in before the reset and keeps the one it starts", async () => {
    const user = await createUser({ email: "ada@example.com" });
    const earlierSession = staleAuthCookie(user.id);
    expect(
      (await request(app).get("/api/v1/users/me").set("Cookie", earlierSession))
        .status,
    ).toBe(200);
    const token = await issuedToken("ada@example.com");

    const res = await resetPassword(resetBody(token));

    const earlier = await request(app)
      .get("/api/v1/users/me")
      .set("Cookie", earlierSession);
    expect(earlier.status).toBe(401);
    expect(earlier.body.error.code).toBe(ErrorCode.UNAUTHORIZED);
    const fresh = await request(app)
      .get("/api/v1/users/me")
      .set("Cookie", jwtCookieIn(res)!.split(";")[0]!);
    expect(fresh.status).toBe(200);
  });

  it("refuses an account deactivated after the link was sent, without a cookie", async () => {
    const user = await createUser({ email: "ada@example.com" });
    const token = await issuedToken("ada@example.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { active: false },
    });

    const res = await resetPassword(resetBody(token));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.ACCOUNT_DEACTIVATED);
    expect(jwtCookieIn(res)).toBeUndefined();
  });

  it("rejects a confirmation that does not match, at the confirmation field", async () => {
    await createUser({ email: "ada@example.com" });
    const token = await issuedToken("ada@example.com");

    const res = await resetPassword({
      token,
      password: NEW_PASSWORD,
      passwordConfirm: "something-else",
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ path: ["body", "passwordConfirm"] }),
    );
  });

  it("rejects a body without a token, at the token field", async () => {
    const res = await resetPassword({
      password: NEW_PASSWORD,
      passwordConfirm: NEW_PASSWORD,
    });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ path: ["body", "token"] }),
    );
  });

  it("rejects an unknown field", async () => {
    const res = await resetPassword({
      ...resetBody("f".repeat(64)),
      role: "ADMIN",
    });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ code: "unrecognized_keys" }),
    );
  });
});

// `defineLimiter` stands every limiter down under NODE_ENV=test, so the policy
// runs here through the real limiter in front of the real auth router; the
// route manifest is what proves the limiter is mounted on the real route.
const rateLimitedApp = () => {
  const limited = express();
  limited.use(httpLogger);
  limited.use(express.json());
  limited.use(FORGOT_PASSWORD, createRateLimiter(PASSWORD_RESET_LIMIT));
  limited.use("/api/v1/auth", authRouter);
  limited.use(globalErrorHandler);
  return limited;
};

describe("POST /api/v1/auth/forgot-password rate limit", () => {
  it("answers the fourth request in an hour with the rate limit envelope", async () => {
    const limited = rateLimitedApp();

    const statuses: number[] = [];
    let last: request.Response | undefined;
    for (let attempt = 0; attempt < 4; attempt++) {
      last = await forgotPassword({ email: "nobody@example.com" }, limited);
      statuses.push(last.status);
    }

    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(last!.body).toMatchObject({
      success: false,
      data: null,
      error: {
        code: ErrorCode.TOO_MANY_REQUESTS,
        statusCode: 429,
        message: PASSWORD_RESET_LIMIT.message,
      },
    });
    expect(last!.headers["retry-after"]).toBeDefined();
    expect(last!.headers["ratelimit-limit"]).toBe("3");
  });
});
