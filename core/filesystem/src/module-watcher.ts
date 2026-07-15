import {
  type AutomergeUrl,
  type DocHandle,
  type DocumentId,
  isValidAutomergeUrl,
  type Repo,
} from "@automerge/automerge-repo/slim";
import {
  importModuleFromFolderDocUrl,
  importModuleFromHttpUrl,
} from "./packages.js";
import { getType, type HasPatchworkMetadata } from "./metadata.js";
import { BranchesDoc, FolderDoc } from "./types.js";

export type ModuleSettingsDoc = {
  modules: AutomergeUrl[];
  branches?: Record<AutomergeUrl, string>;
} & HasPatchworkMetadata & {
    "@patchwork": { type: "patchwork:module-settings" };
  };

const DEFAULT_BRANCH = "default";

// A single pushwork sync commits a burst of changes to a folder doc — the
// file-list write, an optional pin refresh, and a trailing `lastSyncAt` stamp —
// and the file docs it references sync as independent documents. Coalesce that
// burst into one reload by waiting for the folder doc's heads to stop moving
// for this long before re-importing, so we pin to the settled, consistent
// snapshot instead of an intermediate one.
const RELOAD_DEBOUNCE_MS = 250;

function getDocumentBaseUrl(): string {
  // `document.baseURI` is the document's proper base URL — for a srcdoc/sandboxed
  // frame that's the embedder's URL (a valid base), where `location.href` would
  // be "about:srcdoc" (invalid). Falls back to location for non-document realms.
  return (
    globalThis.document?.baseURI ??
    globalThis.location?.href ??
    "http://localhost/"
  );
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
  /**
   * How an Automerge folder-doc module (pinned to heads) is turned into the
   * `{ plugins }` shape `onLoad` consumes. Defaults to importing the package
   * entry point directly on this thread. The browser bootloader overrides this
   * to run the entry point in a worker for descriptor discovery and rebuild the
   * `{ plugins }` shape with main-thread `load()` functions.
   */
  importAutomergeModule: (urlAtHeads: string) => Promise<any>;

  constructor(
    repo: Repo,
    urls: Record<string, string>,
    callback: (name: string, mod: any) => void,
    onUnload?: (name: string) => void,
    importAutomergeModule: (urlAtHeads: string) => Promise<any> = (url) =>
      importModuleFromFolderDocUrl(url as AutomergeUrl)
  ) {
    this.repo = repo;
    this.urls = { ...urls };
    this.onLoad = callback;
    this.onUnload = onUnload;
    this.importAutomergeModule = importAutomergeModule;
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
      await importModuleFromHttpUrl(importName);
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

  private async importModuleSafe(importName: string): Promise<any | null> {
    try {
      if (isValidAutomergeUrl(importName)) {
        // Pin to heads so descriptor discovery and any later main-thread load
        // resolve against the exact same version of the folder doc.
        const handle = await this.repo.find(importName as AutomergeUrl);
        const urlAtHeads = handle.view(handle.heads()).url;
        return await this.importAutomergeModule(urlAtHeads);
      }
      return await importModuleFromHttpUrl(importName);
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
      // Reload when the folder doc's heads actually change, debounced to the
      // trailing edge so a push's burst of changes collapses into one import at
      // the settled heads. This reacts to real content changes (including
      // offline `save`, which never stamps lastSyncAt) rather than a magic
      // timestamp field.
      let importedHeads = handle.heads().join(",");
      let timer: ReturnType<typeof setTimeout> | undefined;

      handle.on("change", () => {
        if (handle.heads().join(",") === importedHeads) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = undefined;
          const heads = handle.heads();
          const key = heads.join(",");
          if (key === importedHeads) return;
          importedHeads = key;
          const versionedImport = handle.view(heads).url;
          console.log(
            `change in ${importName}, reloading at ${versionedImport}`
          );
          this.announce(versionedImport);
        }, RELOAD_DEBOUNCE_MS);
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
