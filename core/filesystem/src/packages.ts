import { type AutomergeUrl } from "@automerge/automerge-repo";
import { resolve } from "resolve.exports";
import debug from "debug";
import { getImportableUrlFromAutomergeUrl } from "./urls.js";
const log = debug("patchwork:filesystem");

export const defaultImportConditions = ["patchwork", "browser", "import"];

// The origin to resolve service-worker module URLs against. `location.origin`
// is the string "null" inside a srcdoc/sandboxed frame — an invalid URL base —
// whereas `document.baseURI` is the document's proper base URL (the embedder's
// URL for a srcdoc frame, and the page URL for a normal document), so its origin
// is valid in both cases.
function documentBaseOrigin(): string {
  try {
    return new URL(document.baseURI).origin;
  } catch {
    return window.location.origin;
  }
}

export async function importModuleFromFolderDocUrl(
  folderDocUrl: AutomergeUrl,
  subpath: string = ".",
  conditions: string[] = defaultImportConditions
) {
  log(`importModule ${folderDocUrl}... (subpath: ${subpath})`);
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

  log(`importing ${entryPointUrl.slice(-60)}`);

  return await import(/* @vite-ignore */ entryPointUrl);
}

async function packageJsonContentsFromFolderDocUrl(
  folderDocUrl: AutomergeUrl
): Promise<Record<string, any> | undefined> {
  const packageJSONPath = new URL(
    "package.json",
    new URL(
      getImportableUrlFromAutomergeUrl(folderDocUrl),
      documentBaseOrigin()
    )
  ).href;

  log(`fetching ${packageJSONPath.slice(-60)}`);

  // First attempt: use a stable URL so the SW's in-memory cache can hit.
  const response = await fetch(packageJSONPath);
  if (response.ok) {
    log(`package.json OK for ${folderDocUrl.slice(0, 25)}...`);
    return response.json();
  }
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
    documentBaseOrigin()
  );

  const entry = new URL(entryPoint, base);

  return entry.href;
}
