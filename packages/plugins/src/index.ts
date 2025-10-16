import type {
  HasPatchworkMetadata,
  ModuleWatcher,
} from "@patchwork/filesystem";
import { getLoadedPlugins } from "./registry/index.js";
import type { Tool, ToolDescription } from "./tools/index.js";

export * from "./tools/index.js";
export * from "./registry/index.js";
export * from "./datatypes/index.js";

export async function getLoadedSupportedTools(
  doc: HasPatchworkMetadata
): Promise<Tool[]> {
  const type = doc["@patchwork"].type;

  const plugins = await getLoadedPlugins("patchwork:tool", (desc) => {
    return (
      (desc as ToolDescription).supportedDataTypes.includes(type) ||
      (desc as ToolDescription).supportedDataTypes.includes("*")
    );
  });

  return plugins as Tool[];
}

export async function getLoadedFallbackTool(doc: HasPatchworkMetadata) {
  const [plugin] = await getLoadedSupportedTools(doc);
  return plugin;
}

export async function getLoadedFallbackToolId(doc: HasPatchworkMetadata) {
  const plugin = await getLoadedFallbackTool(doc);
  return plugin?.id;
}
