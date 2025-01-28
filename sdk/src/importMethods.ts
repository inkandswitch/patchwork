import EventEmitter from "eventemitter3";
import { DocHandle } from "@automerge/automerge-repo";
import { DataType, allDataTypes } from "./datatypes";

export type ImportMethod = {
  id: string;
  type: "patchwork:importMethod";
  name: string;
  datatypeId: string;
  fileExtensions: string[];
  /**
   * If true, this method will be used as the default import method for its datatype.
   * If multiple methods have this set to true, one will be chosen arbitrarily.
   */
  useAsDefaultMethod?: boolean;
  importData: (
    file: File,
    handle: DocHandle<unknown>
  ) => Promise<{ didChange: boolean }>;
};

type ImportMethodsMap = Record<string, ImportMethod>;
type ImportMethodEvents = {
  "importMethods:changed": (methods: ImportMethodsMap) => void;
};

export const importMethodEvents = new EventEmitter<ImportMethodEvents>();
const GlobalImportMethods: ImportMethodsMap = {};

export const registerImportMethod = (method: ImportMethod) => {
  GlobalImportMethods[method.id] = method;
  importMethodEvents.emit("importMethods:changed", { ...GlobalImportMethods });
};

export const allImportMethods = () => {
  return { ...GlobalImportMethods };
};

export const isImportMethod = (value: unknown): value is ImportMethod => {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    value.type === "patchwork:importMethod"
  );
};

export const getImportMethodsForDatatype = (
  datatype: DataType
): ImportMethod[] => {
  const methods = Object.values(GlobalImportMethods)
    .filter(
      (method) => method.datatypeId === datatype.id || method.datatypeId === "*"
    )
    .sort((a, b) => {
      // First sort by datatype-specific vs generic
      if (a.datatypeId === datatype.id && b.datatypeId === "*") return -1;
      if (a.datatypeId === "*" && b.datatypeId === datatype.id) return 1;

      // Then sort by default status
      if (a.useAsDefaultMethod && !b.useAsDefaultMethod) return -1;
      if (!a.useAsDefaultMethod && b.useAsDefaultMethod) return 1;

      return 0;
    });

  return methods;
};

export const getDefaultImportMethodForDatatype = (
  datatype: DataType
): ImportMethod | undefined => {
  const methods = getImportMethodsForDatatype(datatype);
  return methods[0];
};
