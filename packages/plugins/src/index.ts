import { getType, type HasPatchworkMetadata } from "@patchwork/filesystem";
import { getLoadedPlugins, getPlugins } from "./registry/index.js";
import type { Tool, ToolDescription } from "./tools/index.js";

export * from "./tools/index.js";
export * from "./registry/index.js";
export * from "./datatypes/index.js";

export function getSupportedToolsForType(type: string): Tool[] {
  const plugins = getPlugins("patchwork:tool", (desc) => {
    return (
      (desc as ToolDescription).supportedDataTypes.includes(type) ||
      (desc as ToolDescription).supportedDataTypes.includes("*")
    );
  });

  return plugins as Tool[];
}

export function getSupportedTools(doc: HasPatchworkMetadata): Tool[] {
  const type = getType(doc);
  if (!type) return [];
  return getSupportedToolsForType(type);
}

export function getFallbackTool(doc: HasPatchworkMetadata) {
  const type = getType(doc)!;
  const plugins = getSupportedTools(doc);
  plugins.sort((a, b) => {
    const aSpecificallySupports = a.supportedDataTypes?.includes(type);
    const bSpecificallySupports = b.supportedDataTypes?.includes(type);
    if (aSpecificallySupports && bSpecificallySupports) return 0;
    if (aSpecificallySupports) return -1;
    return 1;
  });
  return plugins?.[0];
}
