import { prisma } from "@repo/database";
import figlet from "figlet";
import type { Server } from "node:http";
import app from "./app.js";
import { env } from "./utils/env.js";
import { logger } from "./utils/logger.js";

const port = env.PORT;
const SHUTDOWN_TIMEOUT_MS = 10_000;

let server: Server | undefined;
let shuttingDown = false;

function logBanner(devText: string, prodText: string) {
  if (env.NODE_ENV === "development") {
    logger.info(
      figlet.textSync(devText, {
        font: "Ogre",
        horizontalLayout: "controlled smushing",
        verticalLayout: "default",
        width: 100,
        whitespaceBreak: true,
      }),
    );
  } else {
    logger.info(prodText);
  }
}

// Handle synchronous exceptions - must be registered before any async code
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught exception, shutting down");
  void shutdown("uncaughtException", 1);
});

async function start() {
  try {
    await prisma.$connect();
    // `$connect` only starts the engine; MongoDB is not reached until a command runs.
    await prisma.$runCommandRaw({ ping: 1 });
  } catch (err) {
    const hint = env.DATABASE_URL.startsWith("mongodb://localhost")
      ? " Is the local database running? Start it with `docker compose up -d --wait`."
      : "";
    logger.fatal({ err }, `database connection failed, shutting down.${hint}`);
    process.exit(1);
  }

  logBanner("Mongo connected", "Database connected");

  // A signal may have arrived while we were still connecting - don't start
  // accepting traffic into a server that's already being torn down.
  if (shuttingDown) return;

  server = app.listen(port, () => {
    logBanner(`Server : port  ${port}`, `Server listening on port ${port}`);
  });
}

async function shutdown(signal: string, exitCode: number) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, "signal received, shutting down gracefully");

  const forceExitTimer = setTimeout(() => {
    logger.error(
      { timeoutMs: SHUTDOWN_TIMEOUT_MS },
      "shutdown timed out, forcing exit",
    );
    process.exit(exitCode);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  // Let boot finish (or fail) before touching `server`/prisma, otherwise a
  // slow-to-connect start() can race the shutdown sequence.
  await startPromise?.catch(() => {});

  await new Promise<void>((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });

  try {
    await prisma.$disconnect();
  } catch (err) {
    logger.error({ err }, "error disconnecting Prisma during shutdown");
  }

  logger.info("shutdown complete");
  process.exit(exitCode);
}

// Graceful shutdown for container orchestration (Docker, K8s) and local dev (Ctrl-C)
process.on("SIGTERM", () => void shutdown("SIGTERM", 0));
process.on("SIGINT", () => void shutdown("SIGINT", 0));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  logger.fatal({ err }, "unhandled rejection, shutting down");
  void shutdown("unhandledRejection", 1);
});

const startPromise = start();
