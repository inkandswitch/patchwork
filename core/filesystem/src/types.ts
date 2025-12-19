import type { AutomergeUrl, ImmutableString } from "@automerge/automerge-repo";

// needed in serviceworker only right now?
// but implied in plugins(?)
export type FolderDoc = {
  title: string;
  docs: DocLink[];
  lastSyncAt?: number; // pushwork sets lastSyncAt when it wants to trigger HMR
};

// used in serviceworker & datatype
export type DocLink = {
  name: string;
  type: string;
  url: AutomergeUrl;
  icon?: string;
  copyOf?: AutomergeUrl;
};

export type DocPath = DocLink[];

export type UnixFileEntry = {
  content: string | Uint8Array | ImmutableString;
  extension: string;
  mimeType: string;
  name: string;
};
