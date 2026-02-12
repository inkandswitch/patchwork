import { createMemo, createResource, type Accessor } from "solid-js";
import {
  isValidAutomergeUrl,
  type AutomergeUrl,
} from "@automerge/automerge-repo";
import { importModuleFromFolderDocUrl } from "@inkandswitch/patchwork-filesystem";
import {
  extractUniqueDatatypes,
  matchesDatatype,
  getSupportedDatatypesDisplay,
  type DatatypesDisplay,
} from "../utils/datatypes.ts";
import type {
  Plugin,
  PluginDescription,
} from "@inkandswitch/patchwork-plugins";

interface UseModulePluginsParams {
  modules: AutomergeUrl[];
  searchQuery: Accessor<string>;
  filterPluginType: Accessor<string>;
  filterDataType: Accessor<string>;
  sortOrder: Accessor<"name-asc" | "name-desc" | "type-asc" | "type-desc">;
}

export type EnrichedPlugin = Plugin<PluginDescription> & {
  isValidUrl: boolean;
  datatypesDisplay: DatatypesDisplay;
};

export function useModulePlugins(params: UseModulePluginsParams) {
  const { modules, searchQuery, filterPluginType, filterDataType, sortOrder } =
    params;

  // Load all plugins from user's modules
  const [allPlugins] = createResource(
    () => modules,
    async (moduleUrls) => {
      const pluginArrays = await Promise.all(
        moduleUrls.map(async (url) => {
          const module = await importModuleFromFolderDocUrl(url);
          return module?.plugins || [];
        })
      );
      return pluginArrays.flat();
    }
  );

  // Get unique plugin types for filter dropdown
  const uniquePluginTypes = createMemo(() => {
    const plugins = allPlugins();
    if (!plugins) return [];
    const types = new Set(plugins.map((p) => p.type));
    return Array.from(types).sort();
  });

  // Get unique data types for filter dropdown
  const uniqueDataTypes = createMemo(() => {
    const plugins = allPlugins();
    if (!plugins) return [];
    return extractUniqueDatatypes(plugins);
  });

  // Sort plugins first (only re-runs when allPlugins or sortOrder changes)
  const sortedPlugins = createMemo(() => {
    const plugins = allPlugins();
    if (!plugins) return [];

    const order = sortOrder();
    return [...plugins].sort((a, b) => {
      if (order === "type-asc" || order === "type-desc") {
        const typeCompare = a.type.localeCompare(b.type);
        if (typeCompare !== 0)
          return order === "type-asc" ? typeCompare : -typeCompare;
        return a.name.localeCompare(b.name);
      }
      const nameCompare = a.name.localeCompare(b.name);
      return order === "name-asc" ? nameCompare : -nameCompare;
    });
  });

  // Filter sorted plugins (re-runs when search/filters change, but not on sort)
  const filteredPlugins = createMemo(() => {
    const plugins = sortedPlugins();

    const query = searchQuery().toLowerCase();
    const pluginTypeFilter = filterPluginType();
    const dataTypeFilter = filterDataType();

    // Filter plugins by search query, plugin type, and data type
    return plugins.filter((plugin) => {
      // Apply search query filter
      if (query) {
        const matchesQuery =
          plugin.name.toLowerCase().includes(query) ||
          plugin.type.toLowerCase().includes(query) ||
          plugin.id?.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Apply plugin type filter
      if (pluginTypeFilter && plugin.type !== pluginTypeFilter) {
        return false;
      }

      // Apply data type filter
      if (dataTypeFilter && !matchesDatatype(plugin, dataTypeFilter)) {
        return false;
      }

      return true;
    });
  });

  // Pre-compute plugin metadata to avoid expensive render-time computations
  const enrichedPlugins = createMemo((): EnrichedPlugin[] => {
    return filteredPlugins().map((plugin) => ({
      ...plugin,
      isValidUrl: isValidAutomergeUrl(plugin.importUrl),
      datatypesDisplay: getSupportedDatatypesDisplay(
        "supportedDatatypes" in plugin
          ? (plugin.supportedDatatypes as string[] | string | undefined)
          : undefined
      ),
    }));
  });

  return {
    allPlugins,
    filteredPlugins: enrichedPlugins,
    uniquePluginTypes,
    uniqueDataTypes,
  };
}
