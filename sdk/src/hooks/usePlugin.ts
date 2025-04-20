import { useEffect, useState, useCallback } from "react";
import {
  Plugin,
  getPluginFromRegistry,
  getAllPluginsFromRegistry,
  onPluginsChange,
  loadPluginFromRegistry,
  isLoadablePlugin,
} from "../plugins";

/**
 * Hook to get a specific plugin by ID
 * @param pluginType The type of plugin to get
 * @param id The ID of the plugin to get
 * @param options Configuration options
 * @param options.load Whether to load the plugin if it's loadable. Defaults to true.
 * @param options.wait Whether to wait for the plugin to be registered if it isn't already. Defaults to false.
 */
export function usePlugin<T extends Plugin>(
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
    id ? getPluginFromRegistry<T>(pluginType, id) : undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const loadPlugin = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(undefined);

      // Try to get the plugin normally first
      let Plugin = getPluginFromRegistry<T>(pluginType, id);

      // If not found or is a loadable plugin and load is true, load it
      if (load && (!Plugin || isLoadablePlugin(Plugin))) {
        Plugin = await loadPluginFromRegistry<T>(pluginType, id, wait);
      }

      setPlugin(Plugin);
    } catch (err) {
      console.error(`Error loading plugin ${id}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [pluginType, id, load, wait]);

  useEffect(() => {
    if (!id) {
      setPlugin(undefined);
      setIsLoading(false);
      setError(undefined);
      return;
    }

    // Try to load immediately if load is true
    if (load) {
      loadPlugin();
    } else {
      // Just get the plugin without loading
      setPlugin(getPluginFromRegistry<T>(pluginType, id));
    }

    // Listen for changes to the plugin
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = onPluginsChange<T>(pluginType, (plugins) => {
        if (plugins && plugins[id]) {
          const updatedPlugin = plugins[id];

          // If the plugin exists but needs loading and load is true, load it
          if (load && isLoadablePlugin(updatedPlugin)) {
            loadPlugin();
          } else {
            // It's already fully loaded or we don't want to load it
            setPlugin(updatedPlugin);
          }
        }
      });
    } catch (err) {
      console.warn(`Error subscribing to plugin changes:`, err);
    }

    return function cleanupPluginListener() {
      try {
        if (unsubscribe && typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch (err) {
        console.warn(`Error during cleanup for plugin ${id}:`, err);
      }
    };
  }, [pluginType, id, load, loadPlugin]);

  return { plugin, isLoading, error };
}

/**
 * Hook to get all plugin descriptions of a specific type
 * @param pluginType The type of plugins to get
 */
export function usePluginDescriptions<T extends Plugin>(
  pluginType: string
): Record<string, T> {
  const [plugins, setPlugins] = useState<Record<string, T>>(
    getAllPluginsFromRegistry<T>(pluginType) || {}
  );

  useEffect(() => {
    // Initial fetch
    setPlugins(getAllPluginsFromRegistry<T>(pluginType) || {});

    // Listen for changes
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = onPluginsChange<T>(pluginType, (newPlugins) => {
        if (newPlugins) {
          setPlugins(newPlugins);
        } else {
          setPlugins({});
        }
      });
    } catch (err) {
      console.warn(`Error subscribing to plugins changes:`, err);
    }

    return function cleanupPluginsListener() {
      try {
        if (unsubscribe && typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch (err) {
        console.warn(`Error during cleanup for plugins:`, err);
      }
    };
  }, [pluginType]);

  return plugins;
}
