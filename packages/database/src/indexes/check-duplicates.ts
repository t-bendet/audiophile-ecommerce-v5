import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { prisma } from "../client.js";

dotenv.config();

/**
 * Read-only: reports every group of documents that would stop one of the
 * schema's unique indexes from being built. It only aggregates, so it is safe
 * to point at Atlas; `db:indexes` runs it before `prisma db push`.
 */

type UniqueIndex = {
  collection: string;
  name: string;
  keys: readonly string[];
};

// Mirrors every @unique and @@unique in prisma/schema; the schema check below
// fails when the two disagree.
const UNIQUE_INDEXES: readonly UniqueIndex[] = [
  { collection: "User", name: "email_1", keys: ["email"] },
  { collection: "Category", name: "name_1", keys: ["name"] },
  { collection: "Product", name: "slug_1", keys: ["slug"] },
  { collection: "Product", name: "name_1", keys: ["name"] },
  { collection: "Product", name: "cartLabel_1", keys: ["cartLabel"] },
  { collection: "Product", name: "shortLabel_1", keys: ["shortLabel"] },
  { collection: "Config", name: "name_1", keys: ["name"] },
  {
    collection: "Config",
    name: "Config_featuredProductId_key",
    keys: ["featuredProductId"],
  },
  {
    collection: "Config",
    name: "Config_showCaseCoverId_key",
    keys: ["showCaseCoverId"],
  },
  {
    collection: "Config",
    name: "Config_showCaseGridId_key",
    keys: ["showCaseGridId"],
  },
  {
    collection: "Config",
    name: "Config_showCaseWideId_key",
    keys: ["showCaseWideId"],
  },
  { collection: "Cart", name: "Cart_userId_key", keys: ["userId"] },
  {
    collection: "CartItem",
    name: "CartItem_cartId_productId_key",
    keys: ["cartId", "productId"],
  },
  {
    collection: "OrderItem",
    name: "OrderItem_orderId_productId_key",
    keys: ["orderId", "productId"],
  },
];

const SAMPLE_GROUPS = 10;
const SAMPLE_IDS = 5;

const describe = ({ name, keys }: Pick<UniqueIndex, "name" | "keys">) =>
  `${name} ${JSON.stringify(Object.fromEntries(keys.map((key) => [key, 1])))}`;

// `migrate diff --from-empty` lists the indexes the schema declares without
// connecting to any database.
const assertListMatchesSchema = () => {
  const plan = execFileSync(
    "pnpm",
    [
      "exec",
      "prisma",
      "migrate",
      "diff",
      "--from-empty",
      "--to-schema-datamodel",
      "prisma/schema",
    ],
    {
      cwd: fileURLToPath(new URL("../..", import.meta.url)),
      encoding: "utf8",
    },
  );
  const declared = [
    ...plan.matchAll(/Unique index `([^`]+)` on \((\{.*\})\)/g),
  ].map(([, name, keys]) => `${name} ${keys}`);
  const listed = UNIQUE_INDEXES.map(describe);

  const missing = declared.filter((index) => !listed.includes(index));
  const extra = listed.filter((index) => !declared.includes(index));
  if (declared.length === 0 || missing.length > 0 || extra.length > 0) {
    throw new Error(
      "UNIQUE_INDEXES in src/indexes/check-duplicates.ts is out of step with prisma/schema.\n" +
        `In the schema only: ${missing.join(", ") || "none"}\n` +
        `In the list only: ${extra.join(", ") || "none"}`,
    );
  }
};

type DuplicateGroup = { _id: unknown; count: number; ids: unknown[] };
type DuplicateReport = {
  total: { groups: number }[];
  sample: DuplicateGroup[];
};

// A unique index treats a missing field as null, so the grouping does too.
const findDuplicates = async ({ collection, keys }: UniqueIndex) => {
  const result = await prisma.$runCommandRaw({
    aggregate: collection,
    pipeline: [
      {
        $group: {
          _id: Object.fromEntries(
            keys.map((key) => [key, { $ifNull: [`$${key}`, null] }]),
          ),
          count: { $sum: 1 },
          ids: { $push: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      {
        $facet: {
          total: [{ $count: "groups" }],
          sample: [
            { $limit: SAMPLE_GROUPS },
            { $project: { count: 1, ids: { $slice: ["$ids", SAMPLE_IDS] } } },
          ],
        },
      },
    ],
    cursor: {},
  });
  const [report] = (result.cursor as { firstBatch: DuplicateReport[] })
    .firstBatch;
  return {
    groups: report?.total[0]?.groups ?? 0,
    sample: report?.sample ?? [],
  };
};

const checkDuplicates = async () => {
  assertListMatchesSchema();

  let blocked = 0;
  for (const index of UNIQUE_INDEXES) {
    const { groups, sample } = await findDuplicates(index);
    const label = `${index.collection}.${describe(index)}`;
    if (groups === 0) {
      console.log(`ok         ${label}`);
      continue;
    }

    blocked += 1;
    console.log(`DUPLICATES ${label}: ${groups} duplicated key(s)`);
    for (const { _id, count, ids } of sample) {
      console.log(
        `  ${JSON.stringify(_id)} x${count}: ${JSON.stringify(ids)}${count > ids.length ? " ..." : ""}`,
      );
    }
    if (groups > sample.length)
      console.log(`  ... and ${groups - sample.length} more`);
  }
  return blocked;
};

// Credentials are in the URL, so only the host and database name are printed.
const target = process.env.DATABASE_URL?.replace(/\/\/[^@]*@/, "//***@");
console.log(
  `Checking unique-index duplicates on ${target ?? "<no DATABASE_URL>"}`,
);

await checkDuplicates()
  .then((blocked) => {
    if (blocked === 0) {
      console.log("No duplicates: every schema unique index can be built.");
    } else {
      console.error(
        `${blocked} unique index(es) cannot be built until their duplicates are resolved.`,
      );
      process.exitCode = 1;
    }
  })
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
