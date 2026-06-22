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
 * Scan a single document's content for automerge URLs and add any new ones to
 * the allowlist (unless they are denylisted or turn out to be sensitive — see
 * {@link checkAndDenylistIfSensitive}).
 *
 * This is a one-shot scan, not a live subscription: it reads the document's
 * current contents once. Callers re-invoke it (via the wrappers below) when
 * they want to pick up newly-referenced URLs — at boot from the root docs, and
 * lazily when an access request arrives for a URL we haven't seen yet.
 *
 * @param isStale - optional guard returning true if the caller has been torn
 *   down (e.g. a newer init epoch started). Checked once after `repo.find`
 *   resolves so we don't mutate a stale allowlist. Omit for lazy re-scans where
 *   staleness doesn't matter.
 */
async function scanDocIntoAllowlist(
  repo: Repo,
  docUrl: AutomergeUrl,
  allowlist: SyncAllowlist,
  denylist: SyncDenylist | undefined,
  isStale?: () => boolean
): Promise<void> {
  try {
    const handle = await repo.find(docUrl);
    if (isStale?.()) return;

    const doc = handle.doc();
    if (!doc) return;

    const urls = new Set<AutomergeUrl>();
    collectAutomergeUrls(doc, urls);
    for (const url of urls) {
      if (allowlist.hasUrl(url)) continue;
      // A URL embedded in user content might point at a sensitive document
      // (e.g. a branches doc or module settings). Denylist those instead of
      // allowlisting them, and skip — never grant the tool access.
      if (denylist) {
        const sensitive = await checkAndDenylistIfSensitive(repo, url, denylist);
        if (sensitive) continue;
      }
      allowlist.add(url);
      log(`allowlisted ${url}`);
    }
    log(`allowlist scanned from ${docUrl}`);
  } catch (err) {
    log(`scanDocIntoAllowlist: failed to scan ${docUrl}`, err);
  }
}

/**
 * Scan multiple root documents into the allowlist. Used at boot to seed the
 * allowlist with everything transitively referenced by the open documents.
 * Stops early if `isStale` flips (a newer init epoch started).
 */
export async function populateAllowlistFromRoots(
  repo: Repo,
  rootUrls: AutomergeUrl[],
  allowlist: SyncAllowlist,
  denylist: SyncDenylist | undefined,
  isStale: () => boolean
): Promise<void> {
  for (const url of rootUrls) {
    await scanDocIntoAllowlist(repo, url, allowlist, denylist, isStale);
    if (isStale()) return;
  }
}

/**
 * Re-scan all root documents and add any newly-referenced automerge URLs to
 * the allowlist. Called lazily (e.g. when an access request arrives) rather
 * than on every change, to catch references the user just added.
 */
export async function refreshAllowlistFromRoots(
  repo: Repo,
  rootUrls: AutomergeUrl[],
  allowlist: SyncAllowlist,
  denylist: SyncDenylist | undefined
): Promise<void> {
  for (const url of rootUrls) {
    await scanDocIntoAllowlist(repo, url, allowlist, denylist);
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
 * Populate the denylist with the documents that must never reach a tool,
 * because access to them would let a malicious tool damage the user's whole
 * environment rather than just the documents it was given:
 *
 *  1. Account document — the root of the user's identity/config; leaking or
 *     letting a tool edit it compromises everything.
 *  2. Module settings docs — control which tools are installed; a tool that
 *     could edit these could install or replace other tools.
 *  3. Tool/package source code (folder & branches docs reachable from the
 *     module settings, plus every plugin importUrl) — a tool that could edit
 *     another tool's source could inject code that runs with that tool's access.
 *
 * The denylist takes precedence over the allowlist, so these stay blocked even
 * if a URL to one shows up inside user content (see also
 * checkAndDenylistIfSensitive, which catches them at allowlist-time).
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
 *
 * This is a deliberate process-lifetime singleton, shared by every isolation
 * instance on the page. The denylisted set — account doc, module settings,
 * tool/package source code — is global and identical for all instances, and
 * the plugin registries it watches are themselves page-global singletons. So a
 * single shared denylist (and its registry listeners, which therefore also
 * live for the page's lifetime and are intentionally never removed) is correct;
 * there is nothing per-instance to scope or tear down.
 */
export function getDenylist(repo: Repo): SyncDenylist {
  if (sharedDenylist) return sharedDenylist;

  const denylist = new SyncDenylist();
  sharedDenylist = denylist;
  populateDenylist(repo, denylist);

  // Watch for new plugin registrations and denylist their source code.
  for (const [, registry] of getAllRegistries()) {
    registry.on("registered", (plugin: any) => {
      const importUrl = plugin.importUrl as string | undefined;
      if (importUrl && isValidAutomergeUrl(importUrl)) {
        denylistModuleEntry(repo, importUrl as AutomergeUrl, denylist);
      }
    });
  }

  return denylist;
}
