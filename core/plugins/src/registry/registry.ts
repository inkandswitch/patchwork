import EventEmitter from "eventemitter3";
import type {
  LoadedPlugin,
  PluginDescription,
  Plugin,
  PluginRegistryEvents,
} from "./types";
import debug from "debug";
import { isLoadablePlugin, isPluginDescription } from ".";

const log = debug("patchwork:plugins");

/**
 * Registry for managing plugins of a specific type
 * D = Description type that extends PluginDescription
 * I = Implementation type that will be loaded and combined with the description
 */
export class PluginRegistry<D extends PluginDescription, I = any> {
  private plugins = new Map<string, Plugin<D, I>>();
  private loadPromises = new Map<string, Promise<LoadedPlugin<D, I>>>();
  private events = new EventEmitter<PluginRegistryEvents<D, I>>();

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

    this.events.emit("plugins:changed", this.getPlugins(), plugin);
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
    log(`loadById called for: ${id}`, {
      shouldWait,
      timeout,
    });

    // Check if we already have a loaded plugin
    const plugin = this.plugins.get(id);
    log(`Found existing plugin: ${id}`, {
      hasPlugin: !!plugin,
      isLoadable: plugin ? isLoadablePlugin<D, I>(plugin) : "N/A",
    });

    if (plugin && !isLoadablePlugin<D, I>(plugin)) {
      log(`Returning already loaded plugin: ${id}`);
      return plugin;
    }

    // Get the plugin description
    const description = this.plugins.get(id);
    if (!description) {
      log(`Plugin not registered: ${id}, shouldWait: ${shouldWait}`);
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
      log(`Loading plugin implementation: ${id}`);
      const loadPromise = description
        .load()
        .then((implementation) => {
          log(`Successfully loaded implementation for: ${id}`, implementation);
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
          this.events.emit("plugins:changed", this.getPlugins(), description);

          return Plugin;
        })
        .catch((error) => {
          console.error(`Failed to load plugin implementation: ${id}`, error);
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
  onChange(
    callback: PluginRegistryEvents<D, I>["plugins:changed"]
  ): () => void {
    if (!callback || typeof callback !== "function") {
      throw new Error("Invalid callback provided to PluginRegistry.onChange");
    }

    this.events.on("plugins:changed", callback);

    return () => {
      this.events.off("plugins:changed", callback);
    };
  }
}
