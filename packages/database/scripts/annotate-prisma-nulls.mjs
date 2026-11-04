import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const names = ["DbNull", "JsonNull", "AnyNull"];

export function annotateNulls(source) {
  for (const name of names) {
    const original = `export const ${name} = runtime.objectEnumValues.instances.${name}`;
    const annotated = `export const ${name}: typeof runtime.objectEnumValues.instances.${name} = runtime.objectEnumValues.instances.${name}`;
    const originalCount = source.split(original).length - 1;
    const annotatedCount = source.split(annotated).length - 1;
    if (originalCount + annotatedCount !== 1) {
      throw new Error(`Unexpected Prisma generator output for ${name}`);
    }
    source = source.replace(original, annotated);
  }
  return source;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = ["prismaNamespace.ts", "prismaNamespaceBrowser.ts"].map(
    (name) => new URL(`../generated/prisma/internal/${name}`, import.meta.url),
  );
  const contents = await Promise.all(files.map((file) => readFile(file, "utf8")));
  const updated = contents.map(annotateNulls);
  await Promise.all(files.map((file, index) => writeFile(file, updated[index])));
}
