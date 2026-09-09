import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ASSETS_DIR } from "../keys.js";
import { LEGACY_ORIGINS, type LegacyOrigin } from "../legacy-imgbb.js";

/**
 * `media:import --verify` — refetch every image ImgBB still holds and compare
 * it, byte for byte, with the copy this repo now owns. It reports; it never
 * writes. A `differs` row means the live image was edited after upload, so the
 * repo copy would silently revert it: that is a question for the maintainer.
 */

type Outcome = "identical" | "differs" | "lost" | "imported-from-imgbb";

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

  if (live !== local)
    return {
      origin,
      outcome: "differs",
      detail: `live ${live.slice(0, 12)} vs repo ${local.slice(0, 12)}`,
    };

  return {
    origin,
    outcome: origin.fromStarterPack ? "identical" : "imported-from-imgbb",
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

  console.log(
    `Checked ${rows.length} keys against their pre-migration URLs.\n`,
  );
  console.log(`  identical to the starter pack : ${of("identical").length}`);
  console.log(
    `  imported from ImgBB           : ${of("imported-from-imgbb").length}`,
  );
  console.log(`  lost by ImgBB (404)           : ${of("lost").length}`);
  console.log(`  DIFFERENT from the repo copy  : ${of("differs").length}\n`);

  for (const outcome of ["differs", "lost", "imported-from-imgbb"] as const) {
    const matching = of(outcome);
    if (matching.length === 0) continue;
    console.log(`${outcome}:`);
    for (const { origin, detail } of matching) {
      console.log(
        `  ${origin.key}  <-  ${origin.imgbbUrl}${detail ? `  (${detail})` : ""}`,
      );
    }
    console.log("");
  }

  return of("differs").length;
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
