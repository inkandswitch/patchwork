export type { Plugin, LoadablePlugin, PluginDescription } from "./registry";
export { isLoadablePlugin, isPluginDescription, isPlugin } from "./registry";
import {
  PluginRegistry,
  Plugin,
  PluginDescription,
  matchPlugins,
  sortPlugins,
} from "./registry";

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
export async function registerPlugins(
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
export function getPlugin<T extends Plugin<any, any>>(
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
export async function loadPlugin<T extends Plugin>(
  pluginType: string,
  id: string,
  shouldWait = false,
  timeout = 10000
): Promise<T | undefined> {
  return getPluginRegistry<T>(pluginType).loadById(id, shouldWait, timeout);
}

/**
 * Get all registered plugins of a specific type
 * @param pluginType The type of plugins to get
 * @param filter Optional filter function to determine which plugins to return
 */
export function getPlugins<T extends Plugin<any, any>>(
  pluginType: string,
  filter?: (plugin: PluginDescription) => boolean
): T[] {
  const registry = getPluginRegistry<any>(pluginType);
  return registry.getPlugins(filter) as T[];
}

/**
 * Load all registered plugins for a given type, returning them
 * @param pluginType The plugin registry type: tools, dataTypes, etc
 * @param filter Optional filter function to determine which plugins to load
 * @param shouldWait Whether to wait for plugins to be registered if they aren't already
 * @returns A Promise resolving to an array of plugins
 */
export async function loadAllPlugins<T extends Plugin<any, any>>(
  pluginType: string,
  filter?: (plugin: PluginDescription) => boolean,
  shouldWait = false
): Promise<T[]> {
  const registry = getPluginRegistry(pluginType);
  return registry.loadAll(filter, shouldWait) as Promise<T[]>;
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
export function onPluginsChange<T extends PluginDescription>(
  pluginType: string,
  callback: (plugins: T[]) => void
): () => void {
  const registry = getPluginRegistry<T>(pluginType);
  return registry.onChange(callback);
}

/**
 * Get plugins that match a specific value or wildcard, preferring specific matches.
 * This is useful for finding plugins that support a specific type (e.g. tools for a datatype)
 * where some plugins support all types ("*") and others support specific types.
 */
export function getMatchingPlugins<T extends PluginDescription>({
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
    const plugins = registry.getPlugins(matchPlugins(matchField, matchValue));
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
export async function loadMatchingPlugins<T extends PluginDescription>(
  pluginType: string,
  matchField: keyof T,
  matchValue: string | undefined,
  sortField?: keyof T,
  wait: boolean = false
): Promise<{
  plugins: T[];
  error: Error | undefined;
}> {
  try {
    const registry = getPluginRegistry<T>(pluginType);
    const plugins = await registry.loadAll(
      matchPlugins(matchField, matchValue),
      wait
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
