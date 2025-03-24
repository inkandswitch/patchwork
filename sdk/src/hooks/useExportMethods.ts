import { useMemo } from "react";
import { DataType } from "../datatypes";
import {
  useSystemElement,
  useSystemElements,
  useFilteredSystemElements,
} from "./useSystem";

// Interface for ExportMethod (from exportMethodSystem.ts)
interface ExportMethod {
  id: string;
  type: "patchwork:exportMethod";
  name: string;
  datatypeId: string | "*";
  fileExtensions: string[];
  useAsDefaultMethod?: boolean;
}

/**
 * Hook to get a specific export method by ID
 */
export function useExportMethod(
  id: string | undefined
): ExportMethod | undefined {
  return useSystemElement<ExportMethod>("exportMethods", id);
}

/**
 * Hook to get all registered export methods
 */
export function useExportMethods(): Record<string, ExportMethod> {
  return useSystemElements<ExportMethod>("exportMethods");
}

/**
 * Hook to get export methods for a specific data type
 * Returns them sorted by specificity and default status
 */
export function useExportMethodsForDataType(
  dataType: DataType | string | undefined
): ExportMethod[] {
  // Handle different types of input
  const dataTypeId = typeof dataType === "string" ? dataType : dataType?.id;

  // Create a stable filter function
  const filterFn = useMemo(() => {
    return (method: ExportMethod) => {
      if (!dataTypeId) return false;
      return method.datatypeId === dataTypeId || method.datatypeId === "*";
    };
  }, [dataTypeId]);

  // If no dataType provided, return empty array immediately
  if (!dataTypeId) return [];

  // Get the filtered elements
  const methods = useFilteredSystemElements<ExportMethod>(
    "exportMethods",
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
 * Hook to get the default export method for a data type
 */
export function useDefaultExportMethodForDataType(
  dataType: DataType | string | undefined
): ExportMethod | undefined {
  const methods = useExportMethodsForDataType(dataType);
  return methods[0];
}
