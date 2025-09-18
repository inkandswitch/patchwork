import { DataType } from ".";
import { type Doc, save } from "@automerge/automerge";
import { type Repo } from "@automerge/automerge-repo";
import { getMatchingPlugins, LoadedPlugin, registerPlugins } from "../plugins";

export type ExportMethodDescription = {
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
};

export type ExportMethodImplementation = {
  exportData: (doc: Doc<unknown>, repo: Repo) => Promise<File>;
};

export type ExportMethod = LoadedPlugin<
  ExportMethodDescription,
  ExportMethodImplementation
>;

export const getExportMethodsForDatatype = (
  datatype: DataType
): ExportMethod[] => {
  const { plugins } = getMatchingPlugins<ExportMethod>({
    pluginType: "patchwork:exportMethod",
    matchField: "datatypeId",
    matchValue: datatype.id,
    sortField: "useAsDefaultMethod",
  });
  return plugins;
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
  module: {
    async exportData(doc: Doc<unknown>, repo: Repo) {
      return new File([save(doc) as BlobPart], "document.automerge", {
        type: "application/octet-stream",
      });
    },
  },
};

export const jsonExport: ExportMethod = {
  id: "json-export",
  type: "patchwork:exportMethod",
  name: "JSON",
  datatypeId: "*",
  fileExtensions: ["json"],
  module: {
    async exportData(doc: Doc<unknown>, repo: Repo) {
      return new File([JSON.stringify(doc)], "document.json", {
        type: "application/json",
      });
    },
  },
};

// Register the generic methods
// TODO: maybe these should be somewhere else?
registerPlugins([automergeExport, jsonExport], "exportMethods.ts");
