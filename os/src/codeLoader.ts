import {
  ToolDescription,
  isTool,
  ModuleSettingsDoc,
  registerDataType,
  registerTool,
} from "@patchwork/sdk";
import { DocHandle, DocumentId, Repo } from "@automerge/automerge-repo";
import { BUNDLED_MODULES } from "./bundledPackages.js";

export class CodeLoader {
  constructor(
    private repo: Repo,
    private moduleSettingsHandle: DocHandle<ModuleSettingsDoc>
  ) {
    this.doneLoading = this.init();
  }

  doneLoading: Promise<void>;

  private async init() {
    await this.loadModules(BUNDLED_MODULES);
    this.moduleSettingsHandle.on("change", () =>
      this.load().catch(console.error)
    );
    await this.load();
  }

  private async loadModules(config: string[]) {
    await Promise.all(
      config.map(async (importName) => {
        this.registerModule(importName);
        this.setDocWatcher(importName);
      })
    );
  }

  private async importModuleSafe(importName: string): Promise<any | null> {
    try {
      return await import(importName);
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
    const docId = importName.match(/\/automerge\/(\w+)\//)?.[1];
    if (!docId) return;
    const handle = this.repo.find(docId as DocumentId);
    if (!handle) return console.warn(`No handle found for docId ${docId}`);

    handle.on("change", async () => {
      // Note that because the heads are going into a query parameter,
      // modules loaded *below* this one will not be reloaded unless their filename has changed.
      const versionedImport = `${importName}?v=${handle.heads()}`;
      this.registerModule(versionedImport);
    });
  }

  async load() {
    const doc = await this.moduleSettingsHandle.doc().catch((err) => {
      console.error("Error loading moduleSettingsDoc", err);
      return null;
    });
    if (!doc) return;

    const { modules = [] } = doc;
    await this.loadModules(modules);
  }
}
