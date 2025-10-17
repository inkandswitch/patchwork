import { DataTypeImplementation } from "@patchwork/plugins";
import { DocLink } from "@patchwork/filesystem";
import { AutomergeUrl } from "@automerge/automerge-repo";
import * as Automerge from "@automerge/automerge";

export type Branch = {
  name: string;
  forkedAt: Automerge.Heads;
  docUrl: AutomergeUrl;
  merged?: boolean; // True if this branch has been merged
};

export interface BranchViewDoc {
  currentDocument?: { url: AutomergeUrl; toolId?: string }; // The document being viewed
  selectedBranchDocUrl?: AutomergeUrl; // The currently checked out branch, or undefined for main
}

export const BranchViewDataType: DataTypeImplementation<BranchViewDoc> = {
  init: (doc: BranchViewDoc) => {
    doc.currentDocument = undefined;
    doc.selectedBranchDocUrl = undefined;
  },
  getTitle(doc: BranchViewDoc) {
    return "Branch View";
  },
  markCopy: (doc: BranchViewDoc) => {
    doc.currentDocument = doc.currentDocument;
    doc.selectedBranchDocUrl = doc.selectedBranchDocUrl;
  },
};
