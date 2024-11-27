import { DataType, initFrom } from "@patchwork/sdk";
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

export type DocLink = {
  name: string;
  type: string;
  url: AutomergeUrl;
};

export type DocPath = DocLink[];

export const DocPath = {
  toString: (docPath: DocPath) => docPath.map((link) => link.url).join("/"),

  toLink: (path: DocPath) => path[path.length - 1],

  forRoot: (rootFolderUrl: AutomergeUrl): DocPath => [
    { name: "Root", type: "folder", url: rootFolderUrl },
  ],

  parent: (path: DocPath): DocPath => {
    if (path.length === 1) {
      throw new Error("Root folder has no parent");
    }
    return path.slice(0, -1);
  },

  folder: (path: DocPath): DocPath => {
    // NOTE: We assume that all containing links are folders.
    if (DocPath.toLink(path).type === "folder") {
      return path;
    } else {
      return DocPath.parent(path);
    }
  },

  equals: (a: DocPath, b: DocPath) => {
    // NOTE: We only compare URLs
    if (a.length !== b.length) {
      return false;
    }
    return a.every((link, i) => link.url === b[i].url);
  },
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

export const folderDatatype: DataType<FolderDoc, never, never> = {
  type: "patchwork:dataType",
  id: "folder",
  name: "Folder",
  icon: "Folder",
  init,
  getTitle,
  setTitle,
  markCopy,
  links,
};
