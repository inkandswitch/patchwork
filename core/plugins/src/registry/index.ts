import { PluginRegistry } from "./registry.js";
import { PluginDescription, Plugin } from "./types.js";

export { PluginRegistry };
export type {
  Plugin,
  LoadedPlugin,
  LoadablePlugin,
  PluginDescription,
  PluginRegistryEvents,
} from "./types.js";

// Map of plugin types to their registries
const pluginRegistries: Record<string, PluginRegistry<any>> = {};

/**
 * Get a registry for a specific plugin type, creating it if it doesn't exist
 * This implicitly registers the plugin type if it hasn't been registered yet
 * Only used internally to this file; instead of exposing the object we use
 * the utility functions below.
 */
export function getPluginRegistry<T extends PluginDescription>(
  pluginType: string
): PluginRegistry<T> {
  // If the registry doesn't exist yet, create it
  if (!pluginRegistries[pluginType]) {
    pluginRegistries[pluginType] = new PluginRegistry<T>();
  }

  return pluginRegistries[pluginType] as PluginRegistry<T>;
}

/**
 * Register plugins for a specific plugin type
 */
export function registerPlugins<D extends PluginDescription, I>(
  plugins: Plugin<D, I>[],
  sourceModule: string
) {
  // Register each group with its appropriate registry
  plugins.forEach((plugin) => {
    if (!plugin.type) {
      console.warn("Plugin has no type", plugin);
      return;
    }
    const registry = getPluginRegistry(plugin.type);
    registry.register(plugin, sourceModule);
  });
}
