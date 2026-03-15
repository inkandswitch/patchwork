import {
  type AutomergeUrl,
  type Repo,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
} from "@automerge/automerge-repo";
import { resolve } from "resolve.exports";
import debug from "debug";
import { automergeUrlToServiceWorkerUrl } from "./urls.js";
const log = debug("patchwork:filesystem");

/**
 * Pin heads on the URL so that `import()` caches each version at a unique URL.
 * Without this, a headless URL gets cached by the browser module loader and
 * subsequent imports never re-fetch even when the doc has new content.
 */
async function pinHeads(
  folderDocUrl: AutomergeUrl,
  repo: Repo
): Promise<AutomergeUrl> {
  const { heads } = parseAutomergeUrl(folderDocUrl);
  if (heads) return folderDocUrl; // already pinned
  const handle = await repo.find(folderDocUrl);
  return stringifyAutomergeUrl({
    documentId: parseAutomergeUrl(folderDocUrl).documentId,
    heads: handle.heads(),
  }) as AutomergeUrl;
}

export async function importModuleFromFolderDocUrl(
  folderDocUrl: AutomergeUrl,
  repo?: Repo
) {
  log(`Importing module from folder doc url ${folderDocUrl}`);

  // Pin heads so each version gets a unique import() cache entry.
  if (repo) {
    folderDocUrl = await pinHeads(folderDocUrl, repo);
    log(`Pinned heads: ${folderDocUrl}`);
  }

  const entryPointUrl = await packageEntryPointUrl(folderDocUrl);
  if (!entryPointUrl) {
    throw new Error("No entry point found in package.json");
  }

  log(`Importing module from entry point url ${entryPointUrl}`);

  return import(/* @vite-ignore */ entryPointUrl);
}

async function packageJsonContentsFromFolderDocUrl(
  folderDocUrl: AutomergeUrl
): Promise<Record<string, any> | undefined> {
  const packageJSONPath = new URL(
    "package.json",
    new URL(
      automergeUrlToServiceWorkerUrl(folderDocUrl),
      window.location.origin
    )
  ).href;

  const response = await fetch(packageJSONPath);
  if (!response.ok) {
    return undefined;
  }

  return response.json();
}

function packageEntryPointFromPackageJson(
  pkgJson: Record<string, any>
): string {
  try {
    const resolved = resolve(pkgJson, ".", {
      conditions: ["import", "patchwork"],
    });
    if (resolved) return resolved[0];
  } catch {
    // ignore, fallback to main
  }

  // 2) fallback to main
  if (typeof pkgJson.main !== "string") {
    throw new Error("No valid 'exports' or 'main' in package.json");
  }
  return pkgJson.main;
}

async function packageEntryPointUrl(folderDocUrl: AutomergeUrl) {
  const pkgJson = await packageJsonContentsFromFolderDocUrl(folderDocUrl);
  if (!pkgJson) return undefined;

  const entryPoint = packageEntryPointFromPackageJson(pkgJson);
  if (!entryPoint) return undefined;

  // Build the final URL via the URL constructor
  const base = new URL(
    automergeUrlToServiceWorkerUrl(folderDocUrl),
    window.location.origin
  );

  const entry = new URL(entryPoint, base);

  return entry.href;
}
