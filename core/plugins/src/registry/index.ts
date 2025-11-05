import { PluginRegistry } from "./registry.js";
import {
  LoadedPlugin,
  PluginDescription,
  Plugin,
  LoadablePlugin,
  PluginTypeMap,
  PluginRegistryEvents,
} from "./types.js";

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

/**
 * Get a plugin by type and ID; it may be loaded or not
 */
export function getPlugin<T extends Plugin>(
  pluginType: string,
  id: string
): T | undefined {
  const registry = getPluginRegistry(pluginType);
  return registry.get(id) as T | undefined;
}

/**
 * Get a plugin by type and ID, ensuring it is loaded before returning
 * If shouldWait is true, will wait for the plugin to be registered if it isn't already
 */
export async function getLoadedPlugin<T extends LoadedPlugin>(
  pluginType: string,
  id: string,
  shouldWait = false,
  timeout = 10000
): Promise<T | undefined> {
  return await getPluginRegistry<T>(pluginType).load(id);
}

/**
 * Get all registered plugins of a specific type
 * @param pluginType The type of plugins to get
 * @param filter Optional filter function to determine which plugins to return
 */
export function getPlugins<T extends Plugin>(
  pluginType: string,
  filter?: (plugin: PluginDescription) => boolean
): T[] {
  const registry = getPluginRegistry<any>(pluginType);
  return registry.all(filter) as T[];
}

/**
 * Load all registered plugins for a given type, returning them
 * @param pluginType The plugin registry type: tools, dataTypes, etc
 * @param filter Optional filter function to determine which plugins to load
 * @param shouldWait Whether to wait for plugins to be registered if they aren't already
 * @returns A Promise resolving to an array of plugins
 */
export async function getLoadedPlugins<T extends LoadedPlugin>(
  pluginType: string,
  filter?: (plugin: PluginDescription) => boolean,
  shouldWait = false
): Promise<T[]> {
  const registry = getPluginRegistry(pluginType);
  return registry.loadAll(filter) as Promise<T[]>;
}

/**
 * Check if a plugin exists by type and ID
 */
export function hasPlugin(pluginType: string, id: string): boolean {
  const registry = getPluginRegistry(pluginType);
  return registry.has(id);
}

/**
 * Subscribe to changes in a plugin registry
 */
export function onPluginsChange<T extends Plugin>(
  pluginType: string,
  callback: PluginRegistryEvents<T>["plugins:changed"]
): () => void {
  const registry = getPluginRegistry<T>(pluginType);
  return registry.onChange(callback);
}

/**
 * Get plugins that match a specific value or wildcard, preferring specific matches.
 * This is useful for finding plugins that support a specific type (e.g. tools for a datatype)
 * where some plugins support all types ("*") and others support specific types.
 */
export function getMatchingPlugins<T extends Plugin>({
  pluginType,
  matchField,
  matchValue,
  sortField,
}: {
  pluginType: string;
  matchField: keyof T;
  matchValue: string | undefined;
  sortField?: keyof T;
}): { plugins: T[]; error: Error | undefined } {
  try {
    const registry = getPluginRegistry<T>(pluginType);
    const plugins = registry.all(matchPlugins(matchField, matchValue));
    const sortedPlugins = sortPlugins(
      plugins,
      matchField,
      matchValue ?? "",
      sortField
    );

    return {
      plugins: sortedPlugins,
      error: undefined,
    };
  } catch (error) {
    return {
      plugins: [],
      error:
        error instanceof Error
          ? error
          : new Error("Unknown error getting plugins"),
    };
  }
}

/**
 * Load plugins that match a specific value or wildcard, preferring specific matches.
 * This is useful for loading plugins that support a specific type (e.g. tools for a datatype)
 * where some plugins support all types ("*") and others support specific types.
 */
export async function getMatchingLoadedPlugins<T extends LoadedPlugin>({
  pluginType,
  matchField,
  matchValue,
  sortField,
  wait = false,
}: {
  pluginType: string;
  matchField: keyof T;
  matchValue: string | undefined;
  sortField?: keyof T;
  wait?: boolean;
}): Promise<{
  plugins: T[];
  error: Error | undefined;
}> {
  try {
    const registry = getPluginRegistry<T>(pluginType);
    const plugins = await registry.loadAll(
      matchPlugins(matchField, matchValue)
    );
    const sortedPlugins = sortPlugins(
      plugins,
      matchField,
      matchValue ?? "",
      sortField
    );

    return {
      plugins: sortedPlugins,
      error: undefined,
    };
  } catch (error) {
    return {
      plugins: [],
      error:
        error instanceof Error
          ? error
          : new Error("Unknown error loading plugins"),
    };
  }
}

export function matchPlugins<T extends PluginDescription>(
  matchField: keyof T,
  matchValue: string | undefined
): (plugin: T) => boolean {
  return (plugin: T) => {
    if (!matchValue) return false;
    const value = plugin[matchField];

    // Handle array values
    if (Array.isArray(value)) {
      return value.includes("*") || value.includes(matchValue);
    }

    // Handle string values
    return value === "*" || value === matchValue;
  };
}
/**
 * Check if a value is a plugin, optionally of a specific type
 * If a type is provided, it will be used to infer the correct plugin type
 */

export function isPlugin<
  T extends PluginDescription = PluginDescription,
  I = any,
>(
  value: unknown,
  pluginType?: keyof PluginTypeMap
): value is LoadedPlugin<T, I> {
  if (!value || typeof value !== "object") return false;
  const plugin = value as LoadedPlugin<T, I>;
  if (!plugin.type || !plugin.name || !plugin.id) return false;
  if (pluginType && plugin.type !== pluginType) return false;
  return true;
}
/**
 * Type predicate to ensure a value is of type D
 */

export function isPluginDescription<D extends PluginDescription>(
  value: unknown
): value is D {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    "type" in value &&
    "name" in value
  );
}
/**
 * Check if a value is a loadable plugin
 */

export function isLoadablePlugin<
  D extends PluginDescription = PluginDescription,
  I = any,
>(value: unknown): value is LoadablePlugin<D, I> {
  return (
    isPluginDescription<D>(value) &&
    "load" in value &&
    typeof value.load === "function"
  );
}
/**
 * Sort plugins based on a field value
 */

export const sortPlugins = <
  T extends LoadedPlugin<D, I>,
  D extends PluginDescription,
  I,
>(
  plugins: T[],
  matchField: keyof D,
  matchValue: string,
  sortField?: keyof D
): T[] => {
  return [...plugins].sort((a, b) => {
    const aValue = a[matchField];
    const bValue = b[matchField];

    // Convert string values to arrays for consistent comparison
    const aArray = Array.isArray(aValue)
      ? (aValue as string[])
      : [aValue as string];
    const bArray = Array.isArray(bValue)
      ? (bValue as string[])
      : [bValue as string];

    const aHasWildcard = aArray.includes("*");
    const bHasWildcard = bArray.includes("*");
    const aHasMatch = aArray.includes(matchValue);
    const bHasMatch = bArray.includes(matchValue);

    // Specific matches come first
    if (aHasMatch && !bHasMatch) return -1;
    if (!aHasMatch && bHasMatch) return 1;

    // Then wildcard matches come last
    if (aHasWildcard && !bHasWildcard) return 1;
    if (!aHasWildcard && bHasWildcard) return -1;

    // If both are wildcards or both are specific matches, sort by the optional sort field
    if (sortField) {
      const aSort = a[sortField];
      const bSort = b[sortField];
      if (typeof aSort === "string" && typeof bSort === "string") {
        return aSort.localeCompare(bSort);
      }
    }

    return 0;
  });
};
