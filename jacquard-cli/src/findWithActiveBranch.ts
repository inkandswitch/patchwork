import { getJacquardConfig } from ".";
import {
  AutomergeUrl,
  Repo,
  isValidAutomergeUrl,
} from "@automerge/automerge-repo";
import { BranchDoc, DocCloneMap } from "@/sdk";

/* Like repo.find, but considers the active branch */
export const findWithActiveBranch = async <T>(
  docUrl: AutomergeUrl,
  repo: Repo
) => {
  const config = getJacquardConfig();
  const branchUrl = config.activeBranchUrl;

  let cloneMap: DocCloneMap = {};
  if (branchUrl !== "main" && isValidAutomergeUrl(branchUrl)) {
    const branchDoc = await repo.find<BranchDoc>(branchUrl).doc();
    cloneMap = branchDoc.clones;
  }
  const url = cloneMap[docUrl]?.url ?? docUrl;
  return repo.find<T>(url);
};
