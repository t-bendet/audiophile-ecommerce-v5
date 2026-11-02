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
import { createUser, resetDatabase } from "./helpers/database.js";

const FORGOT_PASSWORD = "/api/v1/auth/forgot-password";
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
