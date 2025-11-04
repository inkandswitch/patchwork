import {
  type AutomergeUrl,
  type DocHandle,
  type DocumentId,
  isValidAutomergeUrl,
  type Repo,
} from "@automerge/automerge-repo/slim";
import { importModuleFromFolderDocUrl } from "./packages.js";
import type { HasPatchworkMetadata } from "./metadata.js";

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
  constructor(
    private moduleSettingsUrl: AutomergeUrl,
    private baselineModules: string[],
    private repo: Repo,
    private callback: (name: string, mod: any) => void
  ) {
    this.doneLoading = this.init();
  }

  moduleSettingsHandle: DocHandle<ModuleSettingsDoc> | undefined;
  doneLoading: Promise<void>;

  private async init() {
    this.moduleSettingsHandle = await this.repo.find(this.moduleSettingsUrl);
    await this.loadModules(this.baselineModules);
    this.moduleSettingsHandle.on("change", () =>
      this.load().catch(console.error)
    );
    await this.load();
  }

  async loadModules(modules: string[]) {
    await Promise.all(
      modules.map(async (importName) => {
        this.setDocWatcher(importName);
        await this.report(importName).catch(console.warn);
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

  private async report(importName: string) {
    const mod = await this.importModuleSafe(importName);
    mod && this.callback(importName, mod);
  }

  // TODO: This is a bit janky and relies on a bunch of heuristics.
  // It would be better to watch all the files in the folder recursively
  // and to have some relationship with those other than just parsing the URL.
  private setDocWatcher(importName: string) {
    const docUrl = isValidAutomergeUrl(importName)
      ? importName
      : (importName.match(/\/automerge\/(\w+)\//)?.[1] as DocumentId);

    // This is probably a built-in, which is fine!
    if (!docUrl) return;

    this.repo.find(docUrl).then((handle) => {
      handle.on("change", () => {
        const versionedImport = handle.view(handle.heads()).url;
        this.report(versionedImport);
      });
    });
  }

  private async load() {
    if (!this.moduleSettingsHandle) throw new Error("No moduleSettingsHandle");
    const doc = this.moduleSettingsHandle.doc();
    const { modules = [] } = doc;
    await this.loadModules(modules);
  }
}
