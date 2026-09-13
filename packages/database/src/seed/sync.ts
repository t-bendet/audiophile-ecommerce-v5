import dotenv from "dotenv";
import { prisma } from "../client.js";
import { syncCatalogue } from "./catalogue-sync.js";

dotenv.config();

// Credentials are in the URL, so only the host and database name are printed.
const target = process.env.DATABASE_URL?.replace(/\/\/[^@]*@/, "//***@");
console.log(`Syncing the catalogue onto ${target ?? "<no DATABASE_URL>"}`);

await syncCatalogue()
  .then(() => {
    console.log("Catalogue in sync. No user, cart or order was touched.");
  })
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
