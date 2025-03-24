import { useEffect, useState, useMemo } from "react";
import {
  allTools,
  Tool,
  toolById,
  toolsEvents,
  toolsForDataType,
  ToolsMap,
} from "../tools";
import {
  useSystemElement,
  useSystemElements,
  useFilteredSystemElements,
} from "./useSystem";

/**
 * Hook to get a specific tool by ID
 */
export function useTool(id: string | undefined): Tool | undefined {
  return useSystemElement<Tool>("tools", id);
}

/**
 * Hook to get all registered tools
 */
export function useTools(): ToolsMap {
  return useSystemElements<Tool>("tools") as ToolsMap;
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
  return useFilteredSystemElements<Tool>("tools", filterFn);
}
