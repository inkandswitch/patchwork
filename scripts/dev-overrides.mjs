#!/usr/bin/env node

// Finds dev overrides by walking the repo for tool directories that have both:
//   1. A package.json with a pushwork.url field (the prod URL)
//   2. A .pushwork/local-dev/snapshot.json (the dev URL)
// Outputs a dev-tools.json-compatible map of { overrides: { prodUrl: devUrl } }

import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const SKIP = new Set(["node_modules", ".git", ".pushwork", "dist"]);

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, overrides) {
  const pkgPath = join(dir, "package.json");
  const devSnapshotPath = join(dir, ".pushwork", "local-dev", "snapshot.json");

  if (await exists(pkgPath) && await exists(devSnapshotPath)) {
    try {
      const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
      const devSnapshot = JSON.parse(await readFile(devSnapshotPath, "utf-8"));
      const prodUrl = pkg.pushwork?.url;
      const devUrl = devSnapshot.rootDirectoryUrl;
      if (prodUrl && devUrl) {
        overrides[prodUrl] = devUrl;
      }
    } catch {}
  }

  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP.has(entry)) continue;
    const entryPath = join(dir, entry);
    try {
      const s = await stat(entryPath);
      if (s.isDirectory()) await walk(entryPath, overrides);
    } catch {}
  }
}

const root = resolve(process.argv[2] || ".");
const overrides = {};
await walk(root, overrides);

if (Object.keys(overrides).length === 0) {
  console.error("No dev overrides found");
  process.exit(0);
}

console.log(JSON.stringify({ overrides }, null, 2));
