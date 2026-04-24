import {
  type AutomergeUrl,
  type DocHandle,
  type DocumentId,
  isValidAutomergeUrl,
  type Repo,
  stringifyAutomergeUrl,
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

  /**
   * Add another module-settings URL to watch after construction. Useful when
   * a site wants to bootstrap with a hard-coded default-tools URL while the
   * user-owned module-settings URL is resolved (or lazily created) later.
   */
  async addUrl(url: AutomergeUrl): Promise<void> {
    if (this.urls.includes(url)) return;
    this.urls.push(url);
    await this.doneLoading;
    const handle = await this.repo.find<ModuleSettingsDoc>(url);
    this.handles?.push(handle);
    handle.addListener("change", this.onChange);
    await this.loadModules(handle.doc()?.modules ?? []);
  }

  private async init() {
    this.handles = (
      await Promise.allSettled(
        this.urls.map(async (url) =>
          findWithRetry<ModuleSettingsDoc>(this.repo, url)
        )
      )
    )
      .filter((result) => {
        return result.status == "fulfilled";
      })
      .map((result) => result.value);

    for (const handle of this.handles) {
      handle.addListener("change", this.onChange);
    }
    await this.load();
  }

  async loadModules(modules: string[]) {
    await Promise.all(
      modules
        .map((m) => String(m))
        .filter((m) => m.length > 0)
        .map(async (importName) => {
          this.setDocWatcher(importName);
          await this.announceWithRetry(importName);
        })
    );
  }

  async loadSuggestedImportUrl(docUrl: AutomergeUrl) {
    const handle = await this.repo.find<Partial<HasPatchworkMetadata>>(docUrl);
    const doc = handle.doc();
    const url = doc["@patchwork"]?.suggestedImportUrl;
    return url && (await this.loadModules([url]));
  }

  private async importModuleSafe(importName: string): Promise<any | null> {
    try {
      const valid = isValidAutomergeUrl(importName);
      console.log(
        `[module-watcher] importModuleSafe: ${importName.slice(
          0,
          30
        )}... (valid=${valid})`
      );

      if (valid) {
        const handle = await this.repo.find(importName as AutomergeUrl);
        importName = stringifyAutomergeUrl({
          documentId: handle.documentId,
          heads: handle.heads(),
        });
        importName = handle.view(handle.heads()).url;
      }

      const mod = await (valid
        ? importModuleFromFolderDocUrl(importName as AutomergeUrl)
        : import(/* @vite-ignore */ importName));
      console.log(
        `[module-watcher] importModuleSafe OK: ${importName.slice(0, 30)}...`,
        mod ? Object.keys(mod) : null
      );
      return mod;
    } catch (error) {
      console.error(
        `[module-watcher] importModuleSafe FAILED: ${importName.slice(
          0,
          30
        )}...`,
        error
      );
      return null;
    }
  }

  private async announce(importName: string) {
    const mod = await this.importModuleSafe(importName);
    mod && this.onLoad(importName, mod);
    return mod;
  }

  #pendingModules = new Set<string>();

  private async announceWithRetry(importName: string) {
    // First attempt — may fail if folder doc hasn't synced yet
    console.log(
      `[module-watcher] announceWithRetry: ${importName.slice(0, 30)}...`
    );
    const mod = await this.announce(importName).catch((err) => {
      console.warn(
        `[module-watcher] first announce failed: ${importName.slice(0, 30)}...`,
        err?.message
      );
      return null;
    });
    if (mod) {
      console.log(
        `[module-watcher] announceWithRetry OK on first try: ${importName.slice(
          0,
          30
        )}...`
      );
      return;
    }

    // Mark as pending — the change listener will retry when the doc syncs
    this.#pendingModules.add(importName);

    // Event-driven retry: watch the folder doc for changes.
    // When it receives data from sync, retry the import.
    if (isValidAutomergeUrl(importName)) {
      findWithRetry<FolderDoc>(this.repo, importName)
        .then((handle) => {
          const retryOnChange = async () => {
            if (!this.#pendingModules.has(importName)) {
              handle.removeListener("change", retryOnChange);
              return;
            }
            const retried = await this.announce(importName).catch(() => null);
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
      const retried = await this.announce(importName).catch(() => null);
      if (retried) {
        this.#pendingModules.delete(importName);
        clearInterval(timer);
      }
    }, retryIntervalMs);
  }

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
          this.announce(versionedImport);
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
}
