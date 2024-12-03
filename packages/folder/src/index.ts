export {
  init,
  folderDatatype as dataType,
  DocPathUtils,
  type DocPath,
  type FolderDoc,
  type FolderDocMaterialized as FolderDocWithChildren,
  type DocLink,
} from "./datatype";
export { folderViewerWithEmbedsTool as tool } from "./tool";

export {
  fetchFolderDocWithMetadata,
  fetchFolderDocWithMetadataOnFixedBranch,
  type FolderDocWithMetadata,
} from "./hooks/fetchFolderDocWithMetadata";
