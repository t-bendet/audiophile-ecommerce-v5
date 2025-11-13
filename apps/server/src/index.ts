import figlet from "figlet";
import app from "./app.js";
import { prisma } from "@repo/database";
import { env } from "./utils/env.js";

const port = env.PORT;

process.on("uncaughtException", (err) => {
  console.log("UNHANDLED EXCEPTION! ☢️ Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

prisma.$connect().then(() => {
  console.log(
    figlet.textSync(`Mongo connected`, {
      font: "Ogre",
      horizontalLayout: "controlled smushing",
      verticalLayout: "default",
      width: 100,
      whitespaceBreak: true,
    })
  );
});
// we want this to fail if we can't connect to the database
// .catch((err) => console.log(`Error : can't connect to DB`, err));

const server = app.listen(port, () => {
  console.log(
    figlet.textSync(`Server : port  ${port}`, {
      font: "Ogre",
      horizontalLayout: "controlled smushing",
      verticalLayout: "default",
      width: 100,
      whitespaceBreak: true,
    })
  );
});

process.on("unhandledRejection", (err: Error) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION! ☢️ Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err: Error) => {
  console.log("UNHANDLED EXCEPTION! ☢️ Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// unhandled  expetion - synchronous code bug's
