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
