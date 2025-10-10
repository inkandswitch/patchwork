import EventEmitter from "eventemitter3";
import {
  LoadablePlugin,
  LoadedPlugin,
  PluginDescription,
  PluginTypeMap,
  Plugin,
} from "./types";

/**
 * Registry for managing plugins of a specific type
 * D = Description type that extends PluginDescription
 * I = Implementation type that will be loaded and combined with the description
 */
export class PluginRegistry<D extends PluginDescription, I = any> {
  private plugins = new Map<string, Plugin<D, I>>();
  private loadPromises = new Map<string, Promise<LoadedPlugin<D, I>>>();
  private events = new EventEmitter<{
    "plugins:changed": (plugins: LoadedPlugin<D, I>[]) => void;
  }>();

  /**
   * Register an plugin with this registry
   */
  async register(plugin: Plugin<D, I>, importUrl?: string): Promise<void> {
    // If an import URL was provided, attach it to the plugin
    if (importUrl && !plugin.importUrl) {
      plugin.importUrl = importUrl;
    }

    // Store the plugin
    this.plugins.set(plugin.id, plugin);

    // Notify listeners
    this.events.emit("plugins:changed", this.getPlugins());
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
  getById(id: string): D | LoadedPlugin<D, I> | undefined {
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
  ): Promise<LoadedPlugin<D, I> | undefined> {
    console.log(`[PluginRegistry] loadById called for: ${id}`, {
      shouldWait,
      timeout,
    });

    // Check if we already have a loaded plugin
    const plugin = this.plugins.get(id);
    console.log(`[PluginRegistry] Found existing plugin: ${id}`, {
      hasPlugin: !!plugin,
      isLoadable: plugin ? isLoadablePlugin<D, I>(plugin) : "N/A",
    });

    if (plugin && !isLoadablePlugin<D, I>(plugin)) {
      console.log(`[PluginRegistry] Returning already loaded plugin: ${id}`);
      return plugin;
    }

    // Get the plugin description
    const description = this.plugins.get(id);
    if (!description) {
      console.log(
        `[PluginRegistry] Plugin not registered: ${id}, shouldWait: ${shouldWait}`
      );
      // If the plugin isn't registered and we shouldn't wait, return undefined
      if (!shouldWait) {
        return undefined;
      }

      // If shouldWait is true, set up a promise that will listen for plugin registration events
      return new Promise<LoadedPlugin<D, I> | undefined>((resolve, reject) => {
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
      console.log(`[PluginRegistry] Loading plugin implementation: ${id}`);
      const loadPromise = description
        .load()
        .then((implementation) => {
          console.log(
            `[PluginRegistry] Successfully loaded implementation for: ${id}`,
            implementation
          );
          // Merge the implementation with the plugin metadata to create a complete Plugin
          // Omit the load method as it's no longer needed
          const { load, ...descriptionWithoutLoad } = description;
          if (!isPluginDescription<D>(descriptionWithoutLoad)) {
            throw new Error("Invalid plugin description");
          }
          const Plugin = {
            ...descriptionWithoutLoad,
            module: implementation,
          } as LoadedPlugin<D, I>;

          // Store the loaded version
          this.plugins.set(description.id, Plugin);
          this.loadPromises.delete(id);

          // Notify listeners that an plugin has been loaded
          this.events.emit("plugins:changed", this.getPlugins());

          return Plugin;
        })
        .catch((error) => {
          console.error(
            `[PluginRegistry] Failed to load plugin implementation: ${id}`,
            error
          );
          this.loadPromises.delete(id);
          throw error;
        });

      // Store the promise so we don't load twice
      this.loadPromises.set(id, loadPromise);
      return loadPromise;
    }

    return description as LoadedPlugin<D, I>;
  }

  /**
   * Get all plugins, both descriptions and loaded
   * @param filter Optional filter function to determine which plugins to return
   */
  getPlugins(
    filter?: (plugin: LoadedPlugin<D, I>) => boolean
  ): LoadedPlugin<D, I>[] {
    const entries = Array.from(this.plugins.values());
    return filter
      ? entries.filter((plugin): plugin is LoadedPlugin<D, I> =>
          filter(plugin as LoadedPlugin<D, I>)
        )
      : (entries as LoadedPlugin<D, I>[]);
  }

  /**
   * Load all registered plugins
   * @param filter Optional filter function to determine which plugins to load
   * @param shouldWait Whether to wait for plugins to be registered if they aren't already
   * @param timeout Timeout in milliseconds for waiting operations
   * @returns A promise resolving to an array of loaded plugins
   */
  async loadAll(
    filter?: (plugin: D) => boolean,
    shouldWait = false,
    timeout = 10000
  ): Promise<LoadedPlugin<D, I>[]> {
    // Get all plugins or filter them if a filter function is provided
    const pluginsToLoad = filter
      ? Array.from(this.plugins.entries()).filter(([_, plugin]) =>
          filter(plugin)
        )
      : Array.from(this.plugins.entries());

    // Create an array of promises for loading each plugin
    const loadPromises = pluginsToLoad.map(async ([id, _]) => {
      try {
        const Plugin = await this.loadById(id, shouldWait, timeout);
        return Plugin;
      } catch (error) {
        console.warn(`Failed to load plugin ${id}:`, error);
        return undefined;
      }
    });

    // Wait for all plugins to load and filter out any that failed
    const results = await Promise.all(loadPromises);
    return results.filter(
      (plugin): plugin is Awaited<LoadedPlugin<D, I>> => plugin !== undefined
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
  onChange(callback: (plugins: LoadedPlugin<D, I>[]) => void): () => void {
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
