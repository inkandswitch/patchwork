import { getType, type HasPatchworkMetadata } from "@patchwork/filesystem";
import { getLoadedPlugins } from "./registry/index.js";
import type { Tool, ToolDescription } from "./tools/index.js";

export * from "./tools/index.js";
export * from "./registry/index.js";
export * from "./datatypes/index.js";

export async function getLoadedSupportedToolsForType(
  type: string
): Promise<Tool[]> {
  const plugins = await getLoadedPlugins("patchwork:tool", (desc) => {
    return (
      (desc as ToolDescription).supportedDataTypes.includes(type) ||
      (desc as ToolDescription).supportedDataTypes.includes("*")
    );
  });

  return plugins as Tool[];
}

export async function getLoadedSupportedTools(
  doc: HasPatchworkMetadata
): Promise<Tool[]> {
  const type = getType(doc);
  if (!type) return [];
  return getLoadedSupportedToolsForType(type);
}

export async function getLoadedFallbackTool(doc: HasPatchworkMetadata) {
  const type = getType(doc)!;
  const plugins = await getLoadedSupportedTools(doc);
  plugins.sort((a, b) => {
    const aSpecificallySupports = a.supportedDataTypes?.includes(type);
    const bSpecificallySupports = b.supportedDataTypes?.includes(type);
    if (aSpecificallySupports && bSpecificallySupports) return 0;
    if (aSpecificallySupports) return -1;
    return 1;
  });
  return plugins?.[0];
}

export async function getLoadedFallbackToolId(doc: HasPatchworkMetadata) {
  const plugin = await getLoadedFallbackTool(doc);
  return plugin?.id;
}
