import { AutomergeUrl } from "@automerge/automerge-repo";
import { HasVersionControlMetadata } from "../versionControl";
import { DocLink, DocPath } from "../router/DocLink";

export type FolderDocMaterialized = Omit<FolderDoc, "docs"> & {
  docs: (DocLink & {
    folderContents?: FolderDocMaterialized;
  })[];
};

export type FolderDoc = {
  title: string;
  docs: DocLink[];
} & HasVersionControlMetadata<unknown, unknown>;

export type FolderDocWithMetadata = {
  doc: FolderDocMaterialized;
  rootFolderUrl: AutomergeUrl;
  flatDocPaths: DocPath[];
};
