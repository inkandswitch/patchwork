import {
  DocReactiveState,
  getDoc,
  getOm,
  ifLoaded,
  LoadingError,
  useDocReactive,
} from "@/doc-reactive";
import { Om } from "@/om";
import { DocPath } from "@/packages/folder/datatype";
import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useCallback, useMemo } from "react";
import { Atom, atom } from "signia";
import { useValue } from "signia-react";
import { AccountDoc, useCurrentAccount } from "./account";

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
  toolUIStates: Record<string, unknown>;
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

export const useDocUIState = (
  docPath: DocPath
): [DocUIState, (fn: (state: DocUIState) => void) => void] => {
  // TODO(jah): I might prefer if this returned undefined until the doc loads.
  // Currently, client code can't tell. (But I guess the real answer is to not
  // use hooks like this anymore...)

  const key = docPathString(docPath);
  const uiStateOm = ifLoaded(useUIStateOm());
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
    () => [tabDocUIState ?? defaultDocUIState(), changeDocUIState],
    [changeDocUIState, tabDocUIState]
  );
};

// just to be safe from unintended mutation, generate a new object every time
export function defaultDocUIState(): DocUIState {
  return {
    mainViewMode: "showFile",
    highlightChanges: true,
    toolUIStates: {},
  };
}

export const useToolUIState = <T>(
  docPath: DocPath,
  toolId: string,
  init: () => T
): [T | undefined, (fn: (state: T) => void) => void] => {
  const [docUIState, changeDocUIState] = useDocUIState(docPath);

  const toolUIState = docUIState.toolUIStates?.[toolId] as T | undefined;
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
