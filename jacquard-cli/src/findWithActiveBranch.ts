import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { getJacquardConfig } from "./util";
import { asyncComputedPromise } from "@/async-signals";
import { resolveUrlOnBranch } from "@/versionControl/signals";

/**
 * Doc-reactive. Like repo.find, but considers the active branch.
 */
export const findWithActiveBranch = <T>(docUrl: AutomergeUrl, repo: Repo) => {
  const config = getJacquardConfig();
  const branchUrl = config?.activeBranchUrl;
  const { url } = resolveUrlOnBranch(docUrl, branchUrl, repo);
  return repo.find<T>(url);
};

export const findWithActiveBranchPromise = async <T>(
  docUrl: AutomergeUrl,
  repo: Repo
) => {
  return asyncComputedPromise(() => findWithActiveBranch<T>(docUrl, repo));
};
