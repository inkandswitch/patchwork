import { type DataTypeImplementation, DocLink, initFrom } from "@patchwork/sdk";
import {
  HasVersionControlMetadata,
  initVersionControlMetadata,
} from "@patchwork/sdk/versionControl";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";

// SCHEMA

/**
 * A folder where the contents are either links to regular docs, or
 * links to folders, in which case we have access to the contents of
 * the folder (and so on, recursively).
 */
export type FolderDocMaterialized = Omit<FolderDoc, "docs"> & {
  docs: (DocLink & {
    folderContents?: FolderDocMaterialized;
  })[];
};

export type FolderDoc = {
  title: string;
  docs: DocLink[];
} & HasVersionControlMetadata<unknown, unknown>;

// FUNCTIONS

export const init = (doc: FolderDoc, repo: Repo) => {
  initVersionControlMetadata(doc, repo);
  initFrom(doc, {
    title: "Untitled Folder",
    docs: [],
  });
};

// When a copy of the document has been made,
// update the title so it's more clear which one is the copy vs original.
// TODO: generalize this to a HasTitle schema?
const markCopy = (doc: FolderDoc) => {
  doc.title = `Copy of ${doc.title}`;
};

const getTitle = async (doc: any) => {
  return doc.title;
};

const setTitle = (doc: FolderDoc, title: string) => {
  doc.title = title;
};

const links = (doc: FolderDoc) => {
  return doc.docs;
};

export const dataType: DataTypeImplementation<FolderDoc, never, never> = {
  init,
  getTitle,
  setTitle,
  markCopy,
  links,
};
