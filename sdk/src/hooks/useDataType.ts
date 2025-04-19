import { useState, useEffect } from "react";
import { DataType, DataTypeDescription } from "../datatypes";
import {
  usePlugin,
  useLoadedPlugin,
  usePlugins,
  useFilteredPlugins,
  useLoadedFilteredPlugins,
} from "./usePlugin";
import { getPluginFromRegistry, onPluginsChange } from "../plugins";

/**
 * Hook to get a specific data type by ID
 */
export function useDataType<D = unknown, T = unknown, V = unknown>(
  id: string | undefined
): DataType<D, T, V> | undefined {
  return usePlugin<DataType<D, T, V>>("dataTypes", id);
}

/**
 * Hook to get and load a data type by ID
 */
export function useLoadedDataType<D = unknown, T = unknown, V = unknown>(
  id: string | undefined,
  wait: boolean = false
): {
  dataType: DataType<D, T, V> | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const result = useLoadedPlugin<DataType<D, T, V>>("dataTypes", id, wait);

  return {
    dataType: result.plugin,
    isLoading: result.isLoading,
    error: result.error,
  };
}

/**
 * Hook to get all registered data types
 */
export function useDataTypes(): Record<string, DataType> {
  return usePlugins<DataType>("dataTypes");
}

/**
 * Hook to get filtered data types
 */
export function useFilteredDataTypes<D = unknown, T = unknown, V = unknown>(
  filterFn: (dataType: DataType<D, T, V>) => boolean
): DataType<D, T, V>[] {
  return useFilteredPlugins<DataType<D, T, V>>("dataTypes", filterFn);
}

/**
 * Hook to get and load all data types that match a filter
 */
export function useLoadedFilteredDataTypes<
  D = unknown,
  T = unknown,
  V = unknown
>(
  filterFn: (dataType: DataType<D, T, V>) => boolean,
  wait: boolean = false
): {
  dataTypes: DataType<D, T, V>[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const result = useLoadedFilteredPlugins<DataType<D, T, V>>(
    "dataTypes",
    filterFn,
    wait
  );

  return {
    dataTypes: result.plugins,
    isLoading: result.isLoading,
    error: result.error,
  };
}
