import type { ModuleSettingsDoc } from "./types";
import {
  AutomergeUrl,
  DocHandle,
  DocumentId,
  isValidAutomergeUrl,
  Repo,
} from "@automerge/automerge-repo";
import { importModuleFromFolderDocUrl } from "./utils";
import {
  registerPlugins,
  isPlugin,
  PluginDescription,
  Plugin,
} from "../plugins";

/**
 * This class watches a moduleSettingsDoc and loads modules based on the contents therein.
 * It also watches the modules themselves for changes and reloads them when they change.
 */

export class ModuleWatcher {
  constructor(
    private moduleSettingsUrl: AutomergeUrl,
    private baselineModules: string[],
    private repo: Repo
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
        this.registerModule(importName);
        this.setDocWatcher(importName);
      })
    );
  }

  private async importModuleSafe(importName: string): Promise<any | null> {
    try {
      return await (isValidAutomergeUrl(importName)
        ? importModuleFromFolderDocUrl(importName)
        : import(importName)); // allow reimporting; note this doesn't work for referenced files inside the import
    } catch (err) {
      console.error(`Failed to import ${importName}`, err);
      return null;
    }
  }

  private async registerModule(importName: string) {
    const mod = await this.importModuleSafe(importName);
    if (!mod) return;

    if (mod.plugins) {
      registerPlugins(mod.plugins, importName);
    } else {
      // This is a backwards compatibility shim to handle the way plugins used to be exported, like this:
      // export const tools = [tool1, tool2]
      // export const dataTypes = [dataType1, dataType2]
      // ...
      console.warn(
        `Loading legacy module ${importName}, please update it to use 'export const plugins' style.`
      );
      const plugins = Object.values(mod).flatMap((value: unknown) => {
        if (isPlugin(value)) {
          return [value];
        }
        if (Array.isArray(value)) {
          return value.filter((v: unknown): v is Plugin => isPlugin(v));
        }
        return [];
      });
      registerPlugins(plugins, importName);
    }
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
      handle.on("change", async () => {
        // Note that because the heads are going into a query parameter,
        // modules loaded *below* this one will not be reloaded unless their filename has changed.
        const versionedImport = `${importName}`;
        // This needs heads support in AutomergeUrl
        /* ?heads=${(
          handle.heads() || []
        ).join(",")} */
        this.registerModule(versionedImport);
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
