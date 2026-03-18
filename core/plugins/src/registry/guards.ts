import type {
  LoadablePlugin,
  LoadedPlugin,
  PluginDescription,
  Plugin,
} from "./types";

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
 * Check if a value is a loaded plugin
 */

export function isLoadedPlugin<
  D extends PluginDescription = PluginDescription,
  I = any,
>(value: unknown): value is LoadedPlugin<D, I> {
  return isPluginDescription<D>(value) && "module" in value;
}

/**
 * Check if a value is a plugin, optionally of a specific type
 * If a type is provided, it will be used to infer the correct plugin type
 */
export function isPlugin<
  T extends PluginDescription = PluginDescription,
  I = any,
>(value: unknown): value is Plugin<T, I> {
  return isPluginDescription<T>(value);
}
