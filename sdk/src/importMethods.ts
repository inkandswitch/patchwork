import EventEmitter from "eventemitter3";
import { DocHandle } from "@automerge/automerge-repo";
import { DataType, DataTypeDescription, allDataTypes } from "./datatypes";
import {
  Plugin,
  getPluginRegistry,
  getPluginFromRegistry,
  loadPluginFromRegistry,
} from "./plugins";

export type ImportMethod = Plugin & {
  type: "patchwork:importMethod";
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

// For backward compatibility and transition
type ImportMethodsMap = Record<string, ImportMethod>;
type ImportMethodEvents = {
  "importMethods:changed": (methods: ImportMethodsMap) => void;
};

export const importMethodEvents = new EventEmitter<ImportMethodEvents>();

getPluginRegistry<ImportMethod>("importMethods").onChange((plugins) => {
  importMethodEvents.emit("importMethods:changed", plugins);
});

export const registerImportMethod = (method: ImportMethod) => {
  // Use the plugin registry to register the method
  const registry = getPluginRegistry<Plugin>("importMethods");
  registry.register(method);
};

export const allImportMethods = () => {
  return getPluginRegistry<ImportMethod>("importMethods").getAll();
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
  datatype: DataTypeDescription
): ImportMethod[] => {
  const registry = getPluginRegistry<ImportMethod>("importMethods");
  const methods = registry
    .getAllPlugins()
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
  datatype: DataTypeDescription
): ImportMethod | undefined => {
  const methods = getImportMethodsForDatatype(datatype);
  return methods[0];
};
