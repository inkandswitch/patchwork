import {
  fetchDoc,
  fetchOm,
  PendingException,
  useAsyncCall,
} from "@/async-signals";
import { Om } from "@/om";
import { DocPath } from "@/packages/folder/datatype";
import { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useCallback, useMemo } from "react";
import { Atom, atom } from "signia";
import { useValue } from "signia-react";
import { Account, AccountDoc, useCurrentAccount } from "./account";

export type UIStateDoc = {
  /**
   * Paths to documents that are toggled open in the sidebar.
   * (Each toggled-open path is a docpath from DocPath.toString)
   */
  docPathsToggledOpenInSidebar: string[];

  /** Documents in the folder hierarchy that have a branch checked out.
   *  Map from branch scope path string (made with DocPath.toString) to branch URL.
   */
  openBranches: { [docPathString: string]: AutomergeUrl };

  /** Document-specific UI states */
  docUIStates: { [docPathString: string]: DocUIState };
};

export type DocUIState = {
  mainViewMode: MainViewMode;
  sidebarMode?: SidebarMode;
  highlightChanges: boolean;
  collapseContentWithoutChanges: boolean;
  toolUIStates: Record<string, unknown>;
};

export type MainViewMode =
  | "showFile"
  | "showInputs"
  | "showOutputs"
  | "compareWithMain";

export type SidebarMode = "review" | "history" | "bot";

export const fetchUIStateOm = (repo: Repo, account: Account | undefined) => {
  if (!account) {
    throw new PendingException();
  }
  const accountDoc = fetchDoc<AccountDoc>(account.handle.url, repo);
  return fetchOm<UIStateDoc>(accountDoc.uiStateUrl, repo);
};

export const useUIStateOm = (): Om<UIStateDoc> | undefined => {
  const repo = useRepo();
  const account = useCurrentAccount();
  return useAsyncCall(fetchUIStateOm, repo, account).ifPending(undefined).value;
};

// Each tab maintains local versions of document UI state. These are initialized
// from Automerge & changes are synchronized between components using Signia.
// (Changes are also persisted back to Automerge, but they won't affect other
// pre-existing open tabs. Last writer wins.)

// TODO: Maybe this should be for all of the UI state, not just doc UI state?

/** Get the tab-local atom for the docUIState of a given document, identified
 * via a docPathString-generated key. The signal can be `undefined`,
 * representing a still-loading docUIState */
function getTabDocUIStateAtom(
  key: string,
  uiStateHandle?: DocHandle<UIStateDoc>
): Atom<DocUIState | undefined> {
  if (!uiStateHandle) {
    return ALWAYS_UNDEFINED;
  }

  if (!TAB_DOC_UI_STATE_SIGNALS[key]) {
    // This means we are the first one to access this docUIState. Set up the signal!!
    const signal = atom<DocUIState | undefined>("", undefined);
    TAB_DOC_UI_STATE_SIGNALS[key] = signal;

    // Initialize the signal from Automerge.
    uiStateHandle.doc().then((uiStateDoc) => {
      signal.set(uiStateDoc?.docUIStates?.[key] ?? defaultDocUIState());
    });
  }
  return TAB_DOC_UI_STATE_SIGNALS[key];
}

const ALWAYS_UNDEFINED = atom("", undefined);

const TAB_DOC_UI_STATE_SIGNALS: Record<
  string,
  Atom<DocUIState | undefined>
> = {};

export const useDocUIStateOrUndefined = (
  docPath: DocPath
): [DocUIState | undefined, (fn: (state: DocUIState) => void) => void] => {
  const key = DocPath.toString(docPath);
  const uiStateOm = useUIStateOm();
  const uiStateHandle = uiStateOm?.handle;
  const tabDocUIStateAtom = getTabDocUIStateAtom(key, uiStateHandle);
  const tabDocUIState = useValue(tabDocUIStateAtom);

  const changeDocUIState = useCallback(
    (fn: (docUIState: DocUIState) => void) => {
      if (!tabDocUIStateAtom.value || !uiStateHandle) {
        throw new Error(
          "internal error: no changing doc UI state before it's loaded"
        );
      }

      // Perform the change
      uiStateHandle.change((d) => {
        if (!d.docUIStates) {
          d.docUIStates = {};
        }

        if (!d.docUIStates[key]) {
          d.docUIStates[key] = defaultDocUIState();
        }

        fn(d.docUIStates[key]);
      });

      // Record the result in the local state
      const newUIStateDoc = uiStateHandle.docSync();
      if (!newUIStateDoc) {
        throw new Error(
          "internal error: doc should be loaded immediately after change"
        );
      }
      tabDocUIStateAtom.set(newUIStateDoc.docUIStates[key]);
    },
    [key, tabDocUIStateAtom, uiStateHandle]
  );

  return useMemo(
    () => [tabDocUIState, changeDocUIState],
    [tabDocUIState, changeDocUIState]
  );
};

export const useDocUIState = (
  docPath: DocPath
): [DocUIState, (fn: (state: DocUIState) => void) => void] => {
  const [tabDocUIState, changeTabDocUIState] =
    useDocUIStateOrUndefined(docPath);
  return useMemo(
    () => [tabDocUIState ?? defaultDocUIState(), changeTabDocUIState],
    [changeTabDocUIState, tabDocUIState]
  );
};

// just to be safe from unintended mutation, generate a new object every time
export function defaultDocUIState(): DocUIState {
  return {
    mainViewMode: "showFile",
    highlightChanges: true,
    collapseContentWithoutChanges: false,
    toolUIStates: {},
  };
}

export const useToolUIState = <T>(
  docPath: DocPath,
  toolId: string,
  init: () => T
): [T | undefined, (fn: (state: T) => void) => void] => {
  const [docUIState, changeDocUIState] = useDocUIStateOrUndefined(docPath);

  const toolUIState = docUIState
    ? // We're loaded – if the tool UI state hasn't been defined yet, use the default from init
      (docUIState.toolUIStates?.[toolId] as T | undefined) ?? init()
    : // We're still loading – return undefined
      undefined;
  const setToolUIState = (fn: (state: T) => void) => {
    changeDocUIState((docUIState) => {
      if (!docUIState.toolUIStates) {
        docUIState.toolUIStates = {};
      }
      if (!docUIState.toolUIStates[toolId]) {
        docUIState.toolUIStates[toolId] = init();
      }
      fn(docUIState.toolUIStates[toolId] as T);
    });
  };

  return [toolUIState, setToolUIState];
};
