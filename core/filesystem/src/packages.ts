import { type AutomergeUrl } from "@automerge/automerge-repo";
import { resolve } from "resolve.exports";
import debug from "debug";
import { getImportableUrlFromAutomergeUrl } from "./urls.js";
const log = debug("patchwork:filesystem");

export const defaultImportConditions = ["patchwork", "browser", "import"];

export async function importModuleFromFolderDocUrl(
  folderDocUrl: AutomergeUrl,
  subpath: string = ".",
  conditions: string[] = defaultImportConditions
) {
  log(
    `Importing module from folder doc url ${folderDocUrl} (subpath: ${subpath})`
  );
  const entryPointUrl = await packageEntryPointUrl(
    folderDocUrl,
    subpath,
    conditions
  );
  if (!entryPointUrl) {
    throw new Error(
      `No entry point found for subpath "${subpath}" in package.json`
    );
  }

  log(`Importing module from entry point url ${entryPointUrl}`);

  // Cache-bust: browsers cache failed dynamic import() results by URL.
  // Adding a unique query parameter ensures retries are treated as fresh
  // requests even if a previous attempt for the same URL failed.
  const bustUrl = `${entryPointUrl}${entryPointUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;

  return import(/* @vite-ignore */ bustUrl);
}

async function packageJsonContentsFromFolderDocUrl(
  folderDocUrl: AutomergeUrl
): Promise<Record<string, any> | undefined> {
  const packageJSONPath = new URL(
    "package.json",
    new URL(
      getImportableUrlFromAutomergeUrl(folderDocUrl),
      window.location.origin
    )
  ).href;

  // Cache-bust: the SW may return 500 if the folder doc hasn't synced yet.
  // Without this, the browser caches the error response and retries fail.
  const bustUrl = `${packageJSONPath}${packageJSONPath.includes("?") ? "&" : "?"}t=${Date.now()}`;

  const response = await fetch(bustUrl);
  if (!response.ok) {
    return undefined;
  }

  return response.json();
}

export function resolvePackageExport(
  pkgJson: Record<string, any>,
  subpath: string = ".",
  conditions: string[] = defaultImportConditions
): string {
  try {
    const resolved = resolve(pkgJson, subpath, { conditions });
    if (resolved) return resolved[0];
  } catch {
    // ignore, fallback to main
  }

  // fallback to main only for the root export
  if (subpath === "." && typeof pkgJson.main === "string") {
    return pkgJson.main;
  }

  throw new Error(
    `No valid 'exports' for "${subpath}" or 'main' in package.json`
  );
}

async function packageEntryPointUrl(
  folderDocUrl: AutomergeUrl,
  subpath: string = ".",
  conditions: string[] = defaultImportConditions
) {
  const pkgJson = await packageJsonContentsFromFolderDocUrl(folderDocUrl);
  if (!pkgJson) return undefined;

  const entryPoint = resolvePackageExport(pkgJson, subpath, conditions);
  if (!entryPoint) return undefined;

  // Build the final URL via the URL constructor
  const base = new URL(
    getImportableUrlFromAutomergeUrl(folderDocUrl),
    window.location.origin
  );

  const entry = new URL(entryPoint, base);

  return entry.href;
}
