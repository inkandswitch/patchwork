import { useMemo } from "react";
import { ImportMethod } from "../importMethods";
import { DataType } from "../datatypes";
import {
  useSystemElement,
  useSystemElements,
  useFilteredSystemElements,
} from "./useSystem";

/**
 * Hook to get a specific import method by ID
 */
export function useImportMethod(
  id: string | undefined
): ImportMethod | undefined {
  return useSystemElement<ImportMethod>("importMethods", id);
}

/**
 * Hook to get all registered import methods
 */
export function useImportMethods(): Record<string, ImportMethod> {
  return useSystemElements<ImportMethod>("importMethods");
}

/**
 * Hook to get import methods for a specific data type
 * Returns them sorted by specificity and default status
 */
export function useImportMethodsForDataType(
  dataType: DataType | undefined
): ImportMethod[] {
  const dataTypeId = dataType?.id;

  // Create a stable filter function
  const filterFn = useMemo(() => {
    return (method: ImportMethod) => {
      if (!dataTypeId) return false;
      return method.datatypeId === dataTypeId || method.datatypeId === "*";
    };
  }, [dataTypeId]);

  // If no dataType provided, return empty array immediately
  if (!dataTypeId) return [];

  // Get the filtered elements
  const methods = useFilteredSystemElements<ImportMethod>(
    "importMethods",
    filterFn
  );

  // Sort them by specificity and default status
  return useMemo(() => {
    return [...methods].sort((a, b) => {
      // First sort by datatype-specific vs generic
      if (a.datatypeId === dataTypeId && b.datatypeId === "*") return -1;
      if (a.datatypeId === "*" && b.datatypeId === dataTypeId) return 1;

      // Then sort by default status
      if (a.useAsDefaultMethod && !b.useAsDefaultMethod) return -1;
      if (!a.useAsDefaultMethod && b.useAsDefaultMethod) return 1;

      return 0;
    });
  }, [methods, dataTypeId]);
}

/**
 * Hook to get the default import method for a data type
 */
export function useDefaultImportMethodForDataType(
  dataType: DataType | undefined
): ImportMethod | undefined {
  const methods = useImportMethodsForDataType(dataType);
  return methods[0];
}
