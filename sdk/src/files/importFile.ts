import { DocHandle, Repo } from "@automerge/automerge-repo";
import { dataTypeByFileExtension } from "../datatypes";

/*
 * This import function doesn't return until after the updateDoc function resolves
 * Hopefully this will give the service worker enough time to finish loading the document
 * before proceeding.
 */
export const importFile = async (
  file: File,
  repo: Repo
): Promise<DocHandle<unknown>> => {
  const extension = file.name.split(".").pop();
  if (!extension) {
    throw new Error("File has no extension, not sure how to proceed");
  }

  const dataType = dataTypeByFileExtension(extension);
  if (!dataType || !dataType.updateDocFromFile) {
    throw new Error("No data type reports ability to import this file.");
  }

  const handle = repo.create();
  handle.change((d) => dataType.init(d, repo));
  await dataType.updateDocFromFile(file, handle);

  return handle;
};
