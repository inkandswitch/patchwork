import {
  type AutomergeUrl,
  type DocHandle,
  type DocumentId,
  isValidAutomergeUrl,
  type Repo,
} from "@automerge/automerge-repo/slim";
import { importModuleFromFolderDocUrl } from "./packages.js";
import type { HasPatchworkMetadata } from "./metadata.js";
import { FolderDoc } from "./types.js";

/**
 * Wrapper around repo.find() that retries on "unavailable" errors.
 *
 * In automerge-repo subduction.9, repo.find() returns a DocumentQuery
 * that rejects immediately with "unavailable" when no source (local
 * storage or connected peer) has the document yet. On the tab-side
 * Repo this is common: the SW needs time to sync docs from the
 * Subduction server and relay them via MessageChannel.
 *
 * Backoff: 1s, 2s, 4s, 8s, 8s, 8s, 8s, 8s (~47s total).
 */
async function findWithRetry<T>(
  repo: Repo,
  url: AutomergeUrl | DocumentId,
  maxAttempts = 8,
  baseDelayMs = 1000
): Promise<DocHandle<T>> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await repo.find<T>(url);
    } catch (err: unknown) {
      const isUnavailable =
        err instanceof Error && err.message.includes("unavailable");
      if (!isUnavailable || attempt === maxAttempts - 1) throw err;
      const delay = baseDelayMs * Math.pow(2, Math.min(attempt, 3));
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

export type ModuleSettingsDoc = {
  modules: AutomergeUrl[];
} & HasPatchworkMetadata & {
    "@patchwork": { type: "patchwork:module-settings" };
  };

// todo this can be a function that takes a plugin system and returns a change
// handler

const RETRY_INTERVAL_MS = 1000;
const MAX_RETRIES = 60;

/**
 * This class watches a moduleSettingsDoc and loads modules based on the contents therein.
 * It also watches the modules themselves for changes and reloads them when they change.
 */
export class ModuleWatcher {
  repo: Repo;
  urls: AutomergeUrl[];
  handles: DocHandle<ModuleSettingsDoc>[] | undefined;
  doneLoading: Promise<void>;
  #watchedModules = new Set<string>();

  onLoad: (name: string, mod: any) => void;

  private failedSettingsUrls: AutomergeUrl[] = [];
  private failedModuleUrls: Set<string> = new Set();
  private retrying = false;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private retryCount = 0;

  constructor(
    repo: Repo,
    urls: AutomergeUrl | AutomergeUrl[],
    callback: (name: string, mod: any) => void
  ) {
    this.repo = repo;
    this.urls = Array.isArray(urls) ? urls : [urls];
    this.onLoad = callback;
    this.doneLoading = this.init();
  }

  onChange = () => this.load().catch(console.error);

  private async init() {
    this.handles = [];
    this.failedSettingsUrls = [];

    // Use findWithProgress instead of repo.find() to avoid immediate rejection
    // for docs that need multi-hop relay (tab → SW → server → upstream).
    // repo.find() calls whenReady() which permanently rejects on "unavailable",
    // but in a relay architecture the SW may respond "unavailable" before it has
    // had time to fetch from the server.
    const SETTINGS_TIMEOUT_MS = 30_000;

    await Promise.allSettled(
      this.urls.map(async (url) => {
        const progress = this.repo.findWithProgress<ModuleSettingsDoc>(url);
        const current = progress.peek();

        if (current.state === "ready") {
          this.handles!.push(current.handle);
          return;
        }

        // Wait for the doc to become ready, with a timeout
        return new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            unsubscribe();
            console.warn(`[ModuleWatcher] settings URL timed out: ${url}`);
            this.failedSettingsUrls.push(url);
            resolve();
          }, SETTINGS_TIMEOUT_MS);

          const unsubscribe = progress.subscribe((state) => {
            if (state.state === "ready") {
              clearTimeout(timer);
              unsubscribe();
              this.handles!.push(state.handle);
              resolve();
            }
          });
        });
      })
    );

    for (const handle of this.handles) {
      handle.addListener("change", this.onChange);
    }
    await this.load();
    this.scheduleRetry();
  }

  async loadModules(modules: string[], cacheBust?: string) {
    await Promise.all(
      modules
        .map((m) => String(m))
        .filter((m) => m.length > 0)
        .map(async (importName) => {
          this.setDocWatcher(importName);
          await this.announceWithRetry(importName, cacheBust);
        })
    );
  }

  async loadSuggestedImportUrl(docUrl: AutomergeUrl) {
    const handle = await this.repo.find<Partial<HasPatchworkMetadata>>(docUrl);
    const doc = handle.doc();
    const url = doc["@patchwork"]?.suggestedImportUrl;
    return url && (await this.loadModules([url]));
  }

  private async importModuleSafe(importName: string, cacheBust?: string): Promise<any | null> {
    try {
      const valid = isValidAutomergeUrl(importName);
      console.log(
        `[module-watcher] importModuleSafe: ${importName.slice(0, 30)}... (valid=${valid})`
      );

      const mod = await (valid
        ? importModuleFromFolderDocUrl(importName, ".", undefined, cacheBust)
        : import(/* @vite-ignore */ importName));
      console.log(
        `[module-watcher] importModuleSafe OK: ${importName.slice(0, 30)}...`,
        mod ? Object.keys(mod) : null
      );
      return mod;
    } catch (error) {
      console.error(
        `[module-watcher] importModuleSafe FAILED: ${importName.slice(0, 30)}...`,
        error
      );
      return null;
    }
  }

  private async report(importName: string, cacheBust?: string) {
    const mod = await this.importModuleSafe(importName, cacheBust);
    if (mod) {
      this.failedModuleUrls.delete(importName);
      this.onLoad(importName, mod);
    } else {
      this.failedModuleUrls.add(importName);
    }
    return mod;
  }

  #pendingModules = new Set<string>();

  private async announceWithRetry(importName: string, cacheBust?: string) {
    // First attempt — may fail if folder doc hasn't synced yet
    console.log(
      `[module-watcher] announceWithRetry: ${importName.slice(0, 30)}...`
    );
    const mod = await this.report(importName, cacheBust).catch((err) => {
      console.warn(
        `[module-watcher] first report failed: ${importName.slice(0, 30)}...`,
        err?.message
      );
      return null;
    });
    if (mod) {
      console.log(
        `[module-watcher] announceWithRetry OK on first try: ${importName.slice(0, 30)}...`
      );
      return;
    }

    // Mark as pending — the change listener will retry when the doc syncs
    this.#pendingModules.add(importName);

    // Event-driven retry: watch the folder doc for changes.
    // When it receives data from sync, retry the import.
    if (isValidAutomergeUrl(importName)) {
      this.repo
        .find<FolderDoc>(importName)
        .then((handle) => {
          const retryOnChange = async () => {
            if (!this.#pendingModules.has(importName)) {
              handle.removeListener("change", retryOnChange);
              return;
            }
            const retried = await this.report(importName).catch(() => null);
            if (retried) {
              this.#pendingModules.delete(importName);
              handle.removeListener("change", retryOnChange);
            }
          };
          handle.on("change", retryOnChange);
        })
        .catch(() => {
          // find() failed — the fallback timer will handle retries.
        });
    }

    // Fallback: periodic retry for cases where the doc change event
    // doesn't fire (e.g., the folder doc structure arrived but the
    // sub-documents with file content sync later via a different handle).
    const retryIntervalMs = 3_000;
    const maxRetries = 60; // ~3 minutes total
    let retries = 0;
    const timer = setInterval(async () => {
      if (!this.#pendingModules.has(importName) || retries >= maxRetries) {
        clearInterval(timer);
        if (retries >= maxRetries) {
          this.#pendingModules.delete(importName);
          console.warn(
            `[module-watcher] gave up loading ${importName} after ${maxRetries} retries`
          );
        }
        return;
      }
      retries++;
      const retried = await this.report(importName).catch(() => null);
      if (retried) {
        this.#pendingModules.delete(importName);
        clearInterval(timer);
      }
    }, retryIntervalMs);
  }

  private watchedDocIds = new Set<string>();

  // TODO: This is a bit janky and relies on a bunch of heuristics.
  // It would be better to watch all the files in the folder recursively
  // and to have some relationship with those other than just parsing the URL.
  private setDocWatcher(importName: string) {
    if (this.#watchedModules.has(importName)) return;
    this.#watchedModules.add(importName);

    const docUrl = isValidAutomergeUrl(importName)
      ? importName
      : (importName.match(/\/automerge\/(\w+)\//)?.[1] as DocumentId);

    if (!docUrl) return;

    // Extract the base document ID (without heads) to prevent duplicate watchers
    // when retrying versioned URLs for the same underlying document.
    const baseDocId = String(docUrl).replace("automerge:", "").split("#")[0];
    if (this.watchedDocIds.has(baseDocId)) return;
    this.watchedDocIds.add(baseDocId);

    findWithRetry<FolderDoc>(this.repo, docUrl)
      .then((handle) => {
        let previousSyncAtTime = handle.doc().lastSyncAt || 0;
        handle.on("change", () => {
          const lastSyncAt = handle.doc().lastSyncAt || 0;
          if (lastSyncAt <= previousSyncAtTime) {
            console.log("handle updated but not lastSyncAt");
            return;
          }
          previousSyncAtTime = lastSyncAt;
          const versionedImport = handle.view(handle.heads()).url;
          console.log(
            `change in ${importName}, reloading at ${versionedImport}`
          );
          // If the import fails (e.g. file docs haven't synced yet), add
          // it to the retry pool so it gets retried with cache-busting
          // query strings. Without this, the browser's module cache holds
          // onto the failed import and no further lastSyncAt change will
          // arrive to trigger a new attempt.
          this.report(versionedImport).then(() => {
            if (this.failedModuleUrls.has(versionedImport)) {
              this.scheduleRetry();
            }
          });
        });
      })
      .catch(() => {});
  }

  private async load() {
    if (!this.handles) throw new Error("No handles");
    const promises = this.handles.map((handle) => {
      const doc = handle.doc();
      const { modules = [] } = doc;
      return this.loadModules(modules);
    });
    await Promise.all(promises);
  }

  private get hasFailures(): boolean {
    return this.failedSettingsUrls.length > 0 || this.failedModuleUrls.size > 0;
  }

  /** Reset retry budget and immediately retry any failures. Call this when
   *  the network becomes available (e.g., on keyhive ingest-remote). */
  resetRetries() {
    if (!this.hasFailures) return;
    this.retryCount = 0;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
    this.retryFailed();
  }

  private scheduleRetry() {
    if (!this.hasFailures || this.retryCount >= MAX_RETRIES) return;
    this.retryTimer = setTimeout(() => this.retryFailed(), RETRY_INTERVAL_MS);
  }

  private async retryFailed() {
    if (!this.hasFailures || this.retrying) return;
    this.retrying = true;
    this.retryCount++;
    try {
      // Clear unavailable doc handles so that repo.find() creates fresh
      // handles that can sync from the network.
      this.clearUnavailableHandles();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Fire-and-forget: walk folder trees in the background to trigger
      // sync for nested file docs. This doesn't block — it uses .then()
      // chains to cascade through the folder hierarchy as docs sync.
      if (this.failedModuleUrls.size > 0) {
        for (const url of this.failedModuleUrls) {
          if (isValidAutomergeUrl(url)) {
            this.triggerFolderSync(url, 0);
          }
        }
      }

      // Retry failed module settings URLs
      if (this.failedSettingsUrls.length > 0) {
        const retryUrls = [...this.failedSettingsUrls];
        this.failedSettingsUrls = [];

        for (const url of retryUrls) {
          const progress = this.repo.findWithProgress<ModuleSettingsDoc>(url);
          const current = progress.peek();
          if (current.state === "ready") {
            this.handles!.push(current.handle);
            current.handle.addListener("change", this.onChange);
            const { modules = [] } = current.handle.doc();
            await this.loadModules(modules, `_r=${this.retryCount}`);
          } else {
            console.warn(`[ModuleWatcher] settings URL ${url} still failing: state=${current.state}`);
            this.failedSettingsUrls.push(url);
          }
        }
      }

      // Retry failed module imports
      if (this.failedModuleUrls.size > 0) {
        const retryUrls = [...this.failedModuleUrls];
        await this.loadModules(retryUrls, `_r=${this.retryCount}`);
      }
    } finally {
      this.retrying = false;
      this.scheduleRetry();
    }
  }

  // Walk a folder doc tree in the background, clearing unavailable child
  // handles and triggering fresh repo.find() calls. Uses .then() chains
  // so it never blocks the caller — as each doc syncs, it discovers
  // subfolders and continues deeper.
  private triggerFolderSync(folderUrl: AutomergeUrl, depth: number) {
    if (depth > 5) return;

    const docId = folderUrl.replace("automerge:", "").split("#")[0];
    const existingHandle = (this.repo.handles as any)[docId] as DocHandle<unknown> | undefined;

    // Only proceed if the folder doc is already ready (don't block on it)
    if (!existingHandle || existingHandle.state !== "ready") return;

    const doc = existingHandle.doc() as FolderDoc | null;
    if (!doc?.docs) return;

    for (const link of doc.docs) {
      // Clear unavailable child handle so repo.find() creates a fresh one
      const childDocId = link.url.replace("automerge:", "").split("#")[0];
      const childHandle = (this.repo.handles as any)[childDocId] as DocHandle<unknown> | undefined;
      if (childHandle?.state === "unavailable") {
        try { this.repo.delete(link.url); } catch {}
      }

      // Trigger sync — don't await, use .then() to recurse into subfolders
      this.repo.find(link.url)
        .then((h) => {
          const childDoc = h.doc();
          if (childDoc && typeof childDoc === "object" && "docs" in childDoc
              && Array.isArray((childDoc as any).docs)) {
            this.triggerFolderSync(link.url as AutomergeUrl, depth + 1);
          }
        })
        .catch(() => {});
    }
  }

  private clearUnavailableHandles() {
    const handles = this.repo.handles as Record<string, DocHandle<unknown>>;
    for (const [documentId, handle] of Object.entries(handles)) {
      if (handle.state === "unavailable") {
        try {
          this.repo.delete(`automerge:${documentId}` as AutomergeUrl);
        } catch {
          // Ignore delete errors
        }
      }
    }
  }
}
