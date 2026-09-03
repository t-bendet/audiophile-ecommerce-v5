import { ErrorCode } from "@repo/domain";
import express from "express";
import { pino } from "pino";
import { pinoHttp } from "pino-http";
import request from "supertest";
import { describe, expect, it } from "vitest";
import globalErrorHandler from "../src/middlewares/error.middleware.js";
import { httpLoggerOptions, loggerOptions } from "../src/utils/logger.js";
import { createRateLimiter } from "../src/utils/rateLimiters.js";

type LogLine = {
  level?: number;
  err?: { type?: string; message?: string };
  requestId?: string;
  res?: { statusCode?: number };
};

const collect = () => {
  const lines: LogLine[] = [];
  const stream = {
    write(chunk: string) {
      lines.push(JSON.parse(chunk));
    },
  };
  const logger = pino({ ...loggerOptions, level: "info" }, stream);
  return { lines, logger };
};

// Each call builds its own limiter, so every test owns a fresh MemoryStore and
// nothing leaks between them. `limit: 1` makes the second request the rejected
// one, so no test has to burn a production-sized quota - and none of this
// touches the singleton app, whose global limiter is shared process-wide.
const rateLimitedApp = (
  logger: ReturnType<typeof collect>["logger"],
  message = "slow down",
) => {
  const app = express();
  app.use(pinoHttp({ ...httpLoggerOptions, logger }));
  app.use(createRateLimiter({ limit: 1, windowMs: 60_000, message }));
  app.get("/ping", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.use(globalErrorHandler);
  return app;
};

describe("rate limiting", () => {
  it("lets a request under the limit through", async () => {
    const { logger } = collect();

    const res = await request(rateLimitedApp(logger)).get("/ping");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("rejects over the limit with the standard error envelope", async () => {
    const { logger } = collect();
    const app = rateLimitedApp(logger);

    await request(app).get("/ping");
    const res = await request(app).get("/ping");

    expect(res.status).toBe(429);
    expect(res.body).toMatchObject({
      success: false,
      data: null,
      error: {
        code: ErrorCode.TOO_MANY_REQUESTS,
        statusCode: 429,
        message: "slow down",
      },
    });
    // NODE_ENV=test takes the production branch, which never leaks a stack.
    expect(res.body.error.stack).toBeUndefined();
    expect(res.body.error.requestId).toBe(res.headers["x-request-id"]);
  });

  it("keeps the rate limit headers through the error middleware", async () => {
    const { logger } = collect();
    const app = rateLimitedApp(logger);

    await request(app).get("/ping");
    const res = await request(app).get("/ping");

    expect(res.headers["retry-after"]).toBeDefined();
    expect(res.headers["ratelimit-limit"]).toBe("1");
    expect(res.headers["ratelimit-remaining"]).toBe("0");
    // legacyHeaders: false
    expect(res.headers["x-ratelimit-limit"]).toBeUndefined();
  });

  it("logs a rejection as a client error, not a server failure", async () => {
    const { lines, logger } = collect();
    const app = rateLimitedApp(logger);

    await request(app).get("/ping");
    const res = await request(app).get("/ping");

    expect(res.status).toBe(429);
    expect(lines).toHaveLength(2);
    expect(lines[1]!.level).toBe(30);
    expect(lines[1]!.err).toBeUndefined();
    expect(lines[1]!.res?.statusCode).toBe(429);
  });
});
