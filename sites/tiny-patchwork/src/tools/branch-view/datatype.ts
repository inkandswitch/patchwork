import { DataTypeImplementation } from "@patchwork/plugins";
import { DocLink } from "@patchwork/filesystem";
import { AutomergeUrl } from "@automerge/automerge-repo";
import * as Automerge from "@automerge/automerge";

export type Branch = {
  name: string;
  forkedAt: Automerge.Heads;
  docUrl: AutomergeUrl;
};

export interface BranchViewDoc {
  currentDocument?: DocLink;
  selectedBranchDocUrl?: AutomergeUrl; // The currently checked out branch, or undefined for main
}

export const BranchViewDataType: DataTypeImplementation<BranchViewDoc> = {
  init: (doc: BranchViewDoc) => {
    doc.currentDocument = undefined;
    doc.selectedBranchDocUrl = undefined;
  },
  async getTitle(doc: BranchViewDoc) {
    return "Branch View";
  },
  markCopy: (doc: BranchViewDoc) => {
    doc.currentDocument = doc.currentDocument;
    doc.selectedBranchDocUrl = doc.selectedBranchDocUrl;
  },
};
