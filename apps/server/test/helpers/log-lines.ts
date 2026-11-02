import { pino } from "pino";
import { loggerOptions } from "../../src/utils/logger.js";

/**
 * A logger built from the production options but writing to an in-memory
 * stream, so a test can read what a request logged. `level` is overridden
 * because the test environment runs the logger silent.
 */
export type LogLine = {
  level?: number;
  msg?: string;
  err?: { type?: string; message?: string };
  requestId?: string;
  orderId?: string;
  responseTime?: number;
  req?: {
    id?: string;
    method?: string;
    url?: string;
    headers: Record<string, string>;
  };
  res?: { statusCode?: number; headers: Record<string, string> };
};

export const collectLogLines = () => {
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

export type CollectedLogger = ReturnType<typeof collectLogLines>["logger"];
