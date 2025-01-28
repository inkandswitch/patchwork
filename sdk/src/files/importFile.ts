import { Doc, DocHandle, Repo } from "@automerge/automerge-repo";
import {
  allDataTypes,
  dataTypeById,
  DataType,
  createDocOfDataType,
} from "../datatypes";
import { getDefaultImportMethodForDatatype } from "../importMethods";
import { ImportMethod } from "../importMethods";
import { HasPatchworkMetadata } from "../modules/types";

/**
 * Helper function to find the appropriate import method and datatype for a file
 */
const getImportMethodForFile = (
  file: File
): { importMethod: ImportMethod; dataType: DataType } => {
  const extension = file.name.split(".").pop();

  if (!extension) {
    throw new Error("File has no extension, not sure how to proceed");
  }

  const importMethod = Object.values(allDataTypes())
    .map((dt) => getDefaultImportMethodForDatatype(dt))
    .find(
      (method) =>
        method?.fileExtensions.includes(extension) ||
        method?.fileExtensions.includes("*")
    );

  if (!importMethod) {
    throw new Error("No import method found for this file.");
  }

  const dataType = dataTypeById(importMethod.datatypeId);
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
  const { importMethod, dataType } = getImportMethodForFile(file);
  const handle = createDocOfDataType(dataType, repo);
  await importMethod.importData(file, handle);
  return handle;
};

/**
 * Updates an existing document from a file
 */
export const updateDocFromFile = async (
  file: File,
  handle: DocHandle<unknown>
): Promise<{ didChange: boolean }> => {
  const { importMethod } = getImportMethodForFile(file);
  return importMethod.importData(file, handle);
};
