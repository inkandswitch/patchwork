import { useMemo } from "react";
import { Tool } from "../tools";
import {
  usePlugin,
  useLoadedPlugin,
  usePlugins,
  useFilteredPlugins,
  useLoadedFilteredPlugins,
} from "./usePlugin";

/**
 * Hook to get a specific tool by ID
 */
export function useTool(id: string | undefined): Tool | undefined {
  return usePlugin<Tool>("tools", id);
}

/**
 * Hook to get and load a tool by ID
 */
export function useLoadedTool(
  id: string | undefined,
  wait: boolean = false
): {
  tool: Tool | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const result = useLoadedPlugin<Tool>("tools", id, wait);

  return {
    tool: result.plugin,
    isLoading: result.isLoading,
    error: result.error,
  };
}

/**
 * Hook to get all registered tools
 */
export function useTools(): Record<string, Tool> {
  return usePlugins<Tool>("tools");
}

/**
 * Hook to get tools for a specific data type
 */
export function useToolsForDataType(dataTypeId: string | undefined): Tool[] {
  // Create a stable filter function with useMemo
  const filterFn = useMemo(() => {
    return (tool: Tool | undefined) => {
      // Safety check for null/undefined tools
      if (!tool || !dataTypeId) return false;

      // Safety check for supportedDataTypes
      const supportedTypes = tool.supportedDataTypes;
      if (!supportedTypes) return false;

      if (supportedTypes === "*") return true;

      return (
        Array.isArray(supportedTypes) && supportedTypes.includes(dataTypeId)
      );
    };
  }, [dataTypeId]);

  // Use the filtered hook
  return useFilteredPlugins<Tool>("tools", filterFn);
}

/**
 * Hook to get and load tools for a specific data type
 */
export function useLoadedToolsForDataType(
  dataTypeId: string | undefined,
  wait: boolean = false
): {
  tools: Tool[];
  isLoading: boolean;
  error: Error | undefined;
} {
  // Create a stable filter function with useMemo
  const filterFn = useMemo(() => {
    return (tool: Tool) => {
      if (!dataTypeId) return false;

      const supportedTypes = tool.supportedDataTypes;
      if (!supportedTypes) return false;

      if (supportedTypes === "*") return true;

      return (
        Array.isArray(supportedTypes) && supportedTypes.includes(dataTypeId)
      );
    };
  }, [dataTypeId]);

  // If no dataType provided, return empty result immediately
  if (!dataTypeId) {
    return {
      tools: [],
      isLoading: false,
      error: undefined,
    };
  }

  const { elements, isLoading, error } = useLoadedFilteredPlugins<Tool>(
    "tools",
    filterFn,
    wait
  );

  return {
    tools: elements,
    isLoading,
    error,
  };
}
