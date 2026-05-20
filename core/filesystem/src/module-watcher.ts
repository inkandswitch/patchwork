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
 *
 * Settings docs are passed in keyed by name (e.g. `{ system, user }`). When
 * resolving the active branch for a branches doc, the entry named "user" is
 * consulted first, so a user-local override beats the system default.
 */
export class ModuleWatcher {
  repo: Repo;
  urls: Record<string, AutomergeUrl>;
  handles: Record<string, DocHandle<ModuleSettingsDoc>> | undefined;
  doneLoading: Promise<void>;
  #watchedModules = new Set<string>();
  #watchedBranchesDocs = new Set<AutomergeUrl>();
  #branchTargetByBranchesUrl = new Map<
    AutomergeUrl,
    AutomergeUrl | undefined
  >();

  onLoad: (name: string, mod: any) => void;
  onUnload?: (name: string) => void;

  constructor(
    repo: Repo,
    urls: Record<string, AutomergeUrl>,
    callback: (name: string, mod: any) => void,
    onUnload?: (name: string) => void
  ) {
    this.repo = repo;
    this.urls = { ...urls };
    this.onLoad = callback;
    this.onUnload = onUnload;
    this.doneLoading = this.init();
  }

  onChange = () => this.load().catch(console.error);

  private async init() {
    const entries = Object.entries(this.urls);
    const settled = await Promise.allSettled(
      entries.map(async ([name, url]) => {
        const handle = await this.repo.find<ModuleSettingsDoc>(url);
        return [name, handle] as const;
      })
    );

    this.handles = {};
    for (const result of settled) {
      if (result.status !== "fulfilled") continue;
      const [name, handle] = result.value;
      this.handles[name] = handle;
      handle.addListener("change", this.onChange);
    }
    await this.load();
  }

  async loadModules(modules: string[]) {
    await Promise.all(
      modules.map(async (importName) => {
        try {
          await this.processModuleEntry(importName);
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

  private async processModuleEntry(importName: string) {
    if (isValidAutomergeUrl(importName)) {
      const handle =
        await this.repo.find<Partial<HasPatchworkMetadata>>(importName);
      if (getType(handle.doc()) === "branches") {
        await this.processBranchesEntry(importName);
        return;
      }
    }
    this.setDocWatcher(importName);
    await this.announce(importName);
  }

  private async processBranchesEntry(branchesDocUrl: AutomergeUrl) {
    this.setBranchesWatcher(branchesDocUrl);
    const folderUrl = await this.resolveBranchToFolderUrl(branchesDocUrl);
    const previous = this.#branchTargetByBranchesUrl.get(branchesDocUrl);
    if (folderUrl === previous) return;
    this.#branchTargetByBranchesUrl.set(branchesDocUrl, folderUrl);
    if (previous) this.onUnload?.(previous);
    if (!folderUrl) return;
    this.setDocWatcher(folderUrl);
    await this.announce(folderUrl);
  }

  private async resolveBranchToFolderUrl(
    branchesDocUrl: AutomergeUrl
  ): Promise<AutomergeUrl | undefined> {
    const handle = await this.repo.find<BranchesDoc>(branchesDocUrl);
    const doc = handle.doc();
    const branchName = this.chosenBranchFor(branchesDocUrl) ?? DEFAULT_BRANCH;
    const url = doc?.branches?.[branchName];
    if (!url) {
      console.warn(
        `branch "${branchName}" not found in branches doc ${branchesDocUrl}`
      );
      return undefined;
    }
    return url;
  }

  /**
   * Pick the active branch for a branches doc. Checks each registered settings
   * doc, with the user's own ("user") first so user-local overrides beat the
   * system bundle.
   */
  private chosenBranchFor(branchesDocUrl: AutomergeUrl): string | undefined {
    const handles = this.handles;
    if (!handles) return undefined;
    const names = ["user", ...Object.keys(handles).filter((n) => n !== "user")];
    for (const name of names) {
      const branch = handles[name]?.doc()?.branches?.[branchesDocUrl];
      if (branch) return branch;
    }
    return undefined;
  }

  private setBranchesWatcher(branchesDocUrl: AutomergeUrl) {
    if (this.#watchedBranchesDocs.has(branchesDocUrl)) return;
    this.#watchedBranchesDocs.add(branchesDocUrl);
    this.repo.find<BranchesDoc>(branchesDocUrl).then((handle) => {
      handle.on("change", () => {
        this.processBranchesEntry(branchesDocUrl).catch(console.error);
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

  async addUrl(name: string, url: AutomergeUrl): Promise<void> {
    if (this.urls[name] === url) return;
    this.urls[name] = url;
    await this.doneLoading;
    const handle = await this.repo.find<ModuleSettingsDoc>(url);
    if (this.handles) this.handles[name] = handle;
    handle.addListener("change", this.onChange);
    // Reload everything: this handle may carry branch overrides for branches
    // docs that live in a different settings doc's modules.
    await this.load();
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
    // Only `modules` drives loading. `branches` is an override map keyed by
    // branches doc URL — it only takes effect for branches docs that are
    // already listed in some settings doc's `modules`.
    const urls = new Set<string>();
    for (const handle of Object.values(this.handles)) {
      const doc = handle.doc();
      for (const m of doc?.modules ?? []) urls.add(m);
    }
    await this.loadModules([...urls]);
  }
}
