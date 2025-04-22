import { AutomergeUrl, Doc, DocHandle, Repo } from "@automerge/automerge-repo";
import { DataType, createDocOfDataType } from "../datatypes";
import { getDefaultImportMethodForDatatype } from "../importMethods";
import { ImportMethod } from "../importMethods";
import { DocLink } from "../router/DocLink";
import { getPlugins, loadPlugin } from "../plugins";

/**
 * Helper function to find the appropriate import method and datatype for a file
 */
const getImportMethodForFile = async (
  file: File
): Promise<{ importMethod: ImportMethod; dataType: DataType }> => {
  const extension = file.name.split(".").pop();

  if (!extension) {
    throw new Error("File has no extension, not sure how to proceed");
  }

  const dataTypes = Object.values(getPlugins<DataType>("patchwork:dataType"));
  const importMethod = dataTypes
    .map((dt) => getDefaultImportMethodForDatatype(dt))
    .find(
      (method) =>
        method?.fileExtensions.includes(extension) ||
        method?.fileExtensions.includes("*")
    );

  if (!importMethod) {
    throw new Error("No import method found for this file.");
  }

  const dataType = await loadPlugin<DataType>(
    "patchwork:dataType",
    importMethod.datatypeId
  );
  if (!dataType) {
    throw new Error(
      `Could not find data type for import method (datatypeId: ${importMethod.datatypeId})`
    );
  }

  return { importMethod, dataType };
};

/**
 * Creates a new document from a file, initializing it with the appropriate datatype
 */
export const createDocFromFile = async (
  file: File,
  repo: Repo
): Promise<DocHandle<unknown>> => {
  const { importMethod, dataType } = await getImportMethodForFile(file);
  const handle = createDocOfDataType(dataType, repo);
  await importMethod.module.importData(file, handle);
  return handle;
};

/**
 * Updates an existing document from a file
 */
export const updateDocFromFile = async (
  file: File,
  handle: DocHandle<unknown>
): Promise<{ didChange: boolean }> => {
  const { importMethod } = await getImportMethodForFile(file);
  return importMethod.module.importData(file, handle);
};
