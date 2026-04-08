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
  console.log(
    `[packages] importModule ${folderDocUrl.slice(0, 25)}... (subpath: ${subpath})`
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

  console.log(`[packages] importing ${entryPointUrl.slice(-60)}`);

  try {
    // Try importing with a stable URL so successful loads are cached
    // and module side effects don't re-execute on subsequent calls.
    const mod = await import(/* @vite-ignore */ entryPointUrl);
    console.log(`[packages] import OK ${entryPointUrl.slice(-60)}`);
    return mod;
  } catch (err) {
    console.warn(`[packages] import failed, retrying with cache-bust`, err);
    // Cache-bust on retry: browsers cache failed dynamic import() results
    // by URL. A unique query parameter forces a fresh request.
    const bustUrl = `${entryPointUrl}${entryPointUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
    return import(/* @vite-ignore */ bustUrl);
  }
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

  console.log(`[packages] fetching ${packageJSONPath.slice(-60)}`);

  // First attempt: use a stable URL so the SW's in-memory cache can hit.
  const response = await fetch(packageJSONPath);
  if (response.ok) {
    console.log(
      `[packages] package.json OK for ${folderDocUrl.slice(0, 25)}...`
    );
    return response.json();
  }

  console.log(
    `[packages] package.json failed (${response.status}), retrying with cache-bust`
  );

  // Retry with cache-bust: the browser may have cached a failed response
  // (e.g. 500 from a folder doc that hadn't synced yet). A unique query
  // parameter forces a fresh request through the SW.
  const bustUrl = `${packageJSONPath}${packageJSONPath.includes("?") ? "&" : "?"}t=${Date.now()}`;
  const retryResponse = await fetch(bustUrl);
  if (!retryResponse.ok) {
    console.warn(
      `[packages] package.json retry also failed (${retryResponse.status}) for ${folderDocUrl.slice(0, 25)}...`
    );
    return undefined;
  }

  console.log(
    `[packages] package.json retry OK for ${folderDocUrl.slice(0, 25)}...`
  );
  return retryResponse.json();
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
