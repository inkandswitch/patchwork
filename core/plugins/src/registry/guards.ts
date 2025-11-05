import type {
  LoadablePlugin,
  LoadedPlugin,
  PluginDescription,
  PluginTypeMap,
} from "./types";

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
