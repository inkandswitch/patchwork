import { getFolderDocWithChildrenOnBranch } from "@/packages/folder/hooks/useFolderDocWithChildren";
import { getOmOnBranch } from "@/versionControl/signals";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { getProjectState, ProjectState } from "./getStalenessInfo";
import { JacquardProjectInfo } from "./hooks";

export const getProjectStateFromProjectInfo = (
  { projectFolderOm, branchUrl, buildMetadataOm }: JacquardProjectInfo,
  repo: Repo
) => {
  const projectFolderWithMetadata = getFolderDocWithChildrenOnBranch(
    projectFolderOm.url,
    branchUrl,
    repo
  );

  return getProjectState({
    folderDoc: projectFolderWithMetadata,
    buildRuns: buildMetadataOm.doc.buildRuns,
    filesReferencedInBuildsOnly: true,
    getDocOnBranchFromUrl(url: AutomergeUrl) {
      return getOmOnBranch(url, branchUrl, repo).doc;
    },
  });
};

export const getBuildRunsWithDocAsPrimaryInput = (
  projectState: ProjectState,
  docUrl: AutomergeUrl
) => {
  return (
    projectState?.buildRuns.filter(
      // right now we only count the first input which for python and latex is the main source file
      // this is a hacky way to determine the primary input
      // the reason to do this is that it feels weird for an image that's embedded in the latex doc
      // the pdf as an build output of the image
      ({ inputs }) => inputs[0] && inputs[0].docUrl == docUrl
      //inputs.some((input) => input.docUrl === docUrl)
    ) ?? []
  );
};
