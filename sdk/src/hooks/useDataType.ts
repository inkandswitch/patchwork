import { useCallback, useMemo } from "react";
import {
  DataType,
  DataTypeDescription,
  LoadableDataType,
  dataTypeById,
} from "../datatypes";
import {
  useSystemElement,
  useLoadedSystemElement,
  useSystemElements,
  useFilteredSystemElements,
  useLoadedFilteredSystemElements,
} from "./useSystem";

/**
 * Hook to get a specific data type by ID
 */
export function useDataType<D = unknown, T = unknown, V = unknown>(
  id: string | undefined
): DataType<D, T, V> | undefined {
  return useSystemElement<DataType<D, T, V>>("dataTypes", id);
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
  const result = useLoadedSystemElement<DataType<D, T, V>>(
    "dataTypes",
    id,
    wait
  );

  return {
    dataType: result.element,
    isLoading: result.isLoading,
    error: result.error,
  };
}

/**
 * Hook to get all registered data types
 */
export function useDataTypes(): Record<string, DataType> {
  return useSystemElements<DataType>("dataTypes");
}

/**
 * Hook to get filtered data types
 */
export function useFilteredDataTypes<D = unknown, T = unknown, V = unknown>(
  filterFn: (dataType: DataType<D, T, V>) => boolean
): DataType<D, T, V>[] {
  return useFilteredSystemElements<DataType<D, T, V>>("dataTypes", filterFn);
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
  const result = useLoadedFilteredSystemElements<DataType<D, T, V>>(
    "dataTypes",
    filterFn,
    wait
  );

  return {
    dataTypes: result.elements,
    isLoading: result.isLoading,
    error: result.error,
  };
}
