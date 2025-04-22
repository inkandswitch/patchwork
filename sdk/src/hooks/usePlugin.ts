import { useEffect, useState, useCallback } from "react";
import {
  Plugin,
  PluginDescription,
  getPlugin,
  getPlugins,
  onPluginsChange,
  isLoadablePlugin,
  loadPlugin,
  getMatchingPlugins,
} from "../plugins";

/**
 * Hook to get a specific plugin by ID
 * @param pluginType The type of plugin to get
 * @param id The ID of the plugin to get
 * @param options Configuration options
 * @param options.load Whether to load the plugin if it's loadable. Defaults to true.
 * @param options.wait Whether to wait for the plugin to be registered if it isn't already. Defaults to false.
 */
export function usePlugin<T extends Plugin<PluginDescription>>(
  pluginType: string,
  id: string | undefined,
  options: { load?: boolean; wait?: boolean } = {}
): {
  plugin: T | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { load = true, wait = false } = options;
  const [plugin, setPlugin] = useState<T | undefined>(
    id ? getPlugin<T>(pluginType, id) : undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const loadPlugin = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(undefined);
      const loadedPlugin = await loadPlugin<T>(pluginType, id, wait);
      setPlugin(loadedPlugin);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [pluginType, id, wait]);

  useEffect(() => {
    if (!id) {
      setPlugin(undefined);
      setIsLoading(false);
      setError(undefined);
      return;
    }

    // Get initial plugin state
    const initialPlugin = getPlugin<T>(pluginType, id);
    setPlugin(initialPlugin);

    // Load if needed
    if (load && (!initialPlugin || isLoadablePlugin(initialPlugin))) {
      loadPlugin();
    }

    // Subscribe to plugin changes
    const unsubscribe = onPluginsChange<T>(pluginType, (plugins) => {
      const updatedPlugin = plugins.find(
        (p) => (p as PluginDescription).id === id
      );
      if (updatedPlugin) {
        if (load && isLoadablePlugin(updatedPlugin)) {
          loadPlugin();
        } else {
          setPlugin(updatedPlugin);
        }
      }
    });

    return () => unsubscribe();
  }, [pluginType, id, load, loadPlugin]);

  return { plugin, isLoading, error };
}

/**
 * Hook to get all plugin descriptions of a specific type
 * @param pluginType The type of plugins to get
 */
export function usePluginDescriptions<T extends Plugin<PluginDescription>>(
  pluginType: string
): T[] {
  const [plugins, setPlugins] = useState<T[]>([]);

  useEffect(() => {
    // Initial fetch
    setPlugins(getPlugins<T>(pluginType));

    // Listen for changes
    const unsubscribe = onPluginsChange<T>(pluginType, (newPlugins) => {
      setPlugins(newPlugins);
    });

    return () => unsubscribe();
  }, [pluginType]);

  return plugins;
}

/**
 * Hook to get all plugin descriptions that match certain criteria
 * Similar to getMatchingPlugins but reactive to plugin registry changes
 */
export function useMatchingPluginDescriptions<T extends PluginDescription>({
  pluginType,
  matchField,
  matchValue,
  sortField,
}: {
  pluginType: string;
  matchField: keyof T;
  matchValue: string | undefined;
  sortField?: keyof T;
}): {
  plugins: T[];
  error: Error | undefined;
} {
  const [result, setResult] = useState<{
    plugins: T[];
    error: Error | undefined;
  }>({ plugins: [], error: undefined });

  useEffect(() => {
    // Get initial plugins
    setResult(
      getMatchingPlugins<T>({ pluginType, matchField, matchValue, sortField })
    );

    // Subscribe to plugin changes
    const unsubscribe = onPluginsChange<T>(pluginType, () => {
      setResult(
        getMatchingPlugins<T>({ pluginType, matchField, matchValue, sortField })
      );
    });

    return () => unsubscribe();
  }, [pluginType, matchField, matchValue, sortField]);

  return result;
}
