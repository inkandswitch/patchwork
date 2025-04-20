import EventEmitter from "eventemitter3";
import { IconType } from "../ui";
import { ToolDescription } from "../tools";
import { DataTypeDescription } from "../datatypes";
import { ImportMethod } from "../importMethods";
import { ExportMethod } from "../exportMethods";

/**
 * Map of plugin type strings to their corresponding description types
 */
export type PluginTypeMap = {
  "patchwork:tool": ToolDescription;
  "patchwork:dataType": DataTypeDescription;
  "patchwork:importMethod": ImportMethod;
  "patchwork:exportMethod": ExportMethod;
  [key: string]: PluginDescription; // Allow for user-defined plugin types
};

/**
 * Base interface for all plugin descriptions
 */
export interface PluginDescription {
  id: string;
  type: string;
  name: string;
  icon?: IconType;
  importUrl?: string;
}

/**
 * Generic loadable plugin
 * D = Description type that extends PluginDescription
 * I = Implementation type that will be loaded
 */
export type LoadablePlugin<
  D extends PluginDescription = PluginDescription,
  I = any
> = D & {
  load: () => Promise<I>;
};

/**
 * A fully loaded plugin combining description and implementation
 * D = Description type, I = Implementation type
 */
export type Plugin<
  D extends PluginDescription = PluginDescription,
  I = any
> = D & I;

/**
 * Registry for managing plugins of a specific type
 * D = Description type that extends PluginDescription
 * I = Implementation type that will be loaded and combined with the description
 */
export class PluginRegistry<D extends PluginDescription, I = any> {
  private plugins = new Map<string, Plugin<D, I> | LoadablePlugin<D, I>>();
  private loadPromises = new Map<string, Promise<Plugin<D, I>>>();
  private events = new EventEmitter<{
    "plugins:changed": (plugins: Record<string, D | Plugin<D, I>>) => void;
  }>();

  /**
   * Register an plugin with this registry
   */
  async register(
    plugin: D | LoadablePlugin<D, I>,
    importUrl?: string
  ): Promise<void> {
    // If an import URL was provided, attach it to the plugin
    if (importUrl && !plugin.importUrl) {
      plugin.importUrl = importUrl;
    }

    // Convert D to LoadablePlugin if needed
    const loadablePlugin = isLoadablePlugin(plugin)
      ? plugin
      : { ...plugin, load: async () => plugin as unknown as I };

    // Store the plugin
    this.plugins.set(plugin.id, loadablePlugin);

    // Notify listeners
    this.events.emit("plugins:changed", this.getAllPlugins());
  }

  /**
   * Get an plugin description by ID without loading it (synchronous)
   * Returns the description part of an plugin, whether loaded or not
   */
  getDescriptionById(id: string): D | undefined {
    const plugin = this.plugins.get(id);
    if (!plugin) return undefined;

    // Extract just the description part by omitting any implementation-specific fields
    const { load, ...description } = plugin as any;
    return description as D;
  }

  /**
   * Get an plugin by ID, returning either its description or loaded state
   */
  getById(id: string): D | Plugin<D, I> | undefined {
    return this.plugins.get(id);
  }

  /**
   * Load an plugin by ID, loading it on demand if necessary (asynchronous)
   * If shouldWait is true, will wait for the plugin to be registered if it isn't already
   */
  async loadById(
    id: string,
    shouldWait = false,
    timeout = 10000
  ): Promise<Plugin<D, I> | undefined> {
    // Check if we already have a loaded plugin
    const plugin = this.plugins.get(id);
    if (plugin && !isLoadablePlugin(plugin)) {
      return plugin;
    }

    // Check if we're already loading this plugin
    if (this.loadPromises.has(id)) {
      return this.loadPromises.get(id);
    }

    // Get the plugin description
    const description = this.plugins.get(id);
    if (!description) {
      // If the plugin isn't registered and we shouldn't wait, return undefined
      if (!shouldWait) {
        return undefined;
      }

      // If shouldWait is true, set up a promise that will listen for plugin registration events
      return new Promise<Plugin<D, I> | undefined>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          this.events.off("plugins:changed", checkForPlugin);
          reject(new Error(`Timeout waiting for plugin ${id}`));
        }, timeout);

        const checkForPlugin = async () => {
          if (this.plugins.has(id)) {
            clearTimeout(timeoutId);
            this.events.off("plugins:changed", checkForPlugin);
            const plugin = await this.loadById(id);
            resolve(plugin);
          }
        };

        // Listen for plugin registration events
        this.events.on("plugins:changed", checkForPlugin);

        // Check once immediately in case it was registered between our initial check and setting up the listener
        checkForPlugin();
      });
    }

    // If the plugin is loadable, load it
    if (isLoadablePlugin(description)) {
      const loadPromise = description.load().then((implementation) => {
        // Merge the implementation with the plugin metadata to create a complete Plugin
        // Omit the load method as it's no longer needed
        const { load, ...descriptionWithoutLoad } = description;
        const loadedPlugin = createPlugin(
          descriptionWithoutLoad,
          implementation
        ) as Plugin<D, I>;

        // Store the loaded version
        this.plugins.set(description.id, loadedPlugin);
        this.loadPromises.delete(id);

        // Notify listeners that an plugin has been loaded
        this.events.emit("plugins:changed", this.getAllPlugins());

        return loadedPlugin;
      });

      // Store the promise so we don't load twice
      this.loadPromises.set(id, loadPromise);
      return loadPromise;
    }

    return description as Plugin<D, I>;
  }

  /**
   * Get all plugins, both descriptions and loaded
   */
  getAllPlugins(): Record<string, D | Plugin<D, I>> {
    return Object.fromEntries(this.plugins.entries());
  }

  /**
   * Load all registered plugins
   * @param filter Optional filter function to determine which plugins to load
   * @param shouldWait Whether to wait for plugins to be registered if they aren't already
   * @param timeout Timeout in milliseconds for waiting operations
   * @returns A promise resolving to a record of loaded plugins
   */
  async loadAll(
    filter?: (plugin: D | Plugin<D, I>) => boolean,
    shouldWait = false,
    timeout = 10000
  ): Promise<Record<string, Plugin<D, I>>> {
    // Get all plugins or filter them if a filter function is provided
    const pluginsToLoad = filter
      ? Array.from(this.plugins.entries()).filter(([_, plugin]) =>
          filter(plugin)
        )
      : Array.from(this.plugins.entries());

    // Create an array of promises for loading each plugin
    const loadPromises = pluginsToLoad.map(async ([id, _]) => {
      try {
        const loadedPlugin = await this.loadById(id, shouldWait, timeout);
        return [id, loadedPlugin];
      } catch (error) {
        console.warn(`Failed to load plugin ${id}:`, error);
        return [id, undefined];
      }
    });

    // Wait for all plugins to load
    const results = await Promise.all(loadPromises);

    // Filter out any plugins that failed to load and convert to a record
    return Object.fromEntries(
      results.filter(([_, plugin]) => plugin !== undefined) as [
        string,
        Plugin<D, I>
      ][]
    );
  }

  /**
   * Check if an plugin ID is registered
   */
  hasPlugin(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * Subscribe to plugin changes
   */
  onChange(
    callback: (plugins: Record<string, D | Plugin<D, I>>) => void
  ): () => void {
    if (!callback || typeof callback !== "function") {
      console.warn("Invalid callback provided to PluginRegistry.onChange");
      return () => {}; // Return a no-op function
    }

    try {
      this.events.on("plugins:changed", callback);

      // Create a simple cleanup function with no additional properties
      return () => {
        this.events.off("plugins:changed", callback);
      };
    } catch (error) {
      console.warn("Error setting up plugin change listener:", error);
      return () => {}; // Return a no-op function
    }
  }
}

/**
 * Check if a value is a plugin, optionally of a specific type
 * If a type is provided, it will be used to infer the correct plugin type
 */
export function isPlugin<T extends PluginDescription = PluginDescription>(
  value: unknown,
  pluginType?: keyof PluginTypeMap
): value is Plugin<T> {
  if (!value || typeof value !== "object") return false;
  const plugin = value as Plugin;
  if (!plugin.type || !plugin.name || !plugin.description) return false;
  if (pluginType && plugin.type !== pluginType) return false;
  return true;
}

/**
 * Check if a value is a loadable plugin
 */
export function isLoadablePlugin<
  D extends PluginDescription = PluginDescription,
  I = any
>(value: unknown): value is LoadablePlugin<D, I> {
  if (!value || typeof value !== "object") return false;
  const plugin = value as LoadablePlugin;
  return (
    "id" in plugin &&
    "type" in plugin &&
    "name" in plugin &&
    "load" in plugin &&
    typeof plugin.load === "function"
  );
}

/**
 * Create a plugin by combining a description and implementation
 */
export function createPlugin<D extends PluginDescription, I>(
  description: D,
  implementation: I
): Plugin<D, I> {
  return { ...description, ...implementation } as Plugin<D, I>;
}
