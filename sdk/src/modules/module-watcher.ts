import type { ModuleSettingsDoc } from "./types";
import { registerDataType } from "../datatypes";
import { ToolDescription, isTool, registerTool } from "../tools";
import { registerImportMethod, ImportMethod } from "../importMethods";
import { registerExportMethod, ExportMethod } from "../exportMethods";
import {
  AutomergeUrl,
  DocHandle,
  DocumentId,
  isValidAutomergeUrl,
  Repo,
} from "@automerge/automerge-repo";
import { importModuleFromFolderDocUrl } from "./utils";

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

    // Load and register dataType if present
    if (mod.dataType) {
      registerDataType(mod.dataType, importName);
    }

    // Load and register tools if present
    if (mod.tools?.length) {
      const tools = mod.tools.filter(isTool);
      tools.forEach((t: ToolDescription) => registerTool(t, importName));
    }

    // Load and register import methods if present
    if (mod.importMethods?.length) {
      mod.importMethods.forEach((method: ImportMethod) => {
        registerImportMethod(method);
      });
    }

    // Load and register export methods if present
    if (mod.exportMethods?.length) {
      mod.exportMethods.forEach((method: ExportMethod) => {
        registerExportMethod(method);
      });
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
