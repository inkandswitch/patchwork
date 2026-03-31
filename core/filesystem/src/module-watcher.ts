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

  private async init() {
    this.handles = (
      await Promise.allSettled(
        this.urls.map(async (url) => this.repo.find<ModuleSettingsDoc>(url))
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

      const mod = valid
        ? importModuleFromFolderDocUrl(importName)
        : import(/* @vite-ignore */ importName);
      return mod;
    } catch (error) {
      console.error(
        `%c Failed to import ${importName}`,
        "color: #000, background: #ffbcef",
        error
      );
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
    const mod = await this.announce(importName).catch(() => null);
    if (mod) return;

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
    const retryIntervalMs = 10_000;
    const maxRetries = 30; // ~5 minutes total
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

    this.repo.find<FolderDoc>(docUrl).then((handle) => {
      let previousSyncAtTime = handle.doc().lastSyncAt || 0;
      handle.on("change", () => {
        const lastSyncAt = handle.doc().lastSyncAt || 0;
        if (lastSyncAt <= previousSyncAtTime) {
          console.log("handle updated but not lastSyncAt");
          return;
        }
        previousSyncAtTime = lastSyncAt;
        const versionedImport = handle.view(handle.heads()).url;
        console.log(`change in ${importName}, reloading at ${versionedImport}`);
        this.announce(versionedImport);
      });
    });
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
