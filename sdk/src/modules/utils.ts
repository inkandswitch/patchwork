import {
  AutomergeUrl,
  DocHandle,
  parseAutomergeUrl,
} from "@automerge/automerge-repo";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { resolve } from "resolve.exports";
import { HasPatchworkMetadata } from "./types";
import { useEffect } from "react";
import { ModuleWatcher } from "./module-watcher";

export function automergeUrlToServiceWorkerUrl(
  automergeUrl: AutomergeUrl
): string {
  return `/automerge/${automergeUrl}/`;
}

// TODO: support heads in the URL!
export function docHandleToServiceWorkerUrl(handle: DocHandle<any>): string {
  const automergeUrl = handle.url;
  return `/automerge/${automergeUrl}/`;
}

export const useSuggestedModuleForDocUrl = (
  docUrl: AutomergeUrl | undefined,
  watcher: ModuleWatcher | null
) => {
  const [selectedDoc] = useDocument<HasPatchworkMetadata>(docUrl);
  const patchworkMetadata = selectedDoc?.["@patchwork"];
  useEffect(() => {
    if (!watcher || !patchworkMetadata?.suggestedImportUrl) return;

    console.log(
      "Found a patchwork recommended modules document",
      patchworkMetadata
    );
    watcher.loadModules([patchworkMetadata.suggestedImportUrl]);
  }, [patchworkMetadata, watcher]);
};

export async function importModuleFromFolderDocUrl(folderDocUrl: AutomergeUrl) {
  const entryPointUrl = await packageEntryPointUrl(folderDocUrl);
  if (!entryPointUrl) {
    throw new Error("No entry point found in package.json");
  }
  // this should use heads() but we want to put them in the URL prefix
  return import(entryPointUrl + "?rand=" + Math.random());
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
    const resolved = resolve(pkgJson, ".", { conditions: ["import"] });
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
  return new URL(entryPoint, base).href;
}
