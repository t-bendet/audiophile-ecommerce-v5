/**
 * WORKAROUND: Prisma 6.x doesn't add .js extensions to generated ESM imports.
 * Required because this package uses "type": "module" (ESM).
 *
 * This script runs after `prisma generate` and patches all relative imports
 * in the generated client to include .js extensions, which Node.js ESM requires.
 *
 * Remove this script when Prisma adds native ESM import resolution support.
 * Track: https://github.com/prisma/prisma/issues/15640
 */

const fs = require("fs");
const path = require("path");

function findJsFiles(rootDir) {
  const results = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (stat.isFile() && name.endsWith(".js")) results.push(full);
    }
  }
  walk(rootDir);
  return results;
}

const workspaceRoot = path.resolve(__dirname, "..", "..");
const candidateDirs = [
  path.resolve(__dirname, "../generated/prisma"),
  path.resolve(__dirname, "../dist/generated/prisma"),
  path.resolve(workspaceRoot, "packages/database/dist/generated/prisma"),
  path.resolve(workspaceRoot, "apps/server/dist/generated/prisma"),
];

const candidateFiles = [];
for (const dir of candidateDirs) {
  candidateFiles.push(...findJsFiles(dir));
}

let patchedCount = 0;

function shouldAddExtension(p) {
  return (
    (p.startsWith("./") || p.startsWith("../")) && !/\.(js|json|node)$/.test(p)
  );
}

for (const file of candidateFiles) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  // Replace import/export from 'relpath' occurrences
  content = content.replace(
    /(from\s+)(['"])(\.\.??\/[^'"`]+?)\2/g,
    (m, prefix, quote, rel) => {
      if (shouldAddExtension(rel)) return `${prefix}${quote}${rel}.js${quote}`;
      return m;
    },
  );

  // Replace dynamic import("relpath")
  content = content.replace(
    /(import\()(['"])(\.\.??\/[^'"`]+?)\2(\))/g,
    (m, pre, quote, rel, post) => {
      if (shouldAddExtension(rel))
        return `${pre}${quote}${rel}.js${quote}${post}`;
      return m;
    },
  );

  // Replace require('relpath') if any
  content = content.replace(
    /(require\()(['"])(\.\.??\/[^'"`]+?)\2(\))/g,
    (m, pre, quote, rel, post) => {
      if (shouldAddExtension(rel))
        return `${pre}${quote}${rel}.js${quote}${post}`;
      return m;
    },
  );

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`Patched imports in ${file}`);
    patchedCount++;
  }
}

if (patchedCount === 0) {
  console.log("No generated Prisma client files found to patch.");
} else {
  console.log(`Patched ${patchedCount} generated Prisma client file(s).`);
}
