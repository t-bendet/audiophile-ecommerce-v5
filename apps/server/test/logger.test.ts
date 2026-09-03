import { AppError, ErrorCode } from "@repo/domain";
import express from "express";
import { pino } from "pino";
import { pinoHttp } from "pino-http";
import request from "supertest";
import { describe, expect, it } from "vitest";
import globalErrorHandler from "../src/middlewares/error.middleware.js";
import { httpLoggerOptions, loggerOptions } from "../src/utils/logger.js";

// The exported option objects are the unit under test: production wires them
// into a logger writing to stdout, so here they are wired into an in-memory
// stream instead. `level` is overridden because the test environment runs the
// logger silent - everything else is exactly the production configuration.
type LogLine = {
  level?: number;
  err?: { type?: string; message?: string };
  requestId?: string;
  responseTime?: number;
  req?: {
    id?: string;
    method?: string;
    url?: string;
    headers: Record<string, string>;
  };
  res?: { statusCode?: number; headers: Record<string, string> };
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

const appWith = (logger: ReturnType<typeof collect>["logger"]) => {
  const app = express();
  app.use(pinoHttp({ ...httpLoggerOptions, logger }));
  app.get("/hello", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
};

describe("http logger", () => {
  it("emits one line per request with method, url, status, duration and requestId", async () => {
    const { lines, logger } = collect();

    await request(appWith(logger)).get("/hello");

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      req: { method: "GET", url: "/hello" },
      res: { statusCode: 200 },
    });
    expect(typeof lines[0]!.responseTime).toBe("number");
    expect(lines[0]!.requestId).toBe(lines[0]!.req!.id);
  });

  it("reuses a client-sent x-request-id and echoes it back", async () => {
    const { lines, logger } = collect();

    const res = await request(appWith(logger))
      .get("/hello")
      .set("x-request-id", "client-supplied-id");

    expect(res.headers["x-request-id"]).toBe("client-supplied-id");
    expect(lines[0]!.requestId).toBe("client-supplied-id");
  });

  it("generates a request id when the client sends none", async () => {
    const { lines, logger } = collect();

    const res = await request(appWith(logger)).get("/hello");

    expect(res.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(lines[0]!.requestId).toBe(res.headers["x-request-id"]);
  });

  it("redacts credential headers on the request and the response", async () => {
    const { lines, logger } = collect();
    const app = appWith(logger);
    app.get("/secret", (_req, res) => {
      res.setHeader("set-cookie", "jwt=super-secret-token; HttpOnly");
      res.status(200).json({ ok: true });
    });

    await request(app)
      .get("/secret")
      .set("authorization", "Bearer super-secret-token")
      .set("cookie", "jwt=super-secret-token");

    const output = JSON.stringify(lines);
    expect(output).not.toContain("super-secret-token");
    expect(lines[0]!.req!.headers.authorization).toBe("[Redacted]");
    expect(lines[0]!.req!.headers.cookie).toBe("[Redacted]");
    expect(lines[0]!.res!.headers["set-cookie"]).toBe("[Redacted]");
  });

  it("redacts password fields wherever they are logged", () => {
    const { lines, logger } = collect();

    logger.info({ password: "hunter2", passwordConfirm: "hunter2" }, "top");
    logger.info(
      { body: { password: "hunter2", passwordConfirm: "hunter2" } },
      "nested",
    );
    logger.info({ req: { body: { password: "hunter2" } } }, "request body");

    expect(JSON.stringify(lines)).not.toContain("hunter2");
  });
});

describe("error boundary logging", () => {
  const appThatFailsWith = (
    logger: ReturnType<typeof collect>["logger"],
    fail: () => never,
  ) => {
    const app = express();
    app.use(pinoHttp({ ...httpLoggerOptions, logger }));
    app.get("/boom", () => fail());
    app.use(globalErrorHandler);
    return app;
  };

  it("logs a server failure once, at error level, carrying the real error", async () => {
    const { lines, logger } = collect();

    const res = await request(
      appThatFailsWith(logger, () => {
        throw new Error("kaboom");
      }),
    ).get("/boom");

    expect(res.status).toBe(500);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.level).toBe(50);
    expect(lines[0]!.err?.message).toBe("kaboom");
    expect(res.body.error.requestId).toBe(lines[0]!.requestId);
  });

  it("leaves a client error at the default level with no error attached", async () => {
    const { lines, logger } = collect();

    const res = await request(
      appThatFailsWith(logger, () => {
        throw new AppError("nope", ErrorCode.NOT_FOUND);
      }),
    ).get("/boom");

    expect(res.status).toBe(404);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.level).toBe(30);
    expect(lines[0]!.err).toBeUndefined();
  });

  it("keeps a failure at error level when the response already went out", async () => {
    const { lines, logger } = collect();
    const app = express();
    app.use(pinoHttp({ ...httpLoggerOptions, logger }));
    // A double send: the client already has its 200, so the boundary can no
    // longer change what was delivered. It still marks the request failed, and
    // the log line has to say so - which is why the logged status (500, set on
    // a response that is already out) does not match what the client received.
    app.get("/late", (_req, res, next) => {
      res.status(200).json({ ok: true });
      next(new Error("late failure"));
    });
    app.use(globalErrorHandler);

    const res = await request(app).get("/late");

    expect(res.status).toBe(200);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.level).toBe(50);
    expect(lines[0]!.err?.message).toBe("late failure");
    expect(lines[0]!.res?.statusCode).toBe(500);
  });
});
