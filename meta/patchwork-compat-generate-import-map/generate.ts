#!/usr/bin/env node
// usage: ./generate.ts [map]

import { promises as fs } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const SDK_URL = "automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46";
const DEPS_URL = "automerge:434kc7ecZMs377SjKdBiFQ9U4yr2";

const ROOT_DIR = "./published";
const SITE = "https://patchwork.inkandswitch.com";

// -------- helpers

const RE_STATIC = /\b(?:import|export)\s*(?:[^"'']*?from\s*)?["']([^"']+)["']/g;
const RE_DYNAMIC = /\bimport\(\s*["']([^"']+)["']\s*\)/g;

function isRelative(spec: string) {
  return spec.startsWith("./") || spec.startsWith("../");
}
function stripQueryHash(u: string) {
  const url = new URL(u);
  url.search = "";
  url.hash = "";
  return url.toString();
}
function hrefToLocalRel(u: string): string {
  // Map CDN URL -> relative path under published/ by mirroring the package path
  // e.g. https://ga.jspm.io/npm:@pkg/x@1.0.0/foo.js -> @pkg/x@1.0.0/foo.js
  const url = new URL(u);
  let p = url.pathname.replace(/^\/+/, ""); // drop leading '/'
  p = p.startsWith("npm:") ? p.slice(4) : p; // drop jspm's npm: prefix
  p = p.startsWith("gh/") ? p.slice(3) : p; // drop jspm's gh/ prefix
  return p;
}
async function ensureDirFor(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}
async function writeOnce(
  filePath: string,
  bytes: Uint8Array,
  written: Set<string>
) {
  if (written.has(filePath)) return;
  await ensureDirFor(filePath);
  await fs.writeFile(filePath, bytes);
  written.add(filePath);
}
async function fetchBytes(url: string): Promise<Uint8Array> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return new Uint8Array(await r.arrayBuffer());
}
function decodeMaybe(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return null;
  }
}
function findRelativeImports(source: string): string[] {
  const out: string[] = [];
  for (const re of [RE_STATIC, RE_DYNAMIC]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source))) {
      const spec = m[1];
      if (spec && isRelative(spec)) out.push(spec);
    }
  }
  return out;
}

export async function downloadRecursively(
  entryUrl: string,
  fetched: Set<string>,
  written: Set<string>
) {
  const clean = stripQueryHash(entryUrl);
  if (fetched.has(clean)) return;
  fetched.add(clean);

  const rel = hrefToLocalRel(clean);
  const localPath = path.join(ROOT_DIR, rel);

  try {
    const bytes = await fetchBytes(clean);
    await writeOnce(localPath, bytes, written);

    // Only recurse for JS-like text
    const lower = localPath.toLowerCase();
    if (
      !(
        lower.endsWith(".js") ||
        lower.endsWith(".mjs") ||
        lower.endsWith(".ts")
      )
    )
      return;

    const text = decodeMaybe(bytes);
    if (!text) return;

    const rels = findRelativeImports(text);
    if (rels.length === 0) return;

    const base = new URL(clean);
    for (const spec of rels) {
      const childUrl = new URL(spec, base).toString();
      const childRel = hrefToLocalRel(childUrl);
      const childLocal = path.join(ROOT_DIR, childRel);
      console.error(`  ↳ [rel] ${spec} -> ${childLocal}`);
      await downloadRecursively(childUrl, fetched, written);
    }
  } catch (err) {
    console.error(`!!! Error fetching ${clean}: ${err}`);
  }
}

async function main() {
  const html = await (await fetch(SITE)).text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const mapElement = doc.querySelector('script[type="importmap"]');
  if (!mapElement) throw new Error("No import map found");

  const map = JSON.parse(mapElement.textContent || "{}");

  const munged: Record<string, string> = Object.assign(
    map.scopes?.["https://ga.jspm.io/"] ?? {},
    map.imports ?? {}
  );

  const imports: Record<string, string> = {};
  const maponly = process.argv.slice(2).includes("map");

  const fetched = new Set<string>();
  const written = new Set<string>();

  for (const [dependency, href] of Object.entries(munged)) {
    if (dependency.startsWith("@patchwork/sdk")) {
      // Keep your special-case rewrite
      imports[dependency] = href.replace("../sdk/", `/automerge/${SDK_URL}/`);
      continue;
    }

    try {
      // Import map should point to the mirrored local path under /automerge/<DEPS_URL>/...
      const relPath = hrefToLocalRel(href);
      imports[dependency] = `/automerge/${DEPS_URL}/${relPath}`;
      if (maponly) continue;
      const localPath = path.join(ROOT_DIR, relPath);
      console.error(`[${dependency}] ${href} -> ${localPath}`);
      await downloadRecursively(href, fetched, written);
    } catch {
      console.error(`!!! error getting ${dependency} at ${href}`);
    }
  }

  console.log(JSON.stringify({ imports }, null, 2));
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
