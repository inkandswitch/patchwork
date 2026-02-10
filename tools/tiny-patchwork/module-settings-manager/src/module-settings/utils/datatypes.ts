import type {
  Plugin,
  PluginDescription,
} from "@inkandswitch/patchwork-plugins";

/**
 * Type guard to check if a plugin has supportedDatatypes property
 */
export function hasSupportedDatatypes(
  plugin: Plugin<PluginDescription>
): plugin is Plugin<PluginDescription> & {
  supportedDatatypes: string[] | string | undefined;
} {
  return "supportedDatatypes" in plugin;
}

/**
 * Display format for supported datatypes
 */
export interface DatatypesDisplay {
  type: "empty" | "any" | "none" | "list";
  values: string[];
}

/**
 * Normalizes supportedDatatypes into a consistent display format.
 * Handles string | string[] | undefined types and special "*" wildcard.
 *
 * @param supportedDatatypes - The raw supportedDatatypes value
 * @returns Normalized display object with type and values
 *
 * @example
 * getSupportedDatatypesDisplay("*") // { type: "any", values: ["Any"] }
 * getSupportedDatatypesDisplay(["text", "image"]) // { type: "list", values: ["text", "image"] }
 * getSupportedDatatypesDisplay(undefined) // { type: "empty", values: [] }
 */
export function getSupportedDatatypesDisplay(
  supportedDatatypes?: string[] | string
): DatatypesDisplay {
  if (!supportedDatatypes) {
    return { type: "empty", values: [] };
  }

  // Handle string case (typically "*" for all types)
  if (typeof supportedDatatypes === "string") {
    return supportedDatatypes === "*"
      ? { type: "any", values: ["Any"] }
      : { type: "list", values: [supportedDatatypes] };
  }

  // Handle array case
  if (supportedDatatypes.includes("*")) {
    return { type: "any", values: ["Any"] };
  }

  if (supportedDatatypes.length === 0) {
    return { type: "none", values: ["None"] };
  }

  return { type: "list", values: supportedDatatypes };
}

/**
 * Checks if a plugin matches a specific datatype filter.
 *
 * @param plugin - The plugin to check
 * @param filterDataType - The datatype to filter by (e.g., "text", "image", "Any")
 * @returns true if the plugin supports the filtered datatype
 *
 * @example
 * matchesDatatype(plugin, "text") // true if plugin supports "text"
 * matchesDatatype(plugin, "Any") // true if plugin supports "*"
 */
export function matchesDatatype(
  plugin: Plugin<PluginDescription>,
  filterDataType: string
): boolean {
  if (!filterDataType) return true;

  if (!hasSupportedDatatypes(plugin)) {
    return false;
  }

  const datatypes = plugin.supportedDatatypes;

  if (Array.isArray(datatypes)) {
    return datatypes.includes(filterDataType);
  }

  if (datatypes === "*" && filterDataType === "Any") {
    return true;
  }

  return datatypes === filterDataType;
}

/**
 * Extracts all unique datatypes from a list of plugins.
 * Converts "*" wildcard to "Any" for display purposes.
 *
 * @param plugins - Array of plugins to extract datatypes from
 * @returns Sorted array of unique datatype strings
 *
 * @example
 * extractUniqueDatatypes(plugins) // ["Any", "image", "text"]
 */
export function extractUniqueDatatypes(
  plugins: Plugin<PluginDescription>[]
): string[] {
  const dataTypes = new Set<string>();

  plugins.forEach((plugin) => {
    if (!hasSupportedDatatypes(plugin)) return;

    const datatypes = plugin.supportedDatatypes;

    if (Array.isArray(datatypes)) {
      datatypes.forEach((dt) => dataTypes.add(dt));
    } else if (datatypes === "*") {
      dataTypes.add("Any");
    } else if (datatypes) {
      dataTypes.add(datatypes);
    }
  });

  return Array.from(dataTypes).sort();
}
