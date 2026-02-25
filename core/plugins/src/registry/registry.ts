import EventEmitter from "eventemitter3";
import type { PluginDescription, PluginRegistryEvents } from "./types";
import debug from "debug";

const log = debug("patchwork:plugins");

const DEFAULT_BRANCH = "default";

/**
 * Registry for managing plugins of a specific type.
 * Supports multiple versions per plugin ID, keyed by branch name.
 * Stores plugin descriptions only -- consumers call import(plugin.importUrl)
 * to load implementations on demand.
 */
export class PluginRegistry<D extends PluginDescription> {
  /** Outer key: plugin id, inner key: branch name (or "__pinned:<version>" for anonymous) */
  #plugins = new Map<string, Map<string, D>>();
  #events = new EventEmitter<PluginRegistryEvents<D>>();

  register(plugin: D, importUrl?: string) {
    if (importUrl && !plugin.importUrl) {
      plugin.importUrl = importUrl;
    }

    const branch = plugin.branch ?? DEFAULT_BRANCH;
    const key = plugin.branch ? branch : this.#pinnedKey(plugin.version);

    let versions = this.#plugins.get(plugin.id);
    if (!versions) {
      versions = new Map();
      this.#plugins.set(plugin.id, versions);
    }

    const existing = versions.get(key);
    if (existing) {
      if (existing.importUrl === plugin.importUrl) {
        log(`updating ${plugin.id}@${key}`);
      } else {
        log(`replacing ${plugin.id}@${key}: "${existing.importUrl}" -> "${plugin.importUrl}"`);
      }
    } else {
      log(`registering ${plugin.id}@${key}`);
    }

    versions.set(key, plugin);

    this.#events.emit("registered", plugin);
    this.#events.emit("changed");
  }

  /** Get the default branch version of a plugin (backward compat) */
  get(id: string): D | undefined {
    return this.#plugins.get(id)?.get(DEFAULT_BRANCH);
  }

  /** Get a specific branch version */
  getBranch(id: string, branch: string): D | undefined {
    return this.#plugins.get(id)?.get(branch);
  }

  /** Get all known versions/branches for a plugin */
  getVersions(id: string): D[] {
    const versions = this.#plugins.get(id);
    if (!versions) return [];
    return Array.from(versions.values());
  }

  /** Get all plugins across all IDs (returns the default branch for each) */
  all(): D[] {
    const result: D[] = [];
    for (const versions of this.#plugins.values()) {
      const def = versions.get(DEFAULT_BRANCH);
      if (def) {
        result.push(def);
      } else {
        const first = versions.values().next().value;
        if (first) result.push(first);
      }
    }
    return result;
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

  #pinnedKey(version?: string): string {
    return version ? `__pinned:${version}` : DEFAULT_BRANCH;
  }
}
