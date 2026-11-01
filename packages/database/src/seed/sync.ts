import dotenv from "dotenv";
import { prisma } from "../client.js";
import { syncCatalogue } from "./catalogue-sync.js";

dotenv.config();

// `--overwrite` is the hand-run path for a field-shape change (ADR 0007). CI
// never passes it, so a deploy cannot undo an admin's edits.
// pnpm forwards a literal `--` from `pnpm --filter ... db:sync -- --overwrite`.
const flags = process.argv.slice(2).filter((flag) => flag !== "--");
const unknown = flags.filter((flag) => flag !== "--overwrite");
if (unknown.length) {
  console.error(
    `Unknown option: ${unknown.join(" ")}. Only --overwrite is accepted.`,
  );
  process.exit(2);
}
const overwrite = flags.includes("--overwrite");

// Credentials are in the URL, so only the host and database name are printed.
const target = process.env.DATABASE_URL?.replace(/\/\/[^@]*@/, "//***@");
console.log(
  `${overwrite ? "Overwriting" : "Syncing"} the catalogue onto ${target ?? "<no DATABASE_URL>"}`,
);

await syncCatalogue({ overwrite })
  .then(() => {
    console.log(
      overwrite
        ? "Catalogue overwritten from the repo. No user, cart or order was touched."
        : "Catalogue in sync; existing documents were left as they are. No user, cart or order was touched.",
    );
  })
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
