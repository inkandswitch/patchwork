import {
  type AutomergeUrl,
  type DocHandle,
  type DocumentId,
  isValidAutomergeUrl,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type Repo,
} from "@automerge/automerge-repo/slim";
import { importModuleFromFolderDocUrl } from "./packages.js";
import type { HasPatchworkMetadata } from "./metadata.js";
import { FolderDoc } from "./types.js";

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
          console.log(
            new Error(`Failed to load module ${importName}: ${error}`, {
              cause: error,
            })
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
      const valid = isValidAutomergeUrl(importName);
      console.log(
        `[ModuleWatcher] importModuleSafe: ${importName.slice(0, 50)}... valid=${valid}`
      );

      const mod = valid
        ? await importModuleFromFolderDocUrl(importName)
        : await import(/* @vite-ignore */ importName);
      console.log(
        `[ModuleWatcher] importModuleSafe: SUCCESS for ${importName.slice(0, 50)}...`,
        mod
      );
      return mod;
    } catch (error) {
      console.error(
        `[ModuleWatcher] importModuleSafe: FAILED for ${importName}`,
        error
      );
      return null;
    }
  }

  private async announce(importName: string, meta?: ModuleLoadedMeta) {
    const mod = await this.importModuleSafe(importName);
    mod && this.onLoad(importName, mod, meta);
  }

  private setDocWatcher(importName: string) {
    const docUrl = isValidAutomergeUrl(importName)
      ? importName
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
    console.log(
      "[ModuleWatcher] loadBranchedDoc: doc.modules type:",
      typeof doc.modules
    );
    console.log(
      "[ModuleWatcher] loadBranchedDoc: doc.modules constructor:",
      doc.modules?.constructor?.name
    );

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
            this.setDocWatcher(versionedUrl);
            await this.announce(versionedUrl, meta).catch((error) => {
              console.log(
                new Error(
                  `Failed to load module ${packageUrl}@${branch}: ${error}`,
                  { cause: error }
                )
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
    console.log(
      "[ModuleWatcher] load() called, handles:",
      this.handles?.length
    );
    if (!this.handles) throw new Error("No handles");
    const promises = this.handles.map((handle) => {
      console.log("[ModuleWatcher] processing handle:", handle.url);
      const doc = handle.doc();
      console.log("[ModuleWatcher] doc keys:", doc ? Object.keys(doc) : "null");
      console.log(
        "[ModuleWatcher] doc.modules type:",
        typeof doc?.modules,
        "isArray:",
        Array.isArray(doc?.modules)
      );
      console.log("[ModuleWatcher] doc.modules:", doc?.modules);
      if (!doc?.modules) {
        console.warn(
          "[ModuleWatcher] handle has no modules field:",
          handle.url,
          "doc keys:",
          doc ? Object.keys(doc) : "null"
        );
        return;
      }
      if (this.isLegacyFormat(doc)) {
        return this.loadLegacyDoc(doc);
      }
      return this.loadBranchedDoc(doc as ModuleSettingsDoc);
    });
    await Promise.all(promises);
    console.log("[ModuleWatcher] load() complete");
  }
}
