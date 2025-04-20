export type { Plugin, PluginDescription } from "./registry";
import { PluginRegistry, Plugin, PluginDescription } from "./registry";

// Map of plugin types to their registries
const pluginRegistries: Record<string, PluginRegistry<any>> = {};

/**
 * Get a registry for a specific plugin type, creating it if it doesn't exist
 * This implicitly registers the plugin type if it hasn't been registered yet
 * Only used internally to this file; instead of exposing the object we use
 * the utility functions below.
 */
function getPluginRegistry<T extends PluginDescription>(
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
export async function registerExportedPlugins(
  plugins: Plugin<any, any>[],
  sourceModule: string
): Promise<void> {
  // Register each group with its appropriate registry
  plugins.forEach(async (plugin) => {
    if (!plugin.type) {
      console.warn("Plugin has no type", plugin);
      return;
    }
    const registry = getPluginRegistry(plugin.type);
    await registry.register(plugin, sourceModule);
  });
}

/**
 * Get a plugin by type and ID without loading it
 */
export function getPluginFromRegistry<T extends Plugin<any, any>>(
  pluginType: string,
  id: string
): T | undefined {
  const registry = getPluginRegistry(pluginType);
  return registry.getById(id) as T | undefined;
}

/**
 * Load a plugin by type and ID
 * If shouldWait is true, will wait for the plugin to be registered if it isn't already
 */
export async function loadPluginFromRegistry<T extends Plugin<any, any>>(
  pluginType: string,
  id: string,
  shouldWait = false,
  timeout = 10000
): Promise<T | undefined> {
  const registry = getPluginRegistry(pluginType);
  return registry.loadById(id, shouldWait, timeout) as Promise<T | undefined>;
}

/**
 * Get all registered plugins of a specific type
 */
export function getAllPluginsFromRegistry<T extends Plugin<any, any>>(
  pluginType: string
): Record<string, T> {
  const registry = getPluginRegistry<any>(pluginType);
  return registry.getAllPlugins();
}

/**
 * Check if a plugin exists by type and ID
 */
export function hasPlugin(pluginType: string, id: string): boolean {
  const registry = getPluginRegistry(pluginType);
  return registry.hasPlugin(id);
}

/**
 * Subscribe to changes in a plugin registry
 */
export function onPluginsChange<T extends Plugin<any, any>>(
  pluginType: string,
  callback: (plugins: Record<string, T>) => void
): () => void {
  const registry = getPluginRegistry(pluginType);
  return registry.onChange(callback as any);
}

/**
 * Load all registered plugins for a given type, returning them
 * @param pluginType The plugin registry type: tools, dataTypes, etc
 * @param filter Optional filter function to determine which plugins to load
 * @param shouldWait Whether to wait for plugins to be registered if they aren't already
 * @returns A Promise resolving to a record of plugins
 */
export async function loadAllPluginsFromRegistry<T extends Plugin<any, any>>(
  pluginType: string,
  filter?: (plugin: PluginDescription) => boolean,
  shouldWait = false
): Promise<Record<string, T>> {
  const registry = getPluginRegistry(pluginType);
  return registry.loadAll(filter, shouldWait) as Promise<Record<string, T>>;
}

/**
 * Get plugins that match a specific value or wildcard, preferring specific matches.
 * This is useful for finding plugins that support a specific type (e.g. tools for a datatype)
 * where some plugins support all types ("*") and others support specific types.
 */
export function getMatchingPlugins<T extends PluginDescription>(
  pluginType: string,
  matchField: keyof T,
  matchValue: string | undefined,
  sortField?: keyof T
): T[] {
  if (!matchValue) return [];

  const registry = getPluginRegistry<T>(pluginType);
  const plugins = Object.values(registry.getAllPlugins());

  return plugins
    .filter((plugin) => {
      const value = plugin[matchField];
      return value === "*" || value === matchValue;
    })
    .sort((a, b) => {
      // First sort by specific vs wildcard match
      const aValue = a[matchField];
      const bValue = b[matchField];
      if (aValue === matchValue && bValue === "*") return -1;
      if (aValue === "*" && bValue === matchValue) return 1;

      // Then sort by optional sort field if provided
      if (sortField) {
        const aSort = a[sortField];
        const bSort = b[sortField];
        if (aSort && !bSort) return -1;
        if (!aSort && bSort) return 1;
      }

      return 0;
    });
}

/**
 * Load plugins that match a specific value or wildcard, preferring specific matches.
 * This is useful for loading plugins that support a specific type (e.g. tools for a datatype)
 * where some plugins support all types ("*") and others support specific types.
 */
export async function loadMatchingPlugins<T extends PluginDescription>(
  pluginType: string,
  matchField: keyof T,
  matchValue: string | undefined,
  sortField?: keyof T,
  wait: boolean = false
): Promise<{
  plugins: T[];
  isLoading: boolean;
  error: Error | undefined;
}> {
  try {
    // Use loadAllPluginsFromRegistry with a filter function
    const plugins = await loadAllPluginsFromRegistry<T>(
      pluginType,
      (plugin: PluginDescription) => {
        if (!matchValue) return false;
        const value = (plugin as T)[matchField];
        return value === "*" || value === matchValue;
      },
      wait
    );

    // Convert to array and sort if needed
    const pluginArray = Object.values(plugins);
    if (sortField) {
      pluginArray.sort((a, b) => {
        const aValue = a[matchField];
        const bValue = b[matchField];
        // First sort by specific vs wildcard match
        if (aValue === matchValue && bValue === "*") return -1;
        if (aValue === "*" && bValue === matchValue) return 1;
        // Then sort by optional sort field
        const aSort = a[sortField];
        const bSort = b[sortField];
        if (aSort && !bSort) return -1;
        if (!aSort && bSort) return 1;
        return 0;
      });
    }

    return {
      plugins: pluginArray,
      isLoading: false,
      error: undefined,
    };
  } catch (error) {
    return {
      plugins: [],
      isLoading: false,
      error:
        error instanceof Error
          ? error
          : new Error("Unknown error loading plugins"),
    };
  }
}
