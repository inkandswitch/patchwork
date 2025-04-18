import {
  PluginRegistry,
  Plugin,
  PluginDescription,
} from "./registry";

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
 * Register plugins for a specific plugin type
 */
async function registerPluginsForType(
  pluginType: string,
  plugins: Plugin<any, any>[],
  sourceModule: string
): Promise<void> {
  const registry = getPluginRegistry(pluginType);

  // Register each element with the registry
  for (const plugin of plugins) {
    await registry.register(plugin, sourceModule);
  }
}

/**
 * Register all plugins from an export
 */
export async function registerExportedPlugins(
  plugins: PluginsExport,
  sourceModule: string
): Promise<void> {
  for (const [pluginType, pluginList] of Object.entries(plugins)) {
    if (!plugins || !Array.isArray(pluginList)) continue;
    await registerPluginsForType(pluginType, pluginList, sourceModule);
  }
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
): T[] {
  const registry = getPluginRegistry<any>(pluginType);
  return registry.getAllPlugins() as T[];
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
export async function loadAllPluginsFromRegistry<
  T extends Plugin<any, any>
>(
  pluginType: string,
  filter?: (plugin: PluginDescription) => boolean,
  shouldWait = false
): Promise<Record<string, T>> {
  const registry = getPluginRegistry(pluginType);
  return registry.loadAll(filter, shouldWait) as Promise<Record<string, T>>;
}
