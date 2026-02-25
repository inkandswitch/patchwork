import type { ToolDescription } from "../tools.js";
import { PluginRegistry } from "./registry.js";
import { PluginDescription } from "./types.js";

export { PluginRegistry };
export type {
  Plugin,
  PluginDescription,
  PluginRegistryEvents,
} from "./types.js";

const registries: Record<string, PluginRegistry<any>> = {};

/**
 * Get a registry for a specific plugin type, creating it if it doesn't exist
 */
export function getRegistry<T extends PluginDescription>(
  type: string
): PluginRegistry<T> {
  if (!registries[type]) {
    registries[type] = new PluginRegistry<T>();
  }

  return registries[type] as PluginRegistry<T>;
}

function migrate(plugin: PluginDescription) {
  if (plugin.type == "patchwork:tool") {
    const tool = plugin as ToolDescription;
    if ("supportedDataTypes" in tool) {
      console.warn(
        plugin.id,
        plugin.importUrl,
        "supportedDataTypes was renamed to supportedDatatypes (lowercase t in types). fix it to get rid of this warning"
      );
      tool.supportedDatatypes = tool.supportedDataTypes as string[];
    }
  } else if (plugin.type == "patchwork:dataType") {
    console.warn(
      plugin.id,
      plugin.importUrl,
      '"type": "patchwork:dataType" was renamed to patchwork:datatype (lowercase t in type). fix it to get rid of this warning'
    );
    plugin.type = "patchwork:datatype";
  }
}

export type RegisterPluginsOptions = {
  /** Tag name this set of plugins is registered under */
  tag?: string;
  /** Plain automerge URL of the package (no heads) */
  sourceDocUrl?: string;
  /** Automerge heads string identifying this version */
  version?: string;
};

/**
 * Register plugins. The baseUrl is the service-worker base URL for the package
 * (e.g. "/{encodedAutomergeUrl}/"). Each plugin's importPath is resolved against
 * it to produce a fully-qualified importUrl.
 *
 * When options.tag is provided, plugins are registered under that tag.
 * Otherwise they register under "default".
 */
export function registerPlugins<D extends PluginDescription>(
  plugins: D[],
  baseUrl: string,
  options?: RegisterPluginsOptions
) {
  plugins.forEach((plugin) => {
    if (!plugin.type) {
      console.warn("Plugin has no type", plugin);
      return;
    }
    migrate(plugin);

    if (plugin.importPath && !plugin.importUrl) {
      plugin.importUrl = new URL(
        plugin.importPath,
        new URL(baseUrl, globalThis.location.origin)
      ).href;
    }

    if (options?.tag !== undefined) plugin.tag = options.tag;
    if (options?.sourceDocUrl) plugin.sourceDocUrl = options.sourceDocUrl;
    if (options?.version) plugin.version = options.version;

    const registry = getRegistry(plugin.type);
    registry.register(plugin);
  });
}

/**
 * Get all registries
 */
export function getAllRegistries(): Map<string, PluginRegistry<any>> {
  return new Map(Object.entries(registries));
}
