import { fetchFolderDocWithMetadataOnFixedBranch } from "@patchwork/folder/hooks/fetchFolderDocWithMetadata";
import { fetchOmOnFixedBranch } from "@patchwork/sdk/versionControl";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { fetchProjectState, ProjectState } from "./getStalenessInfo";
import { JacquardProjectInfo } from "./hooks";

export const fetchProjectStateFromProjectInfo = (
  { projectFolderOm, branchUrl, buildMetadataOm }: JacquardProjectInfo,
  repo: Repo
) => {
  const projectFolderWithMetadata = fetchFolderDocWithMetadataOnFixedBranch(
    projectFolderOm.url,
    branchUrl,
    repo
  );

  return fetchProjectState({
    folderDoc: projectFolderWithMetadata,
    buildRuns: buildMetadataOm.doc.buildRuns,
    filesReferencedInBuildsOnly: true,
    fetchDocOnBranchFromUrl(url: AutomergeUrl) {
      return fetchOmOnFixedBranch(url, branchUrl, repo).doc;
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
