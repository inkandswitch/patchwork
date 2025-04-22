import { DocHandle } from "@automerge/automerge-repo";
import type { DataTypeDescription } from "./datatypes";
import { Plugin, PluginDescription, getPlugins } from "./plugins";

export type ImportMethodDescription = PluginDescription & {
  type: "patchwork:importMethod";
  datatypeId: string;
  fileExtensions: string[];
  /**
   * If true, this method will be used as the default import method for its datatype.
   * If multiple methods have this set to true, one will be chosen arbitrarily.
   */
  useAsDefaultMethod?: boolean;
};

export type ImportMethodImplementation = {
  importData: (
    file: File,
    handle: DocHandle<unknown>
  ) => Promise<{ didChange: boolean }>;
};

export type ImportMethod = Plugin<
  ImportMethodDescription,
  ImportMethodImplementation
>;

export const getImportMethodsForDatatype = (
  datatype: DataTypeDescription
): ImportMethod[] => {
  const methods = getPlugins<ImportMethod>("patchwork:importMethod")
    .filter(
      (method: ImportMethod) =>
        method.datatypeId === datatype.id || method.datatypeId === "*"
    )
    .sort((a: ImportMethod, b: ImportMethod) => {
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
