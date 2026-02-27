import {
  type AutomergeUrl,
  type DocHandle,
  type DocumentId,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type Repo,
} from "@automerge/automerge-repo/slim";
import { importModuleFromFolderDocUrl } from "./packages.js";
import { isAutomergeUrlLike, waitForDocProperty } from "./handoff.js";
import type { HasPatchworkMetadata } from "./metadata.js";
import type { FolderDoc, UnixFileEntry } from "./types.js";

export type BranchPointer = {
  heads: string[];
};

export type ModuleEntry = {
  branches: Record<string, BranchPointer>;
};

export type ModuleSettingsDoc = {
  modules: Record<AutomergeUrl, ModuleEntry>;
} & HasPatchworkMetadata & {
    "@patchwork": { type: "patchwork:module-settings" };
  };

/** Legacy format: flat array of AutomergeUrls */
export type LegacyModuleSettingsDoc = {
  modules: AutomergeUrl[];
} & HasPatchworkMetadata & {
    "@patchwork": { type: "patchwork:module-settings" };
  };

export type ModuleLoadedMeta = {
  branch: string;
  sourceDocUrl: AutomergeUrl;
  version: string;
};

/** Default timeout for waiting on folder doc data to sync (ms). */
const FOLDER_SYNC_TIMEOUT_MS = 30_000;

/**
 * Wait for a folder doc handle to have a `docs` array.
 *
 * On cold start the tab's repo resolves `repo.find()` immediately with an
 * empty `A.init()` doc because the tab's Subduction has no server connection.
 * Actual data arrives later via the SharedWorker → MessageChannel legacy sync.
 * This helper blocks until the folder has meaningful content.
 */
async function waitForFolderData(
  handle: DocHandle<FolderDoc>,
  timeoutMs = FOLDER_SYNC_TIMEOUT_MS
): Promise<void> {
  try {
    const doc = handle.doc();
    if (doc && doc.docs !== undefined) return;
  } catch {
    // handle may not be ready yet — fall through to wait
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `[ModuleWatcher] timeout waiting for folder ${handle.url} to sync`
        )
      );
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeout);
      handle.off("change", onChange);
    };

    const onChange = () => {
      try {
        const doc = handle.doc();
        if (doc && doc.docs !== undefined) {
          cleanup();
          resolve();
        }
      } catch {
        // not ready yet
      }
    };

    handle.on("change", onChange);

    // Re-check in case data arrived between the initial check and the listener.
    try {
      const doc = handle.doc();
      if (doc && doc.docs !== undefined) {
        cleanup();
        resolve();
      }
    } catch {
      // not ready yet
    }
  });
}

/**
 * Wait for every file in a folder doc to have synced `content`.
 *
 * This ensures the service worker handoff can serve files immediately when
 * the dynamic `import()` triggers fetch requests. Without this, the
 * handoff's `waitForDocProperty(file, "content")` would race against sync
 * and time out on cold start.
 *
 * Throws if any file fails to sync within the timeout — callers should
 * catch this and skip the tool rather than attempt a doomed import.
 */
async function waitForAllFileContent(
  repo: Repo,
  folderHandle: DocHandle<FolderDoc>,
  timeoutMs = FOLDER_SYNC_TIMEOUT_MS
): Promise<void> {
  const doc = folderHandle.doc();
  if (!doc?.docs) return;

  await Promise.all(
    doc.docs.map(async (link) => {
      const fileHandle = await repo.find<UnixFileEntry>(link.url);
      await waitForDocProperty(fileHandle, "content", timeoutMs);
    })
  );
}

/**
 * This class watches moduleSettingsDocs and loads modules based on the contents therein.
 * Supports both the new branched format (modules as a map with branches) and the
 * legacy flat array format.
 */
export class ModuleWatcher {
  repo: Repo;
  urls: AutomergeUrl[];
  handles: DocHandle<any>[] | undefined;
  doneLoading: Promise<void>;

  onLoad: (name: string, mod: any, meta?: ModuleLoadedMeta) => void;

  constructor(
    repo: Repo,
    urls: AutomergeUrl | AutomergeUrl[],
    callback: (name: string, mod: any, meta?: ModuleLoadedMeta) => void
  ) {
    this.repo = repo;
    this.urls = Array.isArray(urls) ? urls : [urls];
    this.onLoad = callback;
    this.doneLoading = this.init();
  }

  onChange = () => this.load().catch(console.error);

  private async init() {
    const results = await Promise.allSettled(
      this.urls.map(async (url) => this.repo.find<any>(url))
    );
    this.handles = results
      .filter((result) => {
        if (result.status === "rejected") {
          console.warn("[ModuleWatcher] failed to find handle:", result.reason);
        }
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
      modules.map(async (importName) => {
        this.setDocWatcher(importName);
        await this.announce(importName).catch((error) => {
          console.warn(
            `[ModuleWatcher] failed to load module ${importName}`,
            error
          );
        });
      })
    );
  }

  /** Load the package at doc's suggestedImportUrl (expected to be a package/folder URL so the loaded module has plugins). */
  async loadSuggestedImportUrl(docUrl: AutomergeUrl) {
    const handle = await this.repo.find<Partial<HasPatchworkMetadata>>(docUrl);
    const doc = handle.doc();
    const url = doc["@patchwork"]?.suggestedImportUrl;
    return url && (await this.loadModules([url]));
  }

  private async importModuleSafe(importName: string): Promise<any | null> {
    try {
      const mod = isAutomergeUrlLike(importName)
        ? await importModuleFromFolderDocUrl(importName as AutomergeUrl)
        : await import(/* @vite-ignore */ importName);
      return mod;
    } catch (error) {
      console.error(`[ModuleWatcher] failed to import ${importName}`, error);
      return null;
    }
  }

  private async announce(importName: string, meta?: ModuleLoadedMeta) {
    const mod = await this.importModuleSafe(importName);
    mod && this.onLoad(importName, mod, meta);
  }

  private setDocWatcher(importName: string) {
    const docUrl = isAutomergeUrlLike(importName)
      ? (importName as AutomergeUrl)
      : (importName.match(/\/automerge\/(\w+)\//)?.[1] as DocumentId);

    if (!docUrl) return;

    this.repo.find<FolderDoc>(docUrl).then((handle) => {
      let previousSyncAtTime = handle.doc().lastSyncAt || 0;
      handle.on("change", () => {
        const lastSyncAt = handle.doc().lastSyncAt || 0;
        if (lastSyncAt <= previousSyncAtTime) {
          return;
        }
        previousSyncAtTime = lastSyncAt;
        const versionedImport = handle.view(handle.heads()).url;
        this.announce(versionedImport);
      });
    });
  }

  private isLegacyFormat(doc: any): doc is LegacyModuleSettingsDoc {
    return Array.isArray(doc.modules);
  }

  private async loadBranchedDoc(doc: ModuleSettingsDoc) {
    const entries = Object.entries(doc.modules ?? {}) as [
      AutomergeUrl,
      ModuleEntry,
    ][];

    await Promise.all(
      entries.flatMap(([packageUrl, entry]) => {
        let documentId: ReturnType<typeof parseAutomergeUrl>["documentId"];
        try {
          documentId = parseAutomergeUrl(packageUrl).documentId;
        } catch (e) {
          console.error(
            "[ModuleWatcher] failed to parse package URL:",
            packageUrl,
            e
          );
          return [];
        }
        return Object.entries(entry.branches ?? {}).map(
          async ([branch, pointer]) => {
            if (!pointer.heads || pointer.heads.length === 0) {
              console.warn(
                `[ModuleWatcher] skipping ${packageUrl}@${branch}: no heads`
              );
              return;
            }
            const versionedUrl = stringifyAutomergeUrl({
              documentId,
              heads: pointer.heads as any,
            });
            const version = pointer.heads.join(",");
            const meta: ModuleLoadedMeta = {
              branch,
              sourceDocUrl: packageUrl,
              version,
            };

            // Wait for folder data and all file content to sync before
            // importing. On cold start repo.find() resolves with an empty
            // doc; the actual data arrives later via the SharedWorker.
            try {
              const folderHandle = await this.repo.find<FolderDoc>(packageUrl);
              await waitForFolderData(folderHandle);
              await waitForAllFileContent(this.repo, folderHandle);
            } catch (error) {
              console.warn(
                `[ModuleWatcher] folder ${packageUrl} not available, skipping ${branch}:`,
                error
              );
              return;
            }

            this.setDocWatcher(versionedUrl);
            await this.announce(versionedUrl, meta).catch((error) => {
              console.warn(
                `[ModuleWatcher] failed to load module ${packageUrl}@${branch}`,
                error
              );
            });
          }
        );
      })
    );
  }

  private async loadLegacyDoc(doc: LegacyModuleSettingsDoc) {
    const { modules = [] } = doc;
    return this.loadModules(modules);
  }

  private async load() {
    if (!this.handles) throw new Error("No handles");
    const promises = this.handles.map((handle) => {
      const doc = handle.doc();
      if (!doc?.modules) {
        console.warn(
          "[ModuleWatcher] handle has no modules field:",
          handle.url
        );
        return;
      }
      if (this.isLegacyFormat(doc)) {
        return this.loadLegacyDoc(doc);
      }
      return this.loadBranchedDoc(doc as ModuleSettingsDoc);
    });
    await Promise.all(promises);
  }
}
