import { useEffect, useState } from "react";
import { DataType, DataTypesMap } from "../datatypes";
import { useSystemElement, useSystemElements } from "./useSystem";

/**
 * Hook to get all registered data types
 */
export function useDataTypes(): DataTypesMap {
  return useSystemElements<DataType>("dataTypes") as DataTypesMap;
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
