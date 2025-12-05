import type {
  ToolDescription,
  DatatypeDescription,
  Plugin,
  PluginDescription,
} from "@inkandswitch/patchwork-plugins";
import {
  getRegistry,
  getAllRegistries,
  getSupportedToolsForType,
} from "@inkandswitch/patchwork-plugins";
import { createEffect, onCleanup, createMemo } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

export type MaybeAccessor<T> = T | (() => T);

/**
 * Hook to get all plugins of a specific type
 */
export function usePlugins<T extends PluginDescription>(
  type: string
): Plugin<T>[] {
  const registry = getRegistry<T>(type);
  const [plugins, setPlugins] = createStore(registry.all());
  const dispose = registry.on("changed", () =>
    setPlugins(reconcile(registry.all()))
  );
  onCleanup(dispose);
  return plugins;
}

/**
 * Hook to get all tool plugins
 */
export function useTools(): Plugin<ToolDescription>[] {
  return usePlugins<ToolDescription>("patchwork:tool");
}

/**
 * Hook to get all datatype plugins
 */
export function useDatatypes(): Plugin<DatatypeDescription>[] {
  return usePlugins<DatatypeDescription>("patchwork:datatype");
}

/**
 * Hook to get filtered datatype plugins
 */
export function useFilteredDatatypes(
  filter: (item: DatatypeDescription) => boolean
): Plugin<DatatypeDescription>[] {
  const datatypeRegistry = getRegistry<DatatypeDescription>("patchwork:datatype");
  const [plugins, setPlugins] = createStore(datatypeRegistry.filter(filter));
  const dispose = datatypeRegistry.on("changed", () =>
    setPlugins(reconcile(datatypeRegistry.filter(filter)))
  );
  onCleanup(dispose);
  return plugins;
}

/**
 * Hook to get all plugins grouped by type
 */
export function useModules(): [string, Plugin<PluginDescription>[]][] {
  const [pluginsByType, setPluginsByType] = createStore<
    [string, Plugin<PluginDescription>[]][]
  >([]);

  createEffect(() => {
    const registries = getAllRegistries();
    const disposes: (() => void)[] = [];

    const update = () => {
      const grouped: [string, Plugin<PluginDescription>[]][] = [];
      for (const [type, registry] of registries) {
        grouped.push([type, registry.all()]);
      }
      setPluginsByType(reconcile(grouped));
    };

    update();

    for (const registry of registries.values()) {
      disposes.push(registry.on("changed", update));
    }

    onCleanup(() => disposes.forEach((d) => d()));
  });

  return pluginsByType;
}

/**
 * Hook to get tools that support a specific data type
 */
export function useSupportedToolsForType(
  type: MaybeAccessor<string>,
  options?: { includeUnlisted?: boolean }
): Plugin<ToolDescription>[] {
  const toolRegistry = getRegistry<ToolDescription>("patchwork:tool");

  const accessType = () => (typeof type === "function" ? type() : type);

  const [plugins, setPlugins] = createStore<Plugin<ToolDescription>[]>([]);

  createEffect(() => {
    const currentType = accessType();
    const tools = getSupportedToolsForType(currentType);
    const filtered = options?.includeUnlisted
      ? tools
      : tools.filter((tool) => !tool.unlisted);
    setPlugins(reconcile(filtered));

    const dispose = toolRegistry.on("changed", () => {
      const tools = getSupportedToolsForType(currentType);
      const filtered = options?.includeUnlisted
        ? tools
        : tools.filter((tool) => !tool.unlisted);
      setPlugins(reconcile(filtered));
    });

    onCleanup(dispose);
  });

  return plugins;
}

