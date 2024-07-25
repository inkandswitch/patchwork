import { getDoc } from "@/doc-reactive";
import * as Automerge from "@automerge/automerge"
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { BuildRun, JacquardBuildMetadata } from "./datatype";

export type BuildChangeMetadata = {
  buildDocUrl: AutomergeUrl
  buildId: string
}

export const getLastBuildChangeMetadata = (url: AutomergeUrl, repo: Repo, heads?: Automerge.Heads) : BuildChangeMetadata | undefined  => {
  const doc = getDoc(url, repo, heads)

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
    return
  }

  return getBuildChangeMetadata(lastChangeDecoded)
}


export const getLastBuildRun = (url: AutomergeUrl, repo: Repo, heads?: Automerge.Heads) : BuildRun | undefined => {
  const buildChangeMetadata = getLastBuildChangeMetadata(url, repo, heads)
  if (!buildChangeMetadata) {
    return
  }

  const buildDoc = getDoc<JacquardBuildMetadata>(buildChangeMetadata.buildDocUrl, repo)
  return buildDoc.buildRuns.find(({ id }) => buildChangeMetadata.buildId === id);
}



const getBuildChangeMetadata = (decodedChange: Automerge.DecodedChange) : BuildChangeMetadata | undefined  => {
  if (!decodedChange.message) {
    return
  }
  try {
    const metadata = JSON.parse(decodedChange.message)

    if (metadata.buildDocUrl && metadata.buildId) {
      return metadata as BuildChangeMetadata
    }
  } catch (err) {
    return undefined
  }

}