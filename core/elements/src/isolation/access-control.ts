/**
 * Access control for the isolation boundary.
 *
 *  - Allowlist population: scans a document's content for automerge URLs
 *    and adds them to the allowlist (unless denylisted). Watches for
 *    document changes to expand the allowlist dynamically.
 *  - Denylist: a shared singleton (`getDenylist`) that blocks sensitive
 *    documents (account doc, module settings, tool source code) from
 *    ever syncing to the iframe. Watches plugin registries for new
 *    registrations and denylists their source code automatically.
 */

import {
  type AutomergeUrl,
  type Repo,
  isValidAutomergeUrl,
} from "@automerge/automerge-repo";
import { getAllRegistries } from "@inkandswitch/patchwork-plugins";
import {
  type FolderDoc,
  type BranchesDoc,
  type HasPatchworkMetadata,
  type ModuleSettingsDoc,
} from "@inkandswitch/patchwork-filesystem";
import { SyncAllowlist, SyncDenylist } from "./repo-bridge.js";
import { log } from "./patchwork-isolation.js";

// ---------------------------------------------------------------------------
// Allowlist population
// ---------------------------------------------------------------------------

/**
 * Populate the allowlist from a document's content. Scans for all automerge
 * URLs in the document and adds them to the allowlist (unless denylisted).
 * Watches for document changes to dynamically expand the allowlist.
 *
 * Returns a cleanup function that removes the change listener.
 *
 * @param isStale - callback that returns true if the caller has been
 *   torn down (e.g. a newer init epoch started). Checked after each
 *   async boundary to avoid stale updates.
 */
export async function populateAllowlist(
  repo: Repo,
  docUrl: AutomergeUrl,
  allowlist: SyncAllowlist,
  denylist: SyncDenylist | undefined,
  isStale: () => boolean
): Promise<(() => void) | undefined> {
  const allowUrlsFromDoc = async (doc: unknown) => {
    const urls = new Set<AutomergeUrl>();
    collectAutomergeUrls(doc, urls);
    for (const url of urls) {
      if (allowlist.hasUrl(url)) continue;
      if (denylist) {
        const sensitive = await checkAndDenylistIfSensitive(
          repo,
          url,
          denylist
        );
        if (sensitive) continue;
      }
      allowlist.add(url);
      log(`allowlisted ${url}`);
    }
  };

  try {
    const handle = await repo.find(docUrl);
    if (isStale()) return;

    const doc = handle.doc();
    if (doc) await allowUrlsFromDoc(doc);
    log(`allowlist populated from ${docUrl}`);

    // TODO: ideally update the allowlist dynamically as the doc changes, but not on every keystroke.
    // const onChange = ({ doc }: { doc: unknown }) => {
    //   void allowUrlsFromDoc(doc);
    // };
    // handle.on("change", onChange);
    // return () => handle.off("change", onChange);
  } catch (err) {
    log(`populateAllowlist: failed to scan ${docUrl}`, err);
    return undefined;
  }
}

/**
 * Recursively walks a value and collects all valid automerge URLs found.
 */
function collectAutomergeUrls(value: unknown, urls: Set<AutomergeUrl>): void {
  if (typeof value === "string") {
    if (isValidAutomergeUrl(value)) urls.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectAutomergeUrls(item, urls);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>))
      collectAutomergeUrls(v, urls);
  }
}

// ---------------------------------------------------------------------------
// Denylist population
// ---------------------------------------------------------------------------

/** Denylist a FolderDoc and all its child documents. */
async function denylistFolderDoc(
  repo: Repo,
  folderUrl: AutomergeUrl,
  denylist: SyncDenylist
): Promise<void> {
  denylist.add(folderUrl);
  try {
    const handle = await repo.find<FolderDoc>(folderUrl);
    await handle.whenReady();
    const doc = handle.doc();
    for (const docLink of doc?.docs ?? []) {
      denylist.add(docLink.url);
    }
  } catch (err) {
    log(`denylistFolderDoc: failed to read folder ${folderUrl}`, err);
  }
}

/**
 * Denylist a module entry (either a BranchesDoc or a direct FolderDoc)
 * and all its transitive children.
 */
async function denylistModuleEntry(
  repo: Repo,
  moduleUrl: AutomergeUrl,
  denylist: SyncDenylist
): Promise<void> {
  denylist.add(moduleUrl);
  try {
    const handle = await repo.find<HasPatchworkMetadata>(moduleUrl);
    await handle.whenReady();
    const doc = handle.doc();
    const type = doc?.["@patchwork"]?.type;

    if (type === "branches") {
      const branchesDoc = doc as unknown as BranchesDoc;
      for (const branchUrl of Object.values(branchesDoc.branches ?? {})) {
        await denylistFolderDoc(repo, branchUrl, denylist);
      }
    } else {
      await denylistFolderDoc(repo, moduleUrl, denylist);
    }
    log(`denylisted module with entry ${moduleUrl}`);
  } catch (err) {
    log(`denylistModuleEntry: failed to read module ${moduleUrl}`, err);
  }
}

/**
 * Populate the denylist with all sensitive documents: account doc,
 * module settings docs, and all tool/package source code documents.
 */
async function populateDenylist(
  repo: Repo,
  denylist: SyncDenylist
): Promise<void> {
  // 1. Account document
  const accountHandle = (window as any).accountDocHandle;
  if (accountHandle?.url) {
    denylist.add(accountHandle.url);
  }

  // 2. Module settings documents (from ModuleWatcher)
  const moduleWatcher = (window as any).patchwork?.packages;
  const moduleSettingsUrls: AutomergeUrl[] = [];
  if (moduleWatcher?.urls) {
    for (const url of Object.values(moduleWatcher.urls) as AutomergeUrl[]) {
      if (isValidAutomergeUrl(url)) {
        denylist.add(url);
        moduleSettingsUrls.push(url);
      }
    }
  }

  // 3. Walk module settings → module entries → folder docs → children
  for (const settingsUrl of moduleSettingsUrls) {
    try {
      const handle = await repo.find<ModuleSettingsDoc>(settingsUrl);
      await handle.whenReady();
      const doc = handle.doc();
      for (const moduleUrl of doc?.modules ?? []) {
        await denylistModuleEntry(repo, moduleUrl, denylist);
      }
    } catch (err) {
      log(
        `populateDenylist: failed to read module settings ${settingsUrl}`,
        err
      );
    }
  }

  // 4. Denylist all plugin importUrls from the registry as a catch-all
  for (const [, registry] of getAllRegistries()) {
    for (const plugin of registry.all()) {
      const importUrl = (plugin as any).importUrl as string | undefined;
      if (importUrl && isValidAutomergeUrl(importUrl)) {
        await denylistModuleEntry(repo, importUrl as AutomergeUrl, denylist);
      }
    }
  }

  log(`denylist populated with ${denylist.size} documents`);
}

/**
 * Check if a document is a sensitive type (branches doc, module settings, etc.)
 * and dynamically add it to the denylist if so. Called when URLs are about to
 * be added to the allowlist to prevent sensitive documents from leaking through
 * document content.
 *
 * Returns true if the document was denylisted (caller should skip allowlisting).
 */
async function checkAndDenylistIfSensitive(
  repo: Repo,
  url: AutomergeUrl,
  denylist: SyncDenylist
): Promise<boolean> {
  if (denylist.hasUrl(url)) return true;

  try {
    const handle = await repo.find<HasPatchworkMetadata>(url);
    await handle.whenReady();
    const doc = handle.doc();
    const type = doc?.["@patchwork"]?.type;

    if (type === "branches") {
      log(`dynamically denylisting branches doc: ${url}`);
      const branchesDoc = doc as unknown as BranchesDoc;
      denylist.add(url);
      for (const branchUrl of Object.values(branchesDoc.branches ?? {})) {
        await denylistFolderDoc(repo, branchUrl, denylist);
        log(`denylisted ${branchUrl} for branches doc: ${url}`);
      }
      return true;
    }

    if (type === "patchwork:module-settings") {
      log(`dynamically denylisting module settings doc: ${url}`);
      denylist.add(url);
      const settingsDoc = doc as unknown as ModuleSettingsDoc;
      for (const moduleUrl of settingsDoc.modules ?? []) {
        await denylistModuleEntry(repo, moduleUrl, denylist);
      }
      return true;
    }
  } catch (err) {
    log(`checkAndDenylistIfSensitive: failed to read ${url}`, err);
  }

  return false;
}

// ---------------------------------------------------------------------------
// Shared denylist singleton
// ---------------------------------------------------------------------------

let sharedDenylist: SyncDenylist | null = null;

/**
 * Get the shared denylist, creating and populating it on first call.
 * Watches all plugin registries for new registrations and dynamically
 * denylists their source code documents.
 */
export function getDenylist(repo: Repo): SyncDenylist {
  if (sharedDenylist) return sharedDenylist;

  sharedDenylist = new SyncDenylist();
  populateDenylist(repo, sharedDenylist);

  // Watch for new plugin registrations and denylist their source code
  for (const [, registry] of getAllRegistries()) {
    registry.on("registered", (plugin: any) => {
      const importUrl = plugin.importUrl as string | undefined;
      if (importUrl && isValidAutomergeUrl(importUrl)) {
        denylistModuleEntry(repo, importUrl as AutomergeUrl, sharedDenylist!);
      }
    });
  }

  return sharedDenylist;
}
