// Checks that every relative Markdown link (file and #anchor) in tracked Markdown files resolves.
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");

function markdownFiles() {
  return execFileSync("git", ["ls-files", "-z", "--", "*.md"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean)
    .map((file) => resolve(root, file));
}

const headingCache = new Map();

function slug(heading) {
  return heading
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function anchors(file) {
  if (!headingCache.has(file)) {
    const seen = new Map();
    const set = new Set();
    for (const line of stripFences(readFileSync(file, "utf8")).split("\n")) {
      const match = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
      if (!match) continue;
      const base = slug(match[1]);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      set.add(count === 0 ? base : `${base}-${count}`);
    }
    headingCache.set(file, set);
  }
  return headingCache.get(file);
}

function stripFences(text) {
  return text.replace(/^(```|~~~)[\s\S]*?^\1\s*$/gm, "");
}

const linkPattern = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const failures = [];

for (const file of markdownFiles()) {
  const text = stripFences(readFileSync(file, "utf8"));
  for (const [, rawTarget] of text.matchAll(linkPattern)) {
    if (/^(https?:|mailto:|tel:)/.test(rawTarget)) continue;
    const [pathPart, anchor] = rawTarget.split("#");
    const target = pathPart
      ? resolve(dirname(file), decodeURIComponent(pathPart))
      : file;
    let exists = true;
    try {
      statSync(target);
    } catch {
      exists = false;
    }
    if (!exists) {
      failures.push(`${relative(root, file)}: missing target ${rawTarget}`);
      continue;
    }
    if (
      anchor &&
      target.endsWith(".md") &&
      !anchors(target).has(anchor.toLowerCase())
    ) {
      failures.push(`${relative(root, file)}: missing anchor ${rawTarget}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("All relative Markdown links resolve.");
