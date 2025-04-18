import { useEffect, useState, useCallback } from "react";
import {
  Plugin,
  getPluginRegistry,
  getPluginFromRegistry,
  getAllPluginsFromRegistry,
  hasPlugin,
  onPluginsChange,
  loadPluginFromRegistry,
  isLoadablePlugin,
  loadAllPluginsFromRegistry,
  PluginDescription,
} from "../plugins";

/**
 * Hook to get a specific plugin by ID
 */
export function usePlugin<T extends Plugin>(
  pluginType: string,
  id: string | undefined
): T | undefined {
  const [plugin, setPlugin] = useState<T | undefined>(
    id ? getPluginFromRegistry<T>(pluginType, id) : undefined
  );

  useEffect(() => {
    if (!id) {
      setPlugin(undefined);
      return;
    }

    // Set initial state
    setPlugin(getPluginFromRegistry<T>(pluginType, id));

    // Listen for changes
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = onPluginsChange<T>(pluginType, (plugins) => {
        if (plugins) {
          setPlugin(plugins[id] as T | undefined);
        }
      });
    } catch (err) {
      console.warn(`Error subscribing to plugin changes:`, err);
    }

    // Return a simple function with no properties for cleanup
    return function cleanupPluginListener() {
      try {
        if (unsubscribe && typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch (err) {
        console.warn(`Error during cleanup for plugin ${id}:`, err);
      }
    };
  }, [pluginType, id]);

  return plugin;
}

/**
 * Hook to get all plugins of a specific type
 */
export function usePlugins<T extends Plugin>(
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

    // Return a simple function with no properties for cleanup
    return function cleanupPluginsListener() {
      try {
        if (unsubscribe && typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch (err) {
        console.warn(`Error during cleanup for plugins:`, err);
      }
      console.log("cleanupPluginsListener");
    };
  }, [pluginType]);

  return plugins || {};
}

/**
 * Hook to get a filtered list of plugins
 */
export function useFilteredPlugins<T extends Plugin>(
  pluginType: string,
  filterFn: (plugin: T) => boolean
): T[] {
  const plugins = usePlugins<T>(pluginType);

  const [filteredPlugins, setFilteredPlugins] = useState<T[]>(() => {
    // Safely handle the case where plugins might be undefined or empty
    if (!plugins) return [];
    return Object.values(plugins).filter(filterFn) as T[];
  });

  useEffect(() => {
    // Safely handle the case where plugins might be undefined or empty
    if (!plugins) {
      setFilteredPlugins([]);
      return;
    }
    setFilteredPlugins(Object.values(plugins).filter(filterFn) as T[]);
  }, [plugins, filterFn]);

  return filteredPlugins;
}

/**
 * Hook to check if a plugin exists
 */
export function useHasPlugin(
  pluginType: string,
  id: string | undefined
): boolean {
  const [exists, setExists] = useState<boolean>(
    id ? hasPlugin(pluginType, id) : false
  );

  useEffect(() => {
    if (!id) {
      setExists(false);
      return;
    }

    // Set initial state
    setExists(hasPlugin(pluginType, id));

    // Listen for changes
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = onPluginsChange(pluginType, () => {
        setExists(hasPlugin(pluginType, id));
      });
    } catch (err) {
      console.warn(
        `Error subscribing to plugin existence changes:`,
        err
      );
    }

    // Return a simple function with no properties for cleanup
    return function cleanupHasPluginListener() {
      try {
        if (unsubscribe && typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch (err) {
        console.warn(`Error during cleanup for has plugin ${id}:`, err);
      }
    };
  }, [pluginType, id]);

  return exists;
}

/**
 * Hook to get and load a plugin by ID.
 * If the plugin is loadable but not yet loaded, it will load it automatically.
 */
export function useLoadedPlugin<T extends Plugin>(
  pluginType: string,
  id: string | undefined,
  wait: boolean = false
): {
  plugin: T | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const [plugin, setPlugin] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const loadPlugin = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(undefined);

      // Try to get the plugin normally first
      let Plugin = getPluginFromRegistry<T>(pluginType, id);

      // If not found or is a loadable plugin, load it
      if (!Plugin || isLoadablePlugin(Plugin)) {
        Plugin = await loadPluginFromRegistry<T>(pluginType, id, wait);
      }

      setPlugin(Plugin);
    } catch (err) {
      console.error(`Error loading plugin ${id}:`, err);
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

    // Try to load immediately
    loadPlugin();

    // Listen for changes to the plugin
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = onPluginsChange<T>(pluginType, (plugins) => {
        if (plugins && plugins[id]) {
          const updatedPlugin = plugins[id];

          // If the plugin exists but needs loading, load it
          if (isLoadablePlugin(updatedPlugin)) {
            loadPlugin();
          } else {
            // It's already fully loaded
            setPlugin(updatedPlugin);
          }
        }
      });
    } catch (err) {
      console.warn(`Error subscribing to plugin changes:`, err);
    }

    return function cleanupLoadedPluginListener() {
      try {
        if (unsubscribe && typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch (err) {
        console.warn(
          `Error during cleanup for loaded plugin ${id}:`,
          err
        );
      }
    };
  }, [pluginType, id, loadPlugin]);

  return { plugin, isLoading, error };
}

/**
 * Hook to get and load all plugins of a specific type that match a filter.
 * If an plugin is loadable but not yet loaded, it will load it automatically.
 */
export function useLoadedFilteredPlugins<
  T extends Plugin<any, any>
>(
  pluginType: string,
  filterFn: (plugin: T) => boolean,
  wait: boolean = false
): {
  plugins: T[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const allPlugins = usePlugins<T>(pluginType);
  const [loadedPlugins, setLoadedPlugins] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    const loadPlugins = async () => {
      if (!allPlugins || Object.keys(allPlugins).length === 0) {
        setLoadedPlugins([]);
        return;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        const plugins = Object.values(allPlugins);
        const results: T[] = [];

        // Load each plugin in parallel
        await Promise.all(
          plugins.map(async (plugin) => {
            try {
              // If it's a loadable plugin, load it
              let loadedPlugin: T | undefined = plugin;
              if (isLoadablePlugin(plugin)) {
                const loaded = await loadPluginFromRegistry<T>(
                  pluginType,
                  (plugin as any).id,
                  wait
                );
                loadedPlugin = loaded as T;
              }

              // If it matches the filter, include it
              if (loadedPlugin && filterFn(loadedPlugin)) {
                results.push(loadedPlugin);
              }
            } catch (err) {
              console.warn(
                `Error loading plugin ${(plugin as any).id}:`,
                err
              );
              // Continue with other plugins
            }
          })
        );

        setLoadedPlugins(results);
      } catch (err) {
        console.error(`Error loading plugins:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadPlugins();
  }, [pluginType, allPlugins, filterFn, wait]);

  return { plugins: loadedPlugins, isLoading, error };
}

/**
 * Hook to get all plugins that are loaded
 */
export function useLoadedPlugins<T extends Plugin>(
  pluginType: string,
  filter?: (plugin: PluginDescription) => boolean,
  shouldWait = true
): {
  plugins: Record<string, T>;
  isLoading: boolean;
  error: Error | undefined;
} {
  const allPlugins = usePlugins<T>(pluginType);
  const [loadedPlugins, setLoadedPlugins] = useState<Record<string, T>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (!Object.keys(allPlugins).length) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(undefined);

    loadAllPluginsFromRegistry<T>(pluginType, filter, shouldWait)
      .then((loaded) => {
        if (isMounted) {
          setLoadedPlugins(loaded);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(`Error loading ${pluginType} plugins:`, err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pluginType, allPlugins, filter, shouldWait]);

  return { plugins: loadedPlugins, isLoading, error };
}
