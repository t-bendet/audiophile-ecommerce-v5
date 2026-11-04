import assert from "node:assert/strict";
import { test } from "node:test";
import { annotateNulls } from "./annotate-prisma-nulls.mjs";

const source = ["DbNull", "JsonNull", "AnyNull"]
  .map((name) => `export const ${name} = runtime.objectEnumValues.instances.${name}`)
  .join("\n");

test("annotates each generated null export and is idempotent", () => {
  const result = annotateNulls(source);
  for (const name of ["DbNull", "JsonNull", "AnyNull"]) {
    assert.match(result, new RegExp(`export const ${name}: typeof runtime\\.objectEnumValues\\.instances\\.${name} =`));
  }
  assert.equal(annotateNulls(result), result);
});

test("rejects missing or duplicated exports", () => {
  assert.throws(() => annotateNulls(source.replace("export const DbNull", "export const Changed")));
  assert.throws(() => annotateNulls(`${source}\n${source}`));
});
