import { getDoc, getOm } from "@/doc-reactive";
import { Om } from "@/om";
import { DocPath, FolderDoc } from "@/packages/folder/datatype";
import { getBranchScopeInfo } from "@/versionControl/signals";
import * as Automerge from "@automerge/automerge";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { BuildRun, JacquardBuildMetadata } from "./datatype";

export type BuildChangeMetadata = {
  buildDocUrl: AutomergeUrl;
  buildId: string;
};

export const getLastBuildChangeMetadata = (
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): BuildChangeMetadata | undefined => {
  const doc = getDoc(url, repo, heads);

  const changes = Automerge.getAllChanges(
    heads ? Automerge.view(doc, heads) : doc
  );

  // todo: handle heads with size > 1
  // go back in history until we find a change that matches the current head
  let lastChangeDecoded: Automerge.DecodedChange | undefined;
  do {
    const lastChange = changes.pop();
    if (!lastChange) {
      break;
    }
    const decodedChange = Automerge.decodeChange(lastChange);
    if (!heads || heads[0] === decodedChange.hash) {
      lastChangeDecoded = decodedChange;
    }
  } while (heads && !lastChangeDecoded);

  if (!lastChangeDecoded) {
    return;
  }

  return getBuildChangeMetadata(lastChangeDecoded);
};

export const getLastBuildRun = (
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): BuildRun | undefined => {
  const buildChangeMetadata = getLastBuildChangeMetadata(url, repo, heads);
  if (!buildChangeMetadata) {
    return;
  }

  const buildDoc = getDoc<JacquardBuildMetadata>(
    buildChangeMetadata.buildDocUrl,
    repo
  );
  return buildDoc.buildRuns.find(
    ({ id }) => buildChangeMetadata.buildId === id
  );
};

const getBuildChangeMetadata = (
  decodedChange: Automerge.DecodedChange
): BuildChangeMetadata | undefined => {
  if (!decodedChange.message) {
    return;
  }
  try {
    const metadata = JSON.parse(decodedChange.message);

    if (metadata.buildDocUrl && metadata.buildId) {
      return metadata as BuildChangeMetadata;
    }
  } catch (err) {
    return undefined;
  }
};

export const getProjectBuildMetadataOm = (
  docPath: DocPath,
  repo: Repo
): Om<JacquardBuildMetadata> | undefined => {
  // todo: this only works once we have real doc paths
  /*
  const { branchScopePath } = getBranchScopeInfo(docPath, repo);
  const branchScopeDocLink = last(branchScopePath);

  if (!branchScopeDocLink || branchScopeDocLink.type !== "folder") {
    return;
  }
  */

  const { branchScopeOm } = getBranchScopeInfo(docPath, repo);

  const branchScopeFolderDoc = branchScopeOm.doc as FolderDoc;

  // abort if branchScope is not a folder
  if (!branchScopeFolderDoc.docs) {
    return;
  }

  const buildMetadataDocLink = branchScopeFolderDoc.docs.find(
    (docLink) => docLink.type === "jacquard-build-metadata"
  );

  if (!buildMetadataDocLink) {
    return;
  }

  return getOm<JacquardBuildMetadata>(buildMetadataDocLink.url, repo);
};
