import { type AutomergeUrl, type Repo } from "@automerge/automerge-repo";
import { resolve } from "resolve.exports";
import debug from "debug";
import { automergeUrlToServiceWorkerUrl } from "./urls.js";
import type { FolderDoc } from "./types.js";
const log = debug("patchwork:filesystem");

export async function importModuleFromFolderDocUrl(
  folderDocUrl: AutomergeUrl,
  repo?: Repo
) {
  log(`Importing module from folder doc url ${folderDocUrl}`);

  // When a repo is provided, wait for the folder document to be synced before
  // fetching via HTTP. This ensures the content server (samod) has the actual
  // document content, not just an empty placeholder.
  if (repo) {
    const handle = await repo.find<FolderDoc>(folderDocUrl);
    await handle.whenReady();
    log(`Folder doc ${folderDocUrl} is ready, fetching package.json`);
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

  // Retry with backoff — on iOS/Tauri the content server reads from samod's
  // repo which may not have synced the folder documents yet at startup.
  const delays = [0, 500, 1000, 2000, 4000];
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt]) await new Promise((r) => setTimeout(r, delays[attempt]));
    const response = await fetch(packageJSONPath);
    if (response.ok) return response.json();
    if (response.status !== 404) return undefined;
    log(`package.json fetch attempt ${attempt + 1}/${delays.length} returned 404 for ${folderDocUrl}`);
  }
  return undefined;
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
