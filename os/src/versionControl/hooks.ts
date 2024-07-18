import { docPathString, UIStateDoc } from "@/explorer/account";
import { DocPath } from "@/packages/folder/datatype";
import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import _ from "lodash";
import { useCallback, useMemo } from "react";
import { Om, useOm, useOms } from "../om";
import {
  BranchDoc,
  HasVersionControlMetadata,
  VersionControlSidecarDoc,
} from "./schema";
import { useValue } from "signia-react";
import { branchScopeInfoSig } from "./signals";

// Given a doc path, you can ask for its "branch scope info". For convenience,
// if the path doesn't actually have a branch scope, we return values as though
// it were its own branch scope. (This represents what happens if you create a
// branch on a document without a branch scope – it becomes one.)

export type BranchScopeInfo = {
  branchScopeOm: Om<HasVersionControlMetadata>;
  branchScopeVersionControlMetadataOm: Om<VersionControlSidecarDoc>;
  branchScopePath: DocPath;
  branchOms: Om<BranchDoc>[];
  isRealBranchScope: boolean;
};

// Given a doc path representing current selected doc,
// resolve a branch scope and return relevant information about branches

export const useBranchScopeInfo = (docPath: DocPath): BranchScopeInfo => {
  const repo = useRepo();
  const branchScopeInfoSig_ = useMemo(() => branchScopeInfoSig(docPath, repo), [docPath, repo]);
  return useValue(branchScopeInfoSig_);
};

// export const useBranchScopeInfo = (docPath: DocPath): BranchScopeInfo => {
//   // we need the metadata docs of all parent folders which requires an async op to load
//   // to work with them in the useMemo hook below we fetch them with useDocuments
//   const docPathOms = useOms<HasVersionControlMetadata>(
//     docPath.map((link) => link.url)
//   );
//   const versionControlMetadataDocUrls = docPathOms.map(
//     (om) => om?.doc.versionControlMetadataUrl
//   );
//   const versionControlMetadataOms = useOms<VersionControlSidecarDoc>(
//     versionControlMetadataDocUrls
//   );

//   const { branchUrls, ...info } = useMemo(() => {
//     // otherwise go up the hierarchy and check if any of the parent folders are branch scopes
//     for (let i = docPath.length - 1; i >= 0; i--) {
//       const docPathOm = docPathOms[i];
//       const versionControlMetadataOm = versionControlMetadataOms[i];
//       if (
//         versionControlMetadataOm &&
//         versionControlMetadataOm.doc.isBranchScope
//       ) {
//         return {
//           branchScopeOm: docPathOm,
//           branchScopeVersionControlMetadataOm: versionControlMetadataOm,
//           branchScopePath: docPath.slice(0, i + 1),
//           isRealBranchScope: true,
//           branchUrls: versionControlMetadataOm.doc.branches,
//         };
//       }
//     }

//     // we didn't find a branch scope; let's pretend to be our own
//     return {
//       branchScopeOm: _.last(docPathOms),
//       branchScopeVersionControlMetadataOm: _.last(versionControlMetadataOms),
//       branchScopePath: docPath,
//       isRealBranchScope: false,
//       branchUrls: [],
//     };
//   }, [docPath, docPathOms, versionControlMetadataOms]);

//   const branchOms = useOms<BranchDoc>(branchUrls);

//   return { ...info, branchOms };
// };

export type BranchScopeAndActiveBranchInfo = BranchScopeInfo & {
  activeBranchOm: Om<BranchDoc>;
  setActiveBranchUrl: (branchDocUrl: AutomergeUrl | null) => void;
  cloneOrMainOm: Om;
};

export const useActiveBranchInfo = (
  branchScopePath: DocPath,
  uiStateHandle: DocHandle<UIStateDoc>
) => {
  const [uiStateDoc, changeUIStateDoc] = useDocument<UIStateDoc>(
    uiStateHandle?.url
  );

  const activeBranchUrl: AutomergeUrl | null = useMemo(() => {
    return uiStateDoc?.openBranches[docPathString(branchScopePath)] ?? null;
  }, [branchScopePath, uiStateDoc?.openBranches]);

  const activeBranchOm = useOm<BranchDoc>(activeBranchUrl);

  const setActiveBranchUrl = useCallback(
    (branchDocUrl: AutomergeUrl | null) => {
      changeUIStateDoc((uiStateDoc) => {
        // handle old uiState docs
        if (
          !uiStateDoc.openBranches ||
          Array.isArray(uiStateDoc.openBranches)
        ) {
          uiStateDoc.openBranches = {};
        }

        if (branchDocUrl) {
          uiStateDoc.openBranches[docPathString(branchScopePath)] =
            branchDocUrl;
        } else {
          delete uiStateDoc.openBranches[docPathString(branchScopePath)];
        }
      });
    },
    [branchScopePath, changeUIStateDoc]
  );

  return {
    activeBranchOm,
    setActiveBranchUrl,
  };
};

// This hook goes a bit further than useBranchScope. It asks for the UI state,
// and uses that to figure out what branch is active in the branch scope.
export const useBranchScopeAndActiveBranchInfo = (
  docPath: DocPath,
  uiStateHandle: DocHandle<UIStateDoc>
): BranchScopeAndActiveBranchInfo => {
  const branchScopeInfo = useBranchScopeInfo(docPath);
  const { branchScopePath } = branchScopeInfo;

  const { activeBranchOm, setActiveBranchUrl } = useActiveBranchInfo(
    branchScopePath,
    uiStateHandle
  );

  const cloneUrl = activeBranchOm?.doc?.clones?.[_.last(docPath).url]?.url;
  const cloneOm = useOm(cloneUrl);
  const mainOm = useOm(_.last(docPath).url);
  const cloneOrMainOm = cloneOm ?? mainOm;

  return {
    ...branchScopeInfo,
    activeBranchOm,
    setActiveBranchUrl,
    cloneOrMainOm,
  };
};
