import { AutomergeUrl } from "@automerge/automerge-repo";

export type FolderDocMaterialized = Omit<FolderDoc, "docs"> & {
   docs: (DocLink & {
      folderContents?: FolderDocMaterialized;
   })[];
};

export type FolderDoc = {
   title: string;
   docs: DocLink[];
   versionControlMetadataUrl?: string;
};

export type DocLink = {
   name: string;
   type: string;
   url: AutomergeUrl;
};

export type DocPath = DocLink[];
