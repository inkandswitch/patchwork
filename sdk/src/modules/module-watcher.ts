import {
  ToolDescription,
  isTool,
  ModuleSettingsDoc,
  registerDataType,
  registerTool,
} from "@patchwork/sdk";
import {
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
    private moduleSettingsHandle: DocHandle<ModuleSettingsDoc>,
    private baselineModules: string[],
    private repo: Repo
  ) {
    this.doneLoading = this.init();
  }

  doneLoading: Promise<void>;

  private async init() {
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
  }

  // TODO: This is a bit janky and relies on a bunch of heuristics.
  // It would be better to watch all the files in the folder recursively
  // and to have some relationship with those other than just parsing the URL.
  private setDocWatcher(importName: string) {
    const docUrl = isValidAutomergeUrl(importName)
      ? importName
      : (importName.match(/\/automerge\/(\w+)\//)?.[1] as DocumentId);
    const handle = this.repo.find(docUrl);
    if (!handle) return console.warn(`No handle found for docUrl ${docUrl}`);

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
  }

  private async load() {
    const doc = await this.moduleSettingsHandle.doc().catch((err) => {
      console.error("Error loading moduleSettingsDoc", err);
      return null;
    });
    if (!doc) return;

    const { modules = [] } = doc;
    await this.loadModules(modules);
  }
}
