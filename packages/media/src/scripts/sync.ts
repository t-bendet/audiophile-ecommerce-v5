import {
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { listAssetKeys } from "../assets.js";
import { ASSETS_DIR, contentTypeForKey } from "../keys.js";

/**
 * `media:sync` — upload `assets/` to the R2 bucket behind
 * audiophile-media.t-bendet.com. Unchanged objects are skipped; `--prune` also
 * deletes keys the bucket still holds that no longer exist here.
 */

dotenv.config();

const CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

// R2 returns the MD5 hex as the ETag for a single-part PutObject, which is what
// every upload here is.
const etagOf = (bytes: Uint8Array) =>
  `"${createHash("md5").update(bytes).digest("hex")}"`;

const required = (name: string) => {
  const value = process.env[name];
  if (!value)
    throw new Error(
      `${name} is not set. See packages/media/.env.example - these credentials ` +
        "are the developer's, not the server's.",
    );
  return value;
};

const listBucket = async (client: S3Client, bucket: string) => {
  const etags = new Map<string, string>();
  let continuationToken: string | undefined;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      }),
    );
    for (const object of page.Contents ?? []) {
      if (object.Key && object.ETag) etags.set(object.Key, object.ETag);
    }
    continuationToken = page.NextContinuationToken;
  } while (continuationToken);

  return etags;
};

// Matching bytes are not enough to skip: a change to CACHE_CONTROL has to reach
// objects that are otherwise untouched, so confirm the stored header too.
const headerIsCurrent = async (
  client: S3Client,
  bucket: string,
  key: string,
) => {
  const head = await client.send(
    new HeadObjectCommand({ Bucket: bucket, Key: key }),
  );
  return head.CacheControl === CACHE_CONTROL;
};

const deleteAll = async (client: S3Client, bucket: string, keys: string[]) => {
  // DeleteObjects takes at most 1000 keys per call.
  for (let i = 0; i < keys.length; i += 1000) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })) },
      }),
    );
  }
};

const main = async () => {
  const prune = process.argv.includes("--prune");
  const bucket = required("R2_BUCKET");

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });

  const localKeys = await listAssetKeys();
  const remoteEtags = await listBucket(client, bucket);

  let uploaded = 0;
  let skipped = 0;

  for (const key of localKeys) {
    const bytes = await readFile(path.join(ASSETS_DIR, key));
    if (
      remoteEtags.get(key) === etagOf(bytes) &&
      (await headerIsCurrent(client, bucket, key))
    ) {
      skipped++;
      continue;
    }

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bytes,
        ContentType: contentTypeForKey(key),
        CacheControl: CACHE_CONTROL,
      }),
    );
    console.log(`uploaded ${key}`);
    uploaded++;
  }

  const stale = [...remoteEtags.keys()].filter(
    (key) => !localKeys.includes(key),
  );

  if (prune && stale.length > 0) {
    await deleteAll(client, bucket, stale);
    for (const key of stale) console.log(`pruned ${key}`);
  }

  console.log(
    `\n${uploaded} uploaded, ${skipped} unchanged, ${stale.length} stale` +
      (prune ? " deleted." : " left in place (pass --prune to delete)."),
  );
};

await main();
