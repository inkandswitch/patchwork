import type { Tool } from "../tools.js";
import { PluginRegistry } from "./registry.js";
import { LoadablePlugin, PluginDescription } from "./types.js";

export { PluginRegistry };
export type {
  LoadablePlugin,
  LoadedPlugin,
  Plugin,
  PluginDescription,
  PluginRegistryEvents,
} from "./types.js";

// Map of plugin types to their registries
const registries: Record<string, PluginRegistry<any>> = {};

/**
 * Get a registry for a specific plugin type, creating it if it doesn't exist
 * This implicitly registers the plugin type if it hasn't been registered yet
 */
export function getRegistry<T extends PluginDescription>(
  type: string
): PluginRegistry<T> {
  // If the registry doesn't exist yet, create it
  if (!registries[type]) {
    registries[type] = new PluginRegistry<T>();
  }

  return registries[type] as PluginRegistry<T>;
}

// todo remove this tomorrow
// ugly and transitional
function migrate(plugin: LoadablePlugin) {
  if (plugin.type == "patchwork:tool") {
    const tool = plugin as Tool;
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

/**
 * Register plugins
 */
export function registerPlugins<D extends PluginDescription, I>(
  plugins: LoadablePlugin<D, I>[],
  importUrl: string
) {
  // Register each group with its appropriate registry
  plugins.forEach((plugin) => {
    if (!plugin.type) {
      console.warn("Plugin has no type", plugin);
      return;
    }
    migrate(plugin);
    const registry = getRegistry(plugin.type);
    registry.register(plugin, importUrl);
  });
}

/**
 * Get all registries
 */
export function getAllRegistries(): Map<string, PluginRegistry<any>> {
  return new Map(Object.entries(registries));
}
