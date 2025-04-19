import { DataType } from "./datatypes";
import { Doc, save } from "@automerge/automerge";
import { Repo } from "@automerge/automerge-repo";
import { loadAllPluginsFromRegistry, registerExportedPlugins } from "./plugins";

export type ExportMethod = {
  id: string;
  name: string;
  type: "patchwork:exportMethod";
  datatypeId: string | "*"; // "*" means this method is available for all datatypes
  fileExtensions: string[];
  /**
   * If true, this method will be used as the default export method for its datatype.
   * If multiple methods have this set to true, one will be chosen arbitrarily.
   */
  useAsDefaultMethod?: boolean;
  exportData: (doc: Doc<unknown>, repo: Repo) => Promise<File>;
};

export const isExportMethod = (value: unknown): value is ExportMethod => {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    value.type === "patchwork:exportMethod"
  );
};

export const getExportMethodsForDatatype = (
  datatype: DataType
): ExportMethod[] => {
  const methods = Object.values(
    loadAllPluginsFromRegistry<ExportMethod>("exportMethods")
  )
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

export const getDefaultExportMethodForDatatype = (
  datatype: DataType
): ExportMethod | undefined => {
  const methods = getExportMethodsForDatatype(datatype);
  return methods[0];
};

// Generic export methods available for all datatypes
export const automergeExport: ExportMethod = {
  id: "automerge-export",
  type: "patchwork:exportMethod",
  name: "Automerge Binary",
  datatypeId: "*",
  fileExtensions: ["automerge"],
  async exportData(doc: Doc<unknown>, repo: Repo) {
    return new File([save(doc)], "document.automerge", {
      type: "application/octet-stream",
    });
  },
};

export const jsonExport: ExportMethod = {
  id: "json-export",
  type: "patchwork:exportMethod",
  name: "JSON",
  datatypeId: "*",
  fileExtensions: ["json"],
  async exportData(doc: Doc<unknown>, repo: Repo) {
    return new File([JSON.stringify(doc)], "document.json", {
      type: "application/json",
    });
  },
};

// Register the generic methods
// TODO: maybe these should be somewhere else?
registerExportedPlugins(
  {
    exportMethods: [automergeExport, jsonExport],
  },
  "exportMethods.ts"
);
