import EventEmitter from "eventemitter3";
import type {
  LoadedPlugin,
  PluginDescription,
  Plugin,
  PluginRegistryEvents,
  LoadablePlugin,
} from "./types";
import debug from "debug";
import {
  isLoadablePlugin,
  isLoadedPlugin,
  isPluginDescription,
} from "./guards.js";

const log = debug("patchwork:plugins");

/**
 * Registry for managing plugins of a specific type
 * D = Description type that extends PluginDescription
 * I = Implementation type that will be loaded and combined with the description
 */
export class PluginRegistry<D extends PluginDescription, I = any> {
  #plugins = new Map<string, Plugin<D, I>>();
  #loadPromises = new Map<string, Promise<LoadedPlugin<D, I>>>();
  #events = new EventEmitter<PluginRegistryEvents<D, I>>();

  /**
   * Register an plugin with this registry
   */
  register(plugin: LoadablePlugin<D, I>, importUrl?: string) {
    // If an import URL was provided, attach it to the plugin
    if (importUrl && !plugin.importUrl) {
      plugin.importUrl = importUrl;
    }

    this.#plugins.set(plugin.id, plugin);

    this.#events.emit("registered", plugin);
    this.#events.emit("changed");
  }

  /**
   * Get an plugin by ID, returning either its description or loaded state
   */
  get(id: string): Plugin<D, I> | undefined {
    return this.#plugins.get(id);
  }

  /** Get all plugins, both descriptions and loaded */
  all(): Plugin<D, I>[] {
    const entries = Array.from(this.#plugins.values());
    return entries as Plugin<D, I>[];
  }

  /** Return a filtered list of plugins */
  filter(filter: (plugin: Plugin<D, I>) => boolean): Plugin<D, I>[] {
    return this.all().filter(filter);
  }

  /**
   * Load an plugin by ID, loading it on demand if necessary (asynchronous)
   * If shouldWait is true, will wait for the plugin to be registered if it isn't already
   */
  async load(id: string): Promise<LoadedPlugin<D, I> | undefined> {
    // TODO: error handling?
    log(`load called for: ${id}`, {});

    // Check if we already have a loaded plugin
    const plugin = this.#plugins.get(id);
    log(`Found existing plugin: ${id}`, {
      hasPlugin: !!plugin,
      isLoadable: plugin ? isLoadablePlugin<D, I>(plugin) : "N/A",
    });

    if (plugin && isLoadedPlugin<D, I>(plugin)) {
      log(`Returning already loaded plugin: ${id}`);
      return plugin;
    }

    // Get the plugin description
    const description = this.#plugins.get(id);
    if (!description) {
      log(`Plugin not registered: ${id}`);
      return undefined;
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
          const plugin = {
            ...descriptionWithoutLoad,
            module: implementation,
          };

          // Store the loaded version
          this.#plugins.set(description.id, plugin);
          this.#loadPromises.delete(id);

          // Notify listeners that an plugin has been loaded
          this.#events.emit("loaded", plugin);
          this.#events.emit("changed");

          return plugin;
        })
        .catch((error) => {
          console.error(`Failed to load plugin implementation: ${id}`, error);
          this.#loadPromises.delete(id);
          throw error;
        });

      // Store the promise so we don't load twice
      this.#loadPromises.set(id, loadPromise);
      return loadPromise;
    }

    if (isLoadedPlugin<D, I>(description)) {
      return description;
    }

    throw new Error(`Plugin ${id} is not loadable`);
  }

  /**
   * Load all provided plugins
   * @returns A promise resolving to an array of loaded plugins
   */
  async loadAll(plugins: Plugin<D, I>[]): Promise<LoadedPlugin<D, I>[]> {
    // Get all plugins or filter them if a filter function is provided
    // Create an array of promises for loading each plugin
    const loadPromises = plugins.map(async (plugin) => {
      try {
        const Plugin = await this.load(plugin.id);
        return Plugin;
      } catch (error) {
        console.warn(`Failed to load plugin ${plugin.id}:`, error);
        return undefined;
      }
    });

    // Wait for all plugins to load and filter out any that failed
    // TODO: use Promise.allSettled instead?
    // TODO: error handling?
    const results = await Promise.all(loadPromises);
    return results.filter(
      (plugin): plugin is Awaited<LoadedPlugin<D, I>> => plugin !== undefined
    );
  }

  /**
   * Check if an plugin ID is registered
   */
  has(id: string): boolean {
    return this.#plugins.has(id);
  }

  /** Subscribe to plugin events */
  // TODO: see if we can / want to reuse the eventemitter3 API here.
  on(
    event: "registered",
    callback: (plugin: Plugin<D, I>) => void | Promise<void>
  ): () => void;
  on(
    event: "loaded",
    callback: (plugin: LoadedPlugin<D, I>) => void | Promise<void>
  ): () => void;
  on(
    event: "removed",
    callback: (id: string) => void | Promise<void>
  ): () => void;
  on(event: "changed", callback: () => void | Promise<void>): () => void;
  on(
    event: keyof PluginRegistryEvents<D, I>,
    callback: (...args: any[]) => void | Promise<void>
  ): () => void {
    if (!callback || typeof callback !== "function") {
      throw new Error(`Invalid callback provided for event: ${event}`);
    }
    this.#events.on(event, callback);
    return () => {
      this.#events.off(event, callback);
    };
  }

  /** Unsubscribe from plugin events */
  off(
    event: keyof PluginRegistryEvents<D, I>,
    callback: (...args: any[]) => void
  ): void {
    this.#events.off(event, callback);
  }
}
