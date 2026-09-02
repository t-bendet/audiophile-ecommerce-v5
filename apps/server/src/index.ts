import { prisma } from "@repo/database";
import figlet from "figlet";
import type { Server } from "node:http";
import app from "./app.js";
import { env } from "./utils/env.js";

const port = env.PORT;
const SHUTDOWN_TIMEOUT_MS = 10_000;

let server: Server | undefined;
let shuttingDown = false;

function logBanner(devText: string, prodText: string) {
  if (env.NODE_ENV === "development") {
    console.log(
      figlet.textSync(devText, {
        font: "Ogre",
        horizontalLayout: "controlled smushing",
        verticalLayout: "default",
        width: 100,
        whitespaceBreak: true,
      }),
    );
  } else {
    console.log(prodText);
  }
}

// Handle synchronous exceptions - must be registered before any async code
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  void shutdown("uncaughtException", 1);
});

async function start() {
  try {
    await prisma.$connect();
  } catch (err) {
    console.error("DATABASE CONNECTION FAILED! Shutting down...");
    console.error(err);
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

  console.log(`${signal} received, shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    console.error("Shutdown timed out, forcing exit");
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
    console.error("Error disconnecting Prisma during shutdown:", err);
  }

  console.log("shutdown complete");
  process.exit(exitCode);
}

// Graceful shutdown for container orchestration (Docker, K8s) and local dev (Ctrl-C)
process.on("SIGTERM", () => void shutdown("SIGTERM", 0));
process.on("SIGINT", () => void shutdown("SIGINT", 0));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  console.error("UNHANDLED REJECTION!");
  console.error(err.name, err.message);
  void shutdown("unhandledRejection", 1);
});

const startPromise = start();
