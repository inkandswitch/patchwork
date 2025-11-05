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
const registries: Record<string, PluginRegistry<any>> = {};

/**
 * Get a registry for a specific plugin type, creating it if it doesn't exist
 * This implicitly registers the plugin type if it hasn't been registered yet
 * Only used internally to this file; instead of exposing the object we use
 * the utility functions below.
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

/**
 * Register plugins
 */
export function registerPlugins<D extends PluginDescription, I>(
  plugins: Plugin<D, I>[],
  importUrl: string
) {
  // Register each group with its appropriate registry
  plugins.forEach((plugin) => {
    if (!plugin.type) {
      console.warn("Plugin has no type", plugin);
      return;
    }
    const registry = getRegistry(plugin.type);
    registry.register(plugin, importUrl);
  });
}
