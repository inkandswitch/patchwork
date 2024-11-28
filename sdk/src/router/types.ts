import { AutomergeUrl } from "@automerge/automerge-repo";

export type URLParams = {
  type: string;
  url: AutomergeUrl;
  branchUrl?: AutomergeUrl;
  branchName?: string;
  branchScopeUrl?: AutomergeUrl;
};
