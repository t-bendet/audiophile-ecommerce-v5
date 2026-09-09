import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ASSETS_DIR } from "../keys.js";
import { LEGACY_ORIGINS, type LegacyOrigin } from "../legacy-imgbb.js";

/**
 * `media:import --verify` — refetch every image ImgBB still holds and compare
 * it, byte for byte, with the copy this repo now owns. It reports; it never
 * writes.
 */

type Outcome = "matches" | "differs" | "lost";

type Row = { origin: LegacyOrigin; outcome: Outcome; detail?: string };

const CONCURRENCY = 8;

const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const verify = async (origin: LegacyOrigin): Promise<Row> => {
  const response = await fetch(origin.imgbbUrl);
  if (response.status === 404) return { origin, outcome: "lost" };
  if (!response.ok)
    throw new Error(
      `${origin.imgbbUrl} answered ${response.status} ${response.statusText}`,
    );

  const live = sha256(new Uint8Array(await response.arrayBuffer()));
  const local = sha256(await readFile(path.join(ASSETS_DIR, origin.key)));

  return live === local
    ? { origin, outcome: "matches" }
    : {
        origin,
        outcome: "differs",
        detail: `live ${live.slice(0, 12)} vs repo ${local.slice(0, 12)}`,
      };
};

const inBatches = async (origins: readonly LegacyOrigin[]) => {
  const rows: Row[] = [];
  for (let i = 0; i < origins.length; i += CONCURRENCY) {
    rows.push(
      ...(await Promise.all(origins.slice(i, i + CONCURRENCY).map(verify))),
    );
  }
  return rows;
};

const report = (rows: readonly Row[]) => {
  const of = (outcome: Outcome) =>
    rows.filter((row) => row.outcome === outcome);
  const matches = of("matches");
  const lost = of("lost");
  const differs = of("differs");
  // These have no Frontend Mentor original, so a match is a round trip rather
  // than a comparison: ImgBB is where their bytes came from.
  const noOriginal = matches.filter((row) => !row.origin.fromStarterPack);

  console.log(
    `Checked ${rows.length} keys against their pre-migration URLs.\n`,
  );
  console.log(`  byte-identical to the repo copy : ${matches.length}`);
  console.log(
    `    ...of those, imported from ImgBB for want of an original : ${noOriginal.length}`,
  );
  console.log(`  lost by ImgBB (404)             : ${lost.length}`);
  console.log(`  DIFFERENT from the repo copy    : ${differs.length}\n`);

  const sections: [string, readonly Row[]][] = [
    ["differs", differs],
    ["lost", lost],
    ["imported from ImgBB", noOriginal],
  ];

  for (const [heading, matching] of sections) {
    if (matching.length === 0) continue;
    console.log(`${heading}:`);
    for (const { origin, detail } of matching) {
      console.log(
        `  ${origin.key}  <-  ${origin.imgbbUrl}${detail ? `  (${detail})` : ""}`,
      );
    }
    console.log("");
  }

  return differs.length;
};

const main = async () => {
  if (!process.argv.includes("--verify")) {
    console.error(
      "usage: pnpm media:import --verify\n\n" +
        "The bytes live in this repo now; the only thing left to import is\n" +
        "confidence that they match what ImgBB still serves.",
    );
    process.exit(1);
  }

  const differing = report(await inBatches(LEGACY_ORIGINS));
  if (differing > 0) {
    console.error(
      `${differing} live image(s) differ from the repo copy. Do not resolve ` +
        "these silently - ask the maintainer which version is canonical.",
    );
    process.exit(1);
  }
};

await main();
