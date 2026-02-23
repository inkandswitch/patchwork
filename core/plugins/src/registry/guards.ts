import type { PluginDescription } from "./types";

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
 * Check if a value is a plugin, optionally of a specific type
 */
export function isPlugin<T extends PluginDescription = PluginDescription>(
  value: unknown
): value is T {
  return isPluginDescription<T>(value);
}
