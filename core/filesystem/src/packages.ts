import { type AutomergeUrl } from "@automerge/automerge-repo";
import { resolve } from "resolve.exports";
import debug from "debug";
import {
  documentBaseOrigin,
  getImportableUrlFromAutomergeUrl,
} from "./urls.js";
const log = debug("patchwork:filesystem");

export const defaultImportConditions = ["patchwork", "browser", "import"];

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

/**
 * Import a module from a plain HTTP(S) URL — the non-Automerge counterpart to
 * {@link importModuleFromFolderDocUrl}.
 *
 * The URL may point straight at a module entry file (e.g. `.../index.js`), in
 * which case it's imported as-is, or at a package/site root that serves a
 * `package.json`, in which case the manifest is fetched and its entry point
 * (`exports`/`main`) resolved and imported.
 */
export async function importModuleFromHttpUrl(
  url: string,
  subpath: string = ".",
  conditions: string[] = defaultImportConditions
) {
  const entryPointUrl = await httpEntryPointUrl(url, subpath, conditions);
  log(`importing ${entryPointUrl.slice(-60)}`);
  return await import(/* @vite-ignore */ entryPointUrl);
}

// Module file extensions that mark a URL as a direct entry point rather than a
// package/site root to look for a `package.json` in.
const MODULE_FILE_EXTENSION = /\.(mjs|cjs|js|mts|cts|ts|jsx|tsx)$/;

/**
 * Resolve the URL to actually import for a plain HTTP(S) module URL.
 *
 * A URL that already names a module file (`.../foo.js`, `.mjs`, `.ts`, …) is
 * returned unchanged. Otherwise the URL is treated as a package/site root:
 * `package.json` is fetched relative to it and its entry point resolved. If
 * there's no manifest, the URL is imported directly, so a bare directory that
 * happens to serve an `index.js` still works as before.
 */
async function httpEntryPointUrl(
  url: string,
  subpath: string = ".",
  conditions: string[] = defaultImportConditions
): Promise<string> {
  // Absolute URLs (http(s), data:, blob:) resolve on their own; only a relative
  // URL needs the document base, which isn't available off the main thread.
  let resolved: URL;
  try {
    resolved = new URL(url);
  } catch {
    resolved = new URL(url, documentBaseOrigin());
  }
  // Only probe http(s) directories for a package.json. A URL that already names
  // a module file, or one on another scheme (e.g. a `data:`/`blob:` module), is
  // imported exactly as given.
  const isHttp =
    resolved.protocol === "http:" || resolved.protocol === "https:";
  if (!isHttp || MODULE_FILE_EXTENSION.test(resolved.pathname)) {
    return resolved.href;
  }

  // Treat the URL as a directory: resolve `package.json` against it with a
  // trailing slash so its last path segment isn't dropped.
  const base = resolved.href.endsWith("/") ? resolved.href : `${resolved.href}/`;
  const packageJsonUrl = new URL("package.json", base).href;

  log(`fetching ${packageJsonUrl.slice(-60)}`);
  let pkgJson: Record<string, any> | undefined;
  try {
    const response = await fetch(packageJsonUrl);
    if (response.ok) pkgJson = await response.json();
  } catch {
    // Network/parse failure — fall back to importing the URL directly below.
  }

  if (!pkgJson) return resolved.href;

  const entryPoint = resolvePackageExport(pkgJson, subpath, conditions);
  return new URL(entryPoint, base).href;
}

/**
 * Import the entry point of a package (at `folderDocUrl`, which should be
 * pinned to heads) and return the loaded implementation of a single one of the
 * plugins it exports, selected by its `pluginType` and `pluginId`.
 *
 * A plugin `id` is only unique *within* a plugin type (there is a separate
 * registry per type), so a package can export e.g. a `patchwork:datatype` and
 * a `patchwork:tool` that both have id `"x"`. Both `type` and `id` are needed
 * to pick out the right one.
 *
 * This is the main-thread counterpart to discovering a package's plugin
 * descriptors in a worker: the worker reports *which* plugins a package
 * exports, and this re-imports the package here to actually run the plugin's
 * own `load()` / `import` — mirroring what {@link PluginRegistry.load} would do
 * with the live descriptor, so the registered description and the loaded
 * implementation come from the same pinned version.
 */
export async function importPluginFromFolderDocUrl(
  folderDocUrl: AutomergeUrl,
  pluginType: string,
  pluginId: string,
  subpath: string = ".",
  conditions: string[] = defaultImportConditions
) {
  const mod = await importModuleFromFolderDocUrl(folderDocUrl, subpath, conditions);
  const plugins: any[] = Array.isArray(mod?.plugins) ? mod.plugins : [];
  const plugin = plugins.find(
    (p) => p?.type === pluginType && p?.id === pluginId
  );
  if (!plugin) {
    throw new Error(
      `No plugin "${pluginType}:${pluginId}" exported by the package at ${folderDocUrl}`
    );
  }
  if (typeof plugin.load === "function") {
    return plugin.load();
  }
  if (typeof plugin.import === "string") {
    return import(/* @vite-ignore */ plugin.import);
  }
  throw new Error(
    `Plugin "${pluginType}:${pluginId}" at ${folderDocUrl} has no load() function or import URL`
  );
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
