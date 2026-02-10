import { prisma } from "@repo/database";
import figlet from "figlet";
import app from "./app.js";
import { env } from "./utils/env.js";

const port = env.PORT;

// Handle synchronous exceptions - must be registered before any async code
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// Connect to database - fail fast if connection fails
prisma
  .$connect()
  .then(() => {
    if (env.NODE_ENV === "development") {
      console.log(
        figlet.textSync(`Mongo connected`, {
          font: "Ogre",
          horizontalLayout: "controlled smushing",
          verticalLayout: "default",
          width: 100,
          whitespaceBreak: true,
        }),
      );
    } else {
      console.log("Database connected");
    }
  })
  .catch((err) => {
    console.error("DATABASE CONNECTION FAILED! Shutting down...");
    console.error(err);
    process.exit(1);
  });

const server = app.listen(port, () => {
  if (env.NODE_ENV === "development") {
    console.log(
      figlet.textSync(`Server : port  ${port}`, {
        font: "Ogre",
        horizontalLayout: "controlled smushing",
        verticalLayout: "default",
        width: 100,
        whitespaceBreak: true,
      }),
    );
  } else {
    console.log(`Server listening on port ${port}`);
  }
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown for container orchestration (Docker, K8s)
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    prisma.$disconnect().then(() => {
      console.log("Process terminated");
      process.exit(0);
    });
  });
});
