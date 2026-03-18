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
    const registry = getRegistry(plugin.type);
    registry.register(plugin, importUrl);
  });
}

/**
 * Remove all plugins that were registered from a given importUrl.
 * This is the counterpart to registerPlugins() and is used when a module
 * is unloaded.
 */
export function unregisterPlugins(importUrl: string) {
  for (const registry of Object.values(registries)) {
    for (const plugin of registry.all()) {
      if (plugin.importUrl === importUrl) {
        registry.remove(plugin.id);
      }
    }
  }
}

/**
 * Get all registries
 */
export function getAllRegistries(): Map<string, PluginRegistry<any>> {
  return new Map(Object.entries(registries));
}
