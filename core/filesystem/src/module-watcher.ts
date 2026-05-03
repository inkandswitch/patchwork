import {
  type AutomergeUrl,
  type DocHandle,
  type DocumentId,
  isValidAutomergeUrl,
  type Repo,
  stringifyAutomergeUrl,
} from "@automerge/automerge-repo/slim";
import { importModuleFromFolderDocUrl } from "./packages.js";
import { getType, type HasPatchworkMetadata } from "./metadata.js";
import { BranchesDoc, FolderDoc } from "./types.js";

export type ModuleSettingsDoc = {
  modules: AutomergeUrl[];
  branches?: Record<AutomergeUrl, string>;
} & HasPatchworkMetadata & {
    "@patchwork": { type: "patchwork:module-settings" };
  };

const DEFAULT_BRANCH = "default";

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
  #watchedBranchesDocs = new Set<AutomergeUrl>();
  #branchTargetByBranchesUrl = new Map<AutomergeUrl, AutomergeUrl | undefined>();

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

  async loadModules(modules: string[], settingsDoc?: ModuleSettingsDoc) {
    await Promise.all(
      modules.map(async (importName) => {
        try {
          await this.processModuleEntry(importName, settingsDoc);
        } catch (error) {
          console.log(
            new Error(`Failed to load module ${importName}: ${error}`, {
              cause: error,
            })
          );
        }
      })
    );
  }

  private async processModuleEntry(
    importName: string,
    settingsDoc?: ModuleSettingsDoc
  ) {
    if (isValidAutomergeUrl(importName)) {
      const handle = await this.repo.find<Partial<HasPatchworkMetadata>>(
        importName
      );
      if (getType(handle.doc()) === "branches") {
        await this.processBranchesEntry(importName, settingsDoc);
        return;
      }
    }
    this.setDocWatcher(importName);
    await this.announce(importName);
  }

  private async processBranchesEntry(
    branchesDocUrl: AutomergeUrl,
    settingsDoc?: ModuleSettingsDoc
  ) {
    this.setBranchesWatcher(branchesDocUrl);
    const folderUrl = await this.resolveBranchToFolderUrl(
      branchesDocUrl,
      settingsDoc
    );
    const previous = this.#branchTargetByBranchesUrl.get(branchesDocUrl);
    if (folderUrl === previous) return;
    this.#branchTargetByBranchesUrl.set(branchesDocUrl, folderUrl);
    if (!folderUrl) return;
    this.setDocWatcher(folderUrl);
    await this.announce(folderUrl);
  }

  private async resolveBranchToFolderUrl(
    branchesDocUrl: AutomergeUrl,
    settingsDoc?: ModuleSettingsDoc
  ): Promise<AutomergeUrl | undefined> {
    const handle = await this.repo.find<BranchesDoc>(branchesDocUrl);
    const doc = handle.doc();
    const branchName =
      settingsDoc?.branches?.[branchesDocUrl] ?? DEFAULT_BRANCH;
    const url = doc?.branches?.[branchName];
    if (!url) {
      console.warn(
        `branch "${branchName}" not found in branches doc ${branchesDocUrl}`
      );
      return undefined;
    }
    return url;
  }

  private settingsDocForBranchesUrl(
    branchesDocUrl: AutomergeUrl
  ): ModuleSettingsDoc | undefined {
    if (!this.handles) return undefined;
    for (const handle of this.handles) {
      const doc = handle.doc();
      if (doc?.modules?.includes(branchesDocUrl)) return doc;
    }
    return undefined;
  }

  private setBranchesWatcher(branchesDocUrl: AutomergeUrl) {
    if (this.#watchedBranchesDocs.has(branchesDocUrl)) return;
    this.#watchedBranchesDocs.add(branchesDocUrl);
    this.repo.find<BranchesDoc>(branchesDocUrl).then((handle) => {
      handle.on("change", () => {
        const settingsDoc = this.settingsDocForBranchesUrl(branchesDocUrl);
        this.processBranchesEntry(branchesDocUrl, settingsDoc).catch(
          console.error
        );
      });
    });
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

      if (valid) {
        const handle = await this.repo.find(importName as AutomergeUrl);
        importName = stringifyAutomergeUrl({
          documentId: handle.documentId,
          heads: handle.heads(),
        });
        importName = handle.view(handle.heads()).url;
      }

      const mod = valid
        ? importModuleFromFolderDocUrl(importName as AutomergeUrl)
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

  async addUrl(url: AutomergeUrl): Promise<void> {
    if (this.urls.includes(url)) return;
    this.urls.push(url);
    await this.doneLoading;
    const handle = await this.repo.find<ModuleSettingsDoc>(url);
    this.handles?.push(handle);
    handle.addListener("change", this.onChange);
    const doc = handle.doc();
    await this.loadModules(doc?.modules ?? [], doc);
  }

  private async announce(importName: string) {
    const mod = await this.importModuleSafe(importName);
    mod && this.onLoad(importName, mod);
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
      return this.loadModules(modules, doc);
    });
    await Promise.all(promises);
  }
}
