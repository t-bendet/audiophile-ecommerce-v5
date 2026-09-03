import { randomUUID } from "node:crypto";
import { pino, type Logger, type LoggerOptions } from "pino";
import { pinoHttp, type Options as PinoHttpOptions } from "pino-http";
import { env } from "./env.js";

/**
 * Values that must never reach the log output. `req`/`res` follow the shape
 * produced by pino's standard serializers; the bare and single-wildcard
 * password paths cover anything a call site passes in by hand.
 */
const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.body.password",
  "req.body.passwordConfirm",
  'res.headers["set-cookie"]',
  "password",
  "passwordConfirm",
  "*.password",
  "*.passwordConfirm",
];

/**
 * Base pino configuration. Exported so tests can build a logger with the same
 * redaction and serializers while pointing it at their own stream.
 */
export const loggerOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
  redact: redactPaths,
  ...(env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
};

export const logger: Logger = pino(loggerOptions);

/**
 * Request-logger configuration. `requestId` is bound onto the child logger
 * pino-http hangs off `req.log`, so every line logged during a request - the
 * completion line included - carries the same id the client got back in the
 * `x-request-id` response header.
 */
export const httpLoggerOptions: PinoHttpOptions = {
  genReqId: (req, res) => {
    const incoming = req.headers["x-request-id"];
    const id =
      (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  customProps: (req) => ({ requestId: req.id }),
  // Without this pino-http reports every request at `info`, including the ones
  // that failed. The error middleware puts the real error on `res.err` and the
  // severity it decided on `res.errLogLevel`, so the completion line is also
  // the failure line - and only the boundary knows whether the failure was
  // ours or the caller's, which the status code alone cannot say.
  customLogLevel: (_req, res) =>
    res.errLogLevel ?? (res.statusCode >= 500 ? "error" : "info"),
};

export const httpLogger = pinoHttp({ ...httpLoggerOptions, logger });
