import { type AutomergeUrl } from "@automerge/automerge-repo";
import { resolve } from "resolve.exports";
import debug from "debug";
import { automergeUrlToServiceWorkerUrl } from "./handoff.js";
const log = debug("patchwork:filesystem");

export async function importModuleFromFolderDocUrl(folderDocUrl: AutomergeUrl) {
  log(`Importing module from folder doc url ${folderDocUrl}`);
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

  console.log("[packages] fetching package.json from:", packageJSONPath);
  const response = await fetch(packageJSONPath);
  console.log(
    "[packages] response status:",
    response.status,
    response.statusText
  );
  if (!response.ok) {
    const text = await response.text();
    console.error("[packages] response not ok, body:", text.slice(0, 200));
    return undefined;
  }

  const text = await response.text();
  console.log(
    "[packages] package.json content (first 200 chars):",
    text.slice(0, 200)
  );
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error(
      "[packages] JSON parse error:",
      e,
      "content:",
      text.slice(0, 500)
    );
    return undefined;
  }
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
