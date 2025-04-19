import { PluginRegistry, Plugin, PluginDescription } from "./registry";
import { useLoadedFilteredPlugins } from "../hooks/usePlugin";

// Re-export the registry module
export * from "./registry";

/**
 * Structure for plugin exported from a module
 */
export interface PluginsExport {
  [key: string]: Plugin<any, any>[] | undefined;
}

// Map of plugin types to their registries
const pluginRegistries: Record<string, PluginRegistry<any>> = {};

/**
 * Get a registry for a specific plugin type, creating it if it doesn't exist
 * This implicitly registers the plugin type if it hasn't been registered yet
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
 * Get a registry for a plugin based on its type
 */
export function getPluginRegistryByType<T extends PluginDescription>(
  plugin: T
): PluginRegistry<T> {
  return getPluginRegistry<T>(plugin.type);
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
      console.log("Plugin has no type", plugin);
      throw new Error(`Plugin has no type: ${plugin}`);
    }
    const registry = getPluginRegistry(plugin.type);
    registry.register(plugin, sourceModule);
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
 * If shouldWait is true, will wait for the plugin to be registered if it isn't already available
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
export function loadMatchingPlugins<T extends PluginDescription>(
  pluginType: string,
  matchField: keyof T,
  matchValue: string | undefined,
  sortField?: keyof T,
  wait: boolean = false
): {
  plugins: T[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { plugins, isLoading, error } = useLoadedFilteredPlugins<T>(
    pluginType,
    (plugin: T) => {
      if (!matchValue) return false;
      const value = plugin[matchField];
      return value === "*" || value === matchValue;
    },
    wait
  );

  // Sort the plugins if we have any
  const sortedPlugins = plugins.sort((a: T, b: T) => {
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

  return {
    plugins: sortedPlugins,
    isLoading,
    error,
  };
}

/**
 * Check if a value is a plugin, optionally of a specific type
 */
export function isPlugin<T extends PluginDescription>(
  value: unknown,
  pluginType?: string
): value is Plugin<T> {
  if (!value || typeof value !== "object") return false;

  const obj = value as Record<string, unknown>;
  if (!("type" in obj) || typeof obj.type !== "string") return false;
  if (!("id" in obj) || typeof obj.id !== "string") return false;
  if (!("name" in obj) || typeof obj.name !== "string") return false;

  if (pluginType && obj.type !== pluginType) return false;

  return true;
}
