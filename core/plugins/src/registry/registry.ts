import EventEmitter from "eventemitter3";
import type { PluginDescription, PluginRegistryEvents } from "./types";
import debug from "debug";

const log = debug("patchwork:plugins");

/**
 * Registry for managing plugins of a specific type.
 * Stores plugin descriptions only -- consumers call import(plugin.importUrl)
 * to load implementations on demand.
 */
export class PluginRegistry<D extends PluginDescription> {
  #plugins = new Map<string, D>();
  #events = new EventEmitter<PluginRegistryEvents<D>>();

  register(plugin: D, importUrl?: string) {
    if (importUrl && !plugin.importUrl) {
      plugin.importUrl = importUrl;
    }

    const existing = this.#plugins.get(plugin.id);

    if (existing) {
      if (existing.importUrl == importUrl) {
        log(`updating ${plugin.id} provided by "${existing.importUrl}"`);
      } else {
        console.warn(
          `overriding "${plugin.id}" provided by "${existing.importUrl}" with new plugin provided by "${importUrl}"`
        );
      }
    }

    this.#plugins.set(plugin.id, plugin);

    this.#events.emit("registered", plugin);
    this.#events.emit("changed");
  }

  get(id: string): D | undefined {
    return this.#plugins.get(id);
  }

  all(): D[] {
    return Array.from(this.#plugins.values());
  }

  filter(predicate: (plugin: D) => boolean): D[] {
    return this.all().filter(predicate);
  }

  has(id: string): boolean {
    return this.#plugins.has(id);
  }

  on(
    event: "registered",
    callback: (plugin: D) => void | Promise<void>
  ): () => void;
  on(
    event: "removed",
    callback: (id: string) => void | Promise<void>
  ): () => void;
  on(event: "changed", callback: () => void | Promise<void>): () => void;
  on(
    event: keyof PluginRegistryEvents<D>,
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

  off(
    event: keyof PluginRegistryEvents<D>,
    callback: (...args: any[]) => void
  ): void {
    this.#events.off(event, callback);
  }
}
