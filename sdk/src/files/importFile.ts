import { AutomergeUrl, Doc, DocHandle, Repo } from "@automerge/automerge-repo";
import { DataType, createDocOfDataType } from "../datatypes";
import { getDefaultImportMethodForDatatype } from "../importMethods";
import { ImportMethod } from "../importMethods";
import { DocLink } from "../router/DocLink";
import { getPluginsFromRegistry, loadPluginFromRegistry } from "../plugins";

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

  const dataTypes = Object.values(
    getPluginsFromRegistry<DataType>("patchwork:dataType")
  );
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

  const dataType = await loadPluginFromRegistry<DataType>(
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
  const { importMethod } = await getImportMethodForFile(file);
  return importMethod.importData(file, handle);
};

/**
 * Import a file using the given import method
 */
export const importFile = async (
  file: File,
  importMethod: ImportMethod,
  url: AutomergeUrl,
  changeDocLink?: (docLink: DocLink) => DocLink
): Promise<DocLink | null> => {
  // Check file ext matches import method
  const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (
    !importMethod.fileExtensions.some(
      (ext: string) => ext.toLowerCase() === `.${fileExt}`
    )
  ) {
    return null;
  }

  const text = await file.text();

  try {
    // Import file and create a document
    const importerFunc = importMethod.importer;

    // Get either dataType implementation or a wildcard importer function
    let importer: (text: string, fileName: string) => Promise<object>;
    if (importMethod.datatypeId !== "*") {
      const dataType = await loadPluginFromRegistry<DataType>(
        "dataType",
        importMethod.datatypeId
      );
      if (!dataType) {
        console.warn(`Could not find data type for ${importMethod.datatypeId}`);
        return null;
      }
      importer = importerFunc(dataType);
    } else {
      importer = importerFunc();
    }

    // Import the file and create a document
    const doc = await importer(text, file.name);
    const type = importMethod.datatypeId;

    // Create a new document link
    const docLink = { url, type, name: file.name };

    // Apply changeDocLink if provided
    if (changeDocLink) {
      changeDocLink(docLink);
    }

    return docLink;
  } catch (error) {
    console.error("Error importing file:", error);
    return null;
  }
};
