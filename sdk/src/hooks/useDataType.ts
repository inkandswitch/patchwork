import { useCallback, useMemo, useState, useEffect } from "react";
import {
  DataType,
  DataTypeDescription,
  getDataTypeDescriptionById,
  loadDataTypeById,
} from "../datatypes";
import {
  useSystemElement,
  useLoadedSystemElement,
  useSystemElements,
  useFilteredSystemElements,
  useLoadedFilteredSystemElements,
} from "./useSystem";
import { onSystemElementsChange } from "../systems";

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

/**
 * Hook to get a data type description by ID
 * Only returns the description (metadata), not the implementation
 */
export function useDataTypeDescription<D = unknown, T = unknown, V = unknown>(
  id: string | undefined
): DataTypeDescription | undefined {
  const [description, setDescription] = useState<
    DataTypeDescription | undefined
  >(id ? getDataTypeDescriptionById(id) : undefined);

  useEffect(() => {
    if (!id) {
      setDescription(undefined);
      return;
    }

    // Set initial state
    setDescription(getDataTypeDescriptionById(id));

    // Listen for changes
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = onSystemElementsChange("dataTypes", () => {
        setDescription(getDataTypeDescriptionById(id));
      });
    } catch (err) {
      console.warn(`Error subscribing to data type description changes:`, err);
    }

    return function cleanupDataTypeDescriptionListener() {
      try {
        if (unsubscribe && typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch (err) {
        console.warn(
          `Error during cleanup for data type description ${id}:`,
          err
        );
      }
    };
  }, [id]);

  return description;
}
