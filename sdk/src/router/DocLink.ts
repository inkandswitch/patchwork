/** DocLink
 * A doclink is a struct with a URL, name, and type.
 * A list of of DocLinks is called a DocPath, and represents the current traversal route in
 * the explorer sidebar. This should probably be a feature of the router.
 */

import { AutomergeUrl } from "@automerge/automerge-repo";

export type DocLink = {
  name: string;
  type: string;
  url: AutomergeUrl;
};

export type DocPath = DocLink[];

export const DocPathUtils = {
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
    if (DocPathUtils.toLink(path).type === "folder") {
      return path;
    } else {
      return DocPathUtils.parent(path);
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
