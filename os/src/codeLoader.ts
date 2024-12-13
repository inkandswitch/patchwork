import {
  isTool,
  ModuleSettingsDoc,
  registerDataType,
  registerTool,
  Tool,
} from "@patchwork/sdk";
import { DocHandle, DocumentId, Repo } from "@automerge/automerge-repo";

import { BUNDLED_TOOLS, BUNDLED_DATATYPES } from "./bundledPackages.js";

export class CodeLoader {
  moduleSettingsHandle: DocHandle<ModuleSettingsDoc>;
  repo: Repo;
  constructor(repo: Repo, moduleSettingsHandle: DocHandle<ModuleSettingsDoc>) {
    this.repo = repo;
    this.moduleSettingsHandle = moduleSettingsHandle;
    this.loadBundled().then(() => {
      moduleSettingsHandle.on("change", () => {
        this.load();
      });
      this.load();
    });
  }

  // Helper function for loading tools... This shouldn't be here.
  // It's a sign of having the wrong API.
  async toolFromImportString(importName: string): Promise<Tool[]> {
    const module = await import(importName);
    if (!module) throw new Error(`No module for  ${importName}`);
    let tool = module.tool;
    if (!Array.isArray(tool)) {
      tool = [tool];
    }

    if (!tool.every(isTool))
      throw new Error(`Module but no exported ".tool" for ${importName}`);
    return tool;
  }

  async loadBundled() {
    // We DO want to block on datatypes loading
    const dataTypesLoaded = await Promise.all([
      ...Object.entries(BUNDLED_DATATYPES).map(async ([id, importName]) => {
        const module = await import(importName);
        registerDataType(id, module.dataType);
      }),
    ]);

    // We don't want to block on tools loading
    Object.entries(BUNDLED_TOOLS).map(async ([id, importName]) => {
      const tools = await this.toolFromImportString(importName);
      tools.forEach(registerTool);
    });

    return dataTypesLoaded;
  }

  async load() {
    const doc = await this.moduleSettingsHandle.doc();
    if (!doc) {
      console.error("No module settings doc");
      return;
    }
    const { dataTypeModules, toolModules } = doc;
    await Promise.all([
      ...Object.entries(dataTypeModules || {}).map(async ([id, importName]) => {
        const module = await import(importName);
        registerDataType(id, module.dataType);
      }),
      ...Object.entries(toolModules || {}).map(async ([id, importName]) => {
        const tools = await this.toolFromImportString(importName);
        tools.forEach(registerTool);

        // this is cheating but I'm going to watch the tool for the demo Friday
        const docId = importName.match(/\/automerge\/(\w+)\//)?.[1];
        if (docId) {
          const handle = this.repo.find(docId as DocumentId);
          handle.on("change", async () => {
            const tools = await this.toolFromImportString(
              importName + "?v=" + handle.heads()
            );
            tools.forEach(registerTool);
          });
        }
      }),
    ]);
  }
}
