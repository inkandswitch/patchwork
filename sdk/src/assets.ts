import { AutomergeUrl } from "@automerge/automerge-repo";

export type FileEntry = {
  contentType: string;
  contents: string | Uint8Array;
};

// @Paul: I think long term we should get rid of this assets
// doc and instead leverage the file data type
//
// For example if you drag an image onto an essay it could create an image document
// and embed a link to that image. That way you can also easily copy and past
// embedded images between documents

export type HasAssets = {
  assetsDocUrl: AutomergeUrl;
};

export const withHasAssets = <D>(
  doc: D,
  assetsDocUrl: AutomergeUrl
): D & HasAssets => ({ ...doc, assetsDocUrl });

export type AssetsDoc = {
  files: { [filename: string]: FileEntry };
};
