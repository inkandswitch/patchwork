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

function getDocumentBaseUrl(): string {
  return globalThis.location?.href ?? "http://localhost/";
}

/**
 * Fetch a static module manifest over HTTP and normalize it into the same shape
 * as an Automerge module-settings doc. Relative (non-Automerge) module URLs are
 * resolved against the manifest's own URL so they can be dynamically imported
 * regardless of where the watcher code itself lives.
 */
async function fetchModuleManifest(url: string): Promise<ModuleSettingsDoc> {
  const manifestUrl = new URL(url, getDocumentBaseUrl()).href;
  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch module manifest ${manifestUrl}: ${response.status}`
    );
  }
  const json = (await response.json()) as Partial<ModuleSettingsDoc>;
  const modules = (Array.isArray(json.modules) ? json.modules : []).map(
    (moduleUrl) =>
      isValidAutomergeUrl(moduleUrl)
        ? moduleUrl
        : (new URL(moduleUrl, manifestUrl).href as AutomergeUrl)
  );
  return {
    "@patchwork": { type: "patchwork:module-settings" },
    modules,
    branches: json.branches,
  } as ModuleSettingsDoc;
}

// todo this can be a function that takes a plugin system and returns a change
// handler

/**
 * This class watches a moduleSettingsDoc and loads modules based on the contents therein.
 * It also watches the modules themselves for changes and reloads them when they change.
 *
 * Settings sources are passed in keyed by name (e.g. `{ system, user }`). Each
 * source URL may be either an Automerge module-settings doc (`automerge:...`,
 * live-reloaded) or an HTTP(S) URL to a static JSON manifest of the same shape
 * (fetched once at construction). The two kinds can be freely mixed, and the
 * module URLs *within* either kind can themselves point at Automerge folder
 * docs or plain HTTP(S) bundles.
 *
 * When resolving the active branch for a branches doc, the entry named "user"
 * is consulted first, so a user-local override beats the system default.
 */
export class ModuleWatcher {
  repo: Repo;
  urls: Record<string, string>;
  handles: Record<string, DocHandle<ModuleSettingsDoc>> | undefined;
  staticManifests: Record<string, ModuleSettingsDoc> = {};
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
    urls: Record<string, string>,
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
        if (isValidAutomergeUrl(url)) {
          const handle = await this.repo.find<ModuleSettingsDoc>(url);
          return { kind: "automerge", name, handle } as const;
        }
        const manifest = await fetchModuleManifest(url);
        return { kind: "manifest", name, manifest } as const;
      })
    );

    this.handles = {};
    for (const result of settled) {
      if (result.status !== "fulfilled") continue;
      const value = result.value;
      if (value.kind === "automerge") {
        this.handles[value.name] = value.handle;
        value.handle.addListener("change", this.onChange);
      } else {
        this.staticManifests[value.name] = value.manifest;
      }
    }
    await this.load();
  }

  /**
   * All settings docs currently driving this watcher, both live Automerge
   * handles and static HTTP manifests, keyed by source name.
   */
  private settingsDocs(): Array<{
    name: string;
    doc: ModuleSettingsDoc | undefined;
  }> {
    const docs: Array<{ name: string; doc: ModuleSettingsDoc | undefined }> = [];
    for (const [name, handle] of Object.entries(this.handles ?? {})) {
      docs.push({ name, doc: handle.doc() });
    }
    for (const [name, manifest] of Object.entries(this.staticManifests)) {
      docs.push({ name, doc: manifest });
    }
    return docs;
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
    } else {
      await import(importName)
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
    const docs = this.settingsDocs();
    const byName = new Map(docs.map(({ name, doc }) => [name, doc]));
    const names = ["user", ...byName.keys()].filter(
      (n, i, arr) => arr.indexOf(n) === i
    );
    for (const name of names) {
      const branch = byName.get(name)?.branches?.[branchesDocUrl];
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
      } else {
        return import(importName)
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

  async addUrl(name: string, url: string): Promise<void> {
    if (this.urls[name] === url) return;
    this.urls[name] = url;
    await this.doneLoading;
    if (isValidAutomergeUrl(url)) {
      const handle = await this.repo.find<ModuleSettingsDoc>(url);
      if (this.handles) this.handles[name] = handle;
      handle.addListener("change", this.onChange);
    } else {
      this.staticManifests[name] = await fetchModuleManifest(url);
    }
    // Reload everything: this source may carry branch overrides for branches
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
    for (const { doc } of this.settingsDocs()) {
      for (const m of doc?.modules ?? []) urls.add(m);
    }
    await this.loadModules([...urls]);
  }
}
