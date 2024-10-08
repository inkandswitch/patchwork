import { UIStateDoc } from "@/explorer/uiState";
import { Om } from "@/om";
import { DocPath } from "@/packages/folder/datatype";
import {
  DataType,
  dataTypeById,
  DocCloneMap,
  ensureMetadataHandleIsBranchScope,
  getVersionControlMetadataHandle,
} from "@/sdk";
import { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import * as A from "@automerge/automerge/next";
import {
  BranchDoc,
  HasVersionControlMetadata,
  MergedBranchDoc,
  VersionControlSidecarDoc,
} from "./schema";
import { BranchScopeAndActiveBranchInfo } from "./signals";

type Hash = string;

export const createBranch = async <
  DocType extends HasVersionControlMetadata<unknown, unknown>
>({
  repo,
  branchScopeHandle,
  dataTypeId,
  dataTypes,
  createdBy,
  name,
}: {
  repo: Repo;
  branchScopeHandle: DocHandle<DocType>;
  dataTypeId: string;
  dataTypes: DataType[];
  createdBy: AutomergeUrl | undefined;
  name?: string;
}): Promise<AutomergeUrl> => {
  const versionControlMetadataHandle = ensureMetadataHandleIsBranchScope(
    getVersionControlMetadataHandle(branchScopeHandle, repo)
  );
  const versionControlMetadataDoc = await versionControlMetadataHandle.doc();

  if (!versionControlMetadataDoc) {
    throw new Error(
      `Version control metadata doc missing at ${versionControlMetadataHandle.url}`
    );
  }

  const clonesMap = {};
  await cloneDocWithLinks(
    repo,
    branchScopeHandle,
    dataTypeId,
    dataTypes,
    clonesMap
  );

  const branchHandle = repo.create<BranchDoc>({
    name:
      name ??
      `Branch #${(versionControlMetadataDoc.branches?.length ?? 0) + 1}`,
    createdAt: Date.now(),
    createdBy,
    clones: clonesMap,
    branchScopeUrl: branchScopeHandle.url,
    mergeMetadata: null,
  });

  versionControlMetadataHandle.change((doc) => {
    doc.branches.push(branchHandle.url);
  });

  return branchHandle.url;
};

export const cloneDocWithLinks = async (
  repo: Repo,
  handle: DocHandle<unknown>,
  dataTypeId: string,
  dataTypes: DataType[],
  docCloneMap: DocCloneMap
): Promise<void> => {
  console.log("cloning", handle.url);

  // skip, if doc has already been cloned
  if (docCloneMap[handle.url]) {
    return;
  }

  // clone self
  const doc = await handle.doc();
  if (!doc) {
    throw new Error(`Document missing at ${handle.url}`);
  }
  const cloneHandle = repo.clone(handle);
  docCloneMap[handle.url] = {
    url: cloneHandle.url,
    baseHeads: A.getHeads(doc),
  };

  // clone links
  const links = dataTypeById(dataTypes, dataTypeId)?.links;
  if (links) {
    const doc = await handle.doc();
    const links_ = links(doc);
    await Promise.all(
      links_.map(async (link) => {
        const handle = repo.find(link.url);
        await cloneDocWithLinks(
          repo,
          handle,
          link.type,
          dataTypes,
          docCloneMap
        );
      })
    );
  }
};

export const mergeBranch = async ({
  repo,
  branchHandle,
  mergedBy,
}: {
  repo: Repo;
  branchHandle: DocHandle<BranchDoc>;
  mergedBy: AutomergeUrl;
}) => {
  const mergeHeadsByDocUrl: Record<string, A.Heads> = {};

  const doc = await branchHandle.doc();

  if (!doc) {
    throw new Error(`can't load branch ${branchHandle.url}`);
  }

  await Promise.all(
    Object.entries(doc.clones).map(async ([originalDocUrl, { url }]) => {
      const originalHandle = repo.find(originalDocUrl as AutomergeUrl);
      const cloneHandle = repo.find(url);

      await originalHandle.whenReady();
      await cloneHandle.whenReady();

      mergeHeadsByDocUrl[originalDocUrl] = A.getHeads(cloneHandle.docSync()!); // todo: ts strict

      originalHandle.merge(cloneHandle);
    })
  );

  // todo: handle creation and deletion of documents
  branchHandle.change((branch) => {
    branch.mergeMetadata = {
      mergedAt: Date.now(),
      mergedBy,
      mergeHeadsByDocUrl,
    };
  });
};

// todo: adapt to multi doc branches
/*
export const suggestBranchName = async ({
  doc,
  branchDoc,
  branchUrl,
}: {
  doc: MarkdownDoc;
  branchDoc: MarkdownDoc;
  branchUrl: AutomergeUrl;
}): Promise<string> => {
  const branch = doc.branchMetadata.branches.find(
    (branch) => branch.url === branchUrl
  );

  const beforeDoc = A.view(doc, branch.branchHeads).content;
  const afterDoc = branchDoc.content;

  const prompt = `
Below are two versions of a JSON document, before and after some changes were made.
Provide three possible short descriptions (about 2 to 10 words) that describe the changes made.
Return just the three descriptions, separated by newlines, no other text.
Vary the lengths from very brief (3 words, quick overview) to slightly longer (8-10 words, more detailed).

BEFORE:

${JSON.stringify(beforeDoc)}

AFTER:

${JSON.stringify(afterDoc)}
`;

  const result = await getStringCompletion(prompt);

  return result;
}; */

/** Returns 2 lists of change hashes present in one branch but not the other
 *  Framed in terms of "branch" and "main" but works fine for any 2 branches
 *
 * @param decodedChangesForDoc - The changes for the document
 *   (we pass in the decoded changes because we've already done this work elsewhere
 *   and it's expensive to redo it if we pass in the document itself)
 * @param branchHeads - The heads of the branch
 * @param mainHeads - The heads of the main document
 * @param baseHeads - The heads of the point where this branch diverged from main.
 *                    This is technically only needed for performance reasons --
 *                    it lets us cutoff our search of the change DAG without going all the way to the root.
 */
export const getChangesFromMergedBranch = ({
  decodedChangesForDoc,
  branchHeads,
  mainHeads,
  baseHeads,
}: {
  decodedChangesForDoc: A.DecodedChange[];
  branchHeads: A.Heads;
  mainHeads: A.Heads;
  baseHeads: A.Heads;
}): Set<Hash> => {
  const changeMap = new Map(
    decodedChangesForDoc.map((change) => [change.hash, change])
  );

  const changesInMain = getHashesBetweenHeads({
    changeMap,
    // This is a bit subtle so it's worth explaining.
    // We can't let changes from the branch be included in the "changes in main"
    // So we start a search backwards from our "to heads" which is latest main;
    // our "from heads" which we abort at is: either the base heads, or the branch heads.
    fromHeads: [...baseHeads, ...branchHeads],
    toHeads: mainHeads,
  });
  const changesInBranch = getHashesBetweenHeads({
    changeMap,
    fromHeads: baseHeads,
    toHeads: branchHeads,
  });

  return new Set([...changesInBranch].filter((x) => !changesInMain.has(x)));
};

const getHashesBetweenHeads = ({
  changeMap,
  fromHeads,
  toHeads,
}: {
  changeMap: Map<Hash, A.DecodedChange>;
  fromHeads: A.Heads;
  toHeads: A.Heads;
}): Set<Hash> => {
  const hashes = new Set<Hash>();
  const workQueue = structuredClone(toHeads);

  let hash;
  while ((hash = workQueue.shift())) {
    const change = changeMap.get(hash);
    if (!change) {
      throw new Error("Change not found in changes");
    }
    // todo: is this right? any head in the from heads stops the traversal?
    // Most of the time the heads is a single-element array so it doesn't matter.
    if (fromHeads.includes(change.hash)) {
      break;
    }
    hashes.add(hash);
    workQueue.push(...change.deps);
  }

  return hashes;
};

export const setActiveBranchUrl = (
  uiStateOm: Om<UIStateDoc>,
  branchScopePath: DocPath,
  branchDocUrl: AutomergeUrl | null
) => {
  uiStateOm.handle.change((uiStateDoc) => {
    // handle old uiState docs
    if (!uiStateDoc.openBranches || Array.isArray(uiStateDoc.openBranches)) {
      uiStateDoc.openBranches = {};
    }

    if (branchDocUrl) {
      uiStateDoc.openBranches[DocPath.toString(branchScopePath)] = branchDocUrl;
    } else {
      delete uiStateDoc.openBranches[DocPath.toString(branchScopePath)];
    }
  });
};

type LegacyBranchMetadata = {
  branches: {
    url: AutomergeUrl;
    branchHeads: A.Heads;
    createdBy: AutomergeUrl;
    name: string;
    mergeMetadata?: MergedBranchDoc["mergeMetadata"];
  }[];
};

// A backwards compatibility shim to convert legacy branches to the current multi-doc branches.
// Previously, branch metadata was stored directly on the document itself.
// Now branch metadata is stored on a separate doc, and can support a "clone map" for multiple docs.
export const hasLegacyBranchesToMigrate = async ({
  docOm,
  branchScopeAndActiveBranchInfo,
  repo,
  dataTypeId,
  dataTypes,
}: {
  docOm: Om<any> | undefined;
  branchScopeAndActiveBranchInfo: BranchScopeAndActiveBranchInfo | undefined;
  repo: Repo;
  dataTypeId: string;
  dataTypes: DataType[];
}) => {
  if (!docOm || !branchScopeAndActiveBranchInfo) {
    return;
  }

  if (docOm.doc?.branchMetadata?.branches === undefined) {
    return;
  }

  // this is gross - we need to re-fetch the version control metadata doc
  // because this can get called multiple times with stale data.
  const latestBranchScopeVersionControlMetadata =
    branchScopeAndActiveBranchInfo.branchScopeVersionControlMetadataOm?.handle.docSync() as
      | A.Doc<VersionControlSidecarDoc & { isBranchScope: true }>
      | undefined;

  // We only migrate if the doc has legacy branches and there are no "current" branches.
  // This is conservative but should cover most cases.
  const hasLegacyBranches =
    (docOm.doc.branchMetadata as LegacyBranchMetadata).branches.length > 0;
  const hasCurrentBranches =
    latestBranchScopeVersionControlMetadata?.branches.length ?? 0 > 0;
  return hasLegacyBranches && !hasCurrentBranches;
};

export const migrateLegacyBranches = async ({
  docOm,
  branchScopeAndActiveBranchInfo,
  repo,
  dataTypeId,
  dataTypes,
}: {
  docOm: Om<any>;
  branchScopeAndActiveBranchInfo: BranchScopeAndActiveBranchInfo;
  repo: Repo;
  dataTypeId: string;
  dataTypes: DataType[];
}) => {
  for (const branch of (docOm.doc.branchMetadata as LegacyBranchMetadata)
    .branches) {
    // Create a new branch with the current structure
    const newBranchUrl = await createBranch({
      repo,
      branchScopeHandle: branchScopeAndActiveBranchInfo.branchScopeOm.handle,
      dataTypeId,
      dataTypes,
      createdBy: branch.createdBy,
      name: branch.name,
    });

    // Add a clone map entry to replicate the contents of the legacy branch
    const newBranchHandle = repo.find<BranchDoc>(newBranchUrl);
    newBranchHandle.change((d) => {
      d.clones[docOm.url] = {
        url: branch.url,
        baseHeads: branch.branchHeads,
      };
    });

    if (branch.mergeMetadata) {
      newBranchHandle.change((d) => {
        d.mergeMetadata = branch.mergeMetadata ?? null;
      });
    }
  }
};
