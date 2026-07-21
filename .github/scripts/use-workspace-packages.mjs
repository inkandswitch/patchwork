#!/usr/bin/env node
// Rewrite a nested site's dependencies on packages this monorepo publishes to
// `workspace:*`, so it builds against the branch instead of npm.
import { readFile, writeFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) throw new Error("usage: use-workspace-packages.mjs <site-dir>");

const workspace = JSON.parse(
  execFileSync("pnpm", ["-r", "list", "--depth", "-1", "--json"], {
    encoding: "utf8",
  }),
);
const local = new Set(
  workspace.filter((p) => p.name && p.path !== dir).map((p) => p.name),
);

const manifestPath = join(dir, "package.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

for (const field of ["dependencies", "devDependencies"]) {
  for (const name of Object.keys(manifest[field] ?? {})) {
    if (!local.has(name)) continue;
    manifest[field][name] = "workspace:*";
    console.log(`${name} -> workspace:*`);
  }
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
await rm(join(dir, "pnpm-workspace.yaml"), { force: true });
await rm(join(dir, "pnpm-lock.yaml"), { force: true });
