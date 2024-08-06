import {
  ifLoaded,
  DocReactiveState,
  useDocReactive,
  LoadingError,
  getDoc,
  getOm,
} from "@/doc-reactive";
import { Om } from "@/om";
import { DocPath } from "@/packages/folder/datatype";
import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useMemo, useCallback } from "react";
import { useCurrentAccount, AccountDoc } from "./account";

export type UIStateDoc = {
  /** Folders that are toggled open in the user's sidebar.
   *  (If the object is here it counts as open; otherwise we default to closed)
   */
  openedFoldersInSidebar: { url: AutomergeUrl; folderPath: AutomergeUrl[] }[];

  /** Documents in the folder hierarchy that have a branch checked out.
   *  Map from branch scope path string (made via docPathString) to branch URL.
   */
  openBranches: { [docPathString: string]: AutomergeUrl };

  /** Document-specific UI states */
  docUIStates: { [docPathString: string]: DocUIState };
};

export type DocUIState = {
  mainViewMode: MainViewMode;
  sidebarMode?: SidebarMode;
  highlightChanges: boolean;
};

export type MainViewMode =
  | "showFile"
  | "showInputs"
  | "showOutputs"
  | "compareWithMain";

export type SidebarMode = "review" | "history" | "Bot";

export function docPathString(docPath: DocPath): string {
  return docPath.map((link) => link.url).join("/");
}
const DEFAULT_STATE: DocUIState = {
  mainViewMode: "showFile",
  highlightChanges: true,
};

export const useUIStateOm = (): DocReactiveState<Om<UIStateDoc>> => {
  const repo = useRepo();
  const account = useCurrentAccount();
  return useDocReactive(
    useCallback(() => {
      if (!account) {
        throw new LoadingError();
      }
      const accountDoc = getDoc<AccountDoc>(account.handle.url, repo);
      return getOm<UIStateDoc>(accountDoc.uiStateUrl, repo);
    }, [account, repo])
  );
};

export const useUIStateHandle = (): DocHandle<UIStateDoc> | undefined => {
  return ifLoaded(useUIStateOm())?.handle;
};

export const useDocumentUIState = (
  docPath: DocPath
): [DocUIState, (fn: (state: DocUIState) => void) => void] => {
  const key = docPathString(docPath);
  const uiStateOm = ifLoaded(useUIStateOm());

  // todo: don't update ui state if it was changed in another tab
  return useMemo(() => {
    const changeDocUIState = (fn: (docUIState: DocUIState) => void) => {
      if (!uiStateOm) {
        throw new Error("cannot change UI state if it's not loaded yet");
      }
      uiStateOm.handle.change((uiState) => {
        if (!uiState.docUIStates) {
          uiState.docUIStates = {};
        }

        if (!uiState.docUIStates[key]) {
          uiState.docUIStates[key] = DEFAULT_STATE;
        }

        fn(uiState.docUIStates[key]);
      });
    };

    const docUIState: DocUIState =
      uiStateOm?.doc?.docUIStates?.[key] ?? DEFAULT_STATE;

    return [docUIState, changeDocUIState];
  }, [key, uiStateOm]);
};
