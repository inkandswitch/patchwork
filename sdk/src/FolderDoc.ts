/** Copied to break dependency cycle from @patchwork/folder
 * any changes made there will need to be made here and vice versa
 * long-term we should find a principled solution.
 */

import { AutomergeUrl } from "@automerge/automerge-repo";
import { HasVersionControlMetadata } from "./versionControl";
import { DocLink, DocPath } from "./router/DocLink";

export type FolderDocMaterialized = Omit<FolderDoc, "docs"> & {
  docs: (DocLink & {
    folderContents?: FolderDocMaterialized;
  })[];
};

export type FolderDoc = {
  title: string;
  docs: DocLink[];
} & HasVersionControlMetadata<unknown, unknown>;
