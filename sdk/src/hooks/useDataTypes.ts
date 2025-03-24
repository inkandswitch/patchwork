import { useEffect, useState } from "react";
import {
  DataType,
  DataTypesMap,
  getDataTypeDescriptions,
  DataTypeDescription,
  loadAllDataTypes,
} from "../datatypes";
import { useSystemElement, useSystemElements } from "./useSystem";
import { getSystemRegistry } from "../systems";
import { loadElementFromSystem, isLoadableElement } from "../systems";

/**
 * Hook to get all registered data types (both loaded and unloaded)
 */
export function useDataTypes(): DataTypesMap {
  return useSystemElements<DataType>("dataTypes") as DataTypesMap;
}

/**
 * Hook to get all data type descriptions (metadata only, no implementations)
 */
export function useDataTypeDescriptions(): Record<string, DataTypeDescription> {
  const [descriptions, setDescriptions] = useState<
    Record<string, DataTypeDescription>
  >(getDataTypeDescriptions());

  useEffect(() => {
    // Initialize
    setDescriptions(getDataTypeDescriptions());

    // Subscribe to changes
    const registry = getSystemRegistry("dataTypes");
    const unsubscribe = registry.onChange((elements) => {
      setDescriptions(elements as Record<string, DataTypeDescription>);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return descriptions;
}

/**
 * Hook to get all data types and ensure they are loaded
 */
export function useLoadedDataTypes(skipUnlisted = false): {
  dataTypes: DataTypesMap;
  isLoading: boolean;
  error: Error | undefined;
} {
  const descriptions = useDataTypeDescriptions();
  const [loadedDataTypes, setLoadedDataTypes] = useState<DataTypesMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    const loadAllTypes = async () => {
      if (!Object.keys(descriptions).length) {
        return;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        const loaded = await loadAllDataTypes(skipUnlisted);
        setLoadedDataTypes(loaded as DataTypesMap);
      } catch (err) {
        console.error("Error loading data types:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadAllTypes();
  }, [descriptions, skipUnlisted]);

  return { dataTypes: loadedDataTypes, isLoading, error };
}

/**
 * Hook to get a data type by ID
 */
export function useDataType<D = unknown, T = unknown, V = unknown>(
  id: string | undefined
): DataType<D, T, V> | undefined {
  return useSystemElement<DataType<D, T, V>>("dataTypes", id);
}

/**
 * Hook to get non-unlisted data types
 */
export function useListedDataTypes(): DataTypesMap {
  const dataTypes = useDataTypes();
  const [listedTypes, setListedTypes] = useState<DataTypesMap>(() =>
    Object.fromEntries(
      Object.entries(dataTypes).filter(
        ([_, dataType]) => !(dataType as { unlisted?: boolean }).unlisted
      )
    )
  );

  // Update when datatypes change
  useEffect(() => {
    setListedTypes(
      Object.fromEntries(
        Object.entries(dataTypes).filter(
          ([_, dataType]) => !(dataType as { unlisted?: boolean }).unlisted
        )
      )
    );
  }, [dataTypes]);

  return listedTypes;
}
