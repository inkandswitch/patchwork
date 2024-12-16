import {
  DeferredTool,
  isTool,
  ModuleSettingsDoc,
  registerDataType,
  registerTool,
} from "@patchwork/sdk";
import { DocHandle, DocumentId, Repo } from "@automerge/automerge-repo";
import { BUNDLED_TOOLS, BUNDLED_DATATYPES } from "./bundledPackages.js";

export class CodeLoader {
  constructor(
    private repo: Repo,
    private moduleSettingsHandle: DocHandle<ModuleSettingsDoc>
  ) {
    this.doneLoading = this.init();
  }

  doneLoading: Promise<void>;

  private async init() {
    await this.loadDataTypes(BUNDLED_DATATYPES);
    await this.loadTools(BUNDLED_TOOLS);
    this.moduleSettingsHandle.on("change", () =>
      this.load().catch(console.error)
    );
    await this.load();
  }

  private async importModuleSafe(importName: string): Promise<any | null> {
    try {
      return await import(importName);
    } catch (err) {
      console.error(`Failed to import ${importName}`, err);
      return null;
    }
  }

  private async loadDataTypes(config: Record<string, string>) {
    await Promise.all(
      Object.entries(config).map(async ([id, importName]) => {
        const mod = await this.importModuleSafe(importName);
        if (mod?.dataType) registerDataType(id, mod.dataType);
        else console.warn(`No dataType found in ${importName} for ${id}`);
      })
    );
  }

  private async loadTools(config: Record<string, string>) {
    const tasks = Object.entries(config).map(async ([id, importName]) => {
      const tools = await this.toolsFromImport(importName);
      tools.forEach(registerTool);
      this.setDocWatcher(importName);
    });
    return Promise.all(tasks);
  }

  private async toolsFromImport(importName: string): Promise<DeferredTool[]> {
    const mod = await this.importModuleSafe(importName);
    if (!mod?.tools) return [];
    return mod.tools.filter(isTool);
  }

  private setDocWatcher(importName: string) {
    const docId = importName.match(/\/automerge\/(\w+)\//)?.[1];
    if (!docId) return;
    const handle = this.repo.find(docId as DocumentId);
    if (!handle) return console.warn(`No handle found for docId ${docId}`);

    handle.on("change", async () => {
      const versionedImport = `${importName}?v=${handle.heads()}`;
      const tools = await this.toolsFromImport(versionedImport);
      tools.forEach((t) => registerTool(t));
    });
  }

  async load() {
    const doc = await this.moduleSettingsHandle.doc().catch((err) => {
      console.error("Error loading moduleSettingsDoc", err);
      return null;
    });
    if (!doc) return;
    const { dataTypeModules = {}, toolModules = {} } = doc;
    await this.loadDataTypes(dataTypeModules);
    await this.loadTools(toolModules);
  }
}
