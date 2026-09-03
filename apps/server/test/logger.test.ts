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
  let arrived: (() => void) | undefined;
  const stream = {
    write(chunk: string) {
      lines.push(JSON.parse(chunk));
      arrived?.();
    },
  };
  const logger = pino({ ...loggerOptions, level: "info" }, stream);

  // pino-http writes the completion line from the response's `finish` event,
  // which nothing orders against supertest resolving on the client side.
  const linesReaching = (expected: number, timeoutMs = 1000) =>
    new Promise<[LogLine, ...LogLine[]]>((resolve, reject) => {
      const settle = () => {
        if (lines.length < expected) return;
        clearTimeout(timer);
        arrived = undefined;
        resolve(lines as [LogLine, ...LogLine[]]);
      };
      const timer = setTimeout(() => {
        arrived = undefined;
        reject(
          new Error(
            `Timed out after ${timeoutMs}ms waiting for ${expected} log line(s); ${lines.length} arrived`,
          ),
        );
      }, timeoutMs);
      arrived = settle;
      settle();
    });

  return { lines, logger, linesReaching };
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
    const { lines, logger, linesReaching } = collect();

    await request(appWith(logger)).get("/hello");
    const [line] = await linesReaching(1);

    expect(lines).toHaveLength(1);
    expect(line).toMatchObject({
      req: { method: "GET", url: "/hello" },
      res: { statusCode: 200 },
    });
    expect(typeof line.responseTime).toBe("number");
    expect(line.requestId).toBe(line.req!.id);
  });

  it("reuses a client-sent x-request-id and echoes it back", async () => {
    const { logger, linesReaching } = collect();

    const res = await request(appWith(logger))
      .get("/hello")
      .set("x-request-id", "client-supplied-id");
    const [line] = await linesReaching(1);

    expect(res.headers["x-request-id"]).toBe("client-supplied-id");
    expect(line.requestId).toBe("client-supplied-id");
  });

  it("generates a request id when the client sends none", async () => {
    const { logger, linesReaching } = collect();

    const res = await request(appWith(logger)).get("/hello");
    const [line] = await linesReaching(1);

    expect(res.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(line.requestId).toBe(res.headers["x-request-id"]);
  });

  it("redacts credential headers on the request and the response", async () => {
    const { lines, logger, linesReaching } = collect();
    const app = appWith(logger);
    app.get("/secret", (_req, res) => {
      res.setHeader("set-cookie", "jwt=super-secret-token; HttpOnly");
      res.status(200).json({ ok: true });
    });

    await request(app)
      .get("/secret")
      .set("authorization", "Bearer super-secret-token")
      .set("cookie", "jwt=super-secret-token");
    const [line] = await linesReaching(1);

    const output = JSON.stringify(lines);
    expect(output).not.toContain("super-secret-token");
    expect(line.req!.headers.authorization).toBe("[Redacted]");
    expect(line.req!.headers.cookie).toBe("[Redacted]");
    expect(line.res!.headers["set-cookie"]).toBe("[Redacted]");
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
    const { lines, logger, linesReaching } = collect();

    const res = await request(
      appThatFailsWith(logger, () => {
        throw new Error("kaboom");
      }),
    ).get("/boom");
    const [line] = await linesReaching(1);

    expect(res.status).toBe(500);
    expect(lines).toHaveLength(1);
    expect(line.level).toBe(50);
    expect(line.err?.message).toBe("kaboom");
    expect(res.body.error.requestId).toBe(line.requestId);
  });

  it("logs a server failure the client asked for at error level", async () => {
    const { lines, logger, linesReaching } = collect();

    const res = await request(
      appThatFailsWith(logger, () => {
        throw new AppError("broken", ErrorCode.INTERNAL_ERROR);
      }),
    ).get("/boom");
    const [line] = await linesReaching(1);

    expect(res.status).toBe(500);
    expect(lines).toHaveLength(1);
    expect(line.level).toBe(50);
  });

  it("downgrades a client fault to warn instead of dropping it", async () => {
    const { lines, logger, linesReaching } = collect();

    const res = await request(
      appThatFailsWith(logger, () => {
        throw new AppError("nope", ErrorCode.NOT_FOUND);
      }),
    ).get("/boom");
    const [line] = await linesReaching(1);

    expect(res.status).toBe(404);
    expect(lines).toHaveLength(1);
    expect(line.level).toBe(40);
    expect(line.err?.message).toBe("nope");
  });

  // A malformed Prisma query means our query shape is wrong, and `normalizeError`
  // launders it into an ordinary validation error - so only the origin flag can
  // still tell the boundary this one is a bug of ours.
  it("logs a programmer error at error level even when it maps to a 4xx", async () => {
    const { lines, logger, linesReaching } = collect();
    const prismaValidationError = Object.assign(
      new Error("Invalid `prisma.product.findMany()` invocation"),
      { name: "PrismaClientValidationError" },
    );

    const res = await request(
      appThatFailsWith(logger, () => {
        throw prismaValidationError;
      }),
    ).get("/boom");
    const [line] = await linesReaching(1);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(lines).toHaveLength(1);
    expect(line.level).toBe(50);
  });

  it("keeps the operational flag out of the response body", async () => {
    const { logger } = collect();

    const res = await request(
      appThatFailsWith(logger, () => {
        throw new AppError("nope", ErrorCode.NOT_FOUND);
      }),
    ).get("/boom");

    expect(JSON.stringify(res.body)).not.toContain("isOperational");
  });

  it("keeps a failure at error level when the response already went out", async () => {
    const { lines, logger, linesReaching } = collect();
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
    const [line] = await linesReaching(1);

    expect(res.status).toBe(200);
    expect(lines).toHaveLength(1);
    expect(line.level).toBe(50);
    expect(line.err?.message).toBe("late failure");
    expect(line.res?.statusCode).toBe(500);
  });
});
