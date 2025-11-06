import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { type ChangeFn } from "@automerge/automerge";
import { DocHandle } from "@automerge/automerge-repo";
import { type AutomergeUrl } from "@automerge/automerge-repo";
import type { ContactDoc } from "./datatype";

export type TinyPatchworkLayoutDoc = {
  contactUrl: AutomergeUrl;
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;

  frameToolId: string;
  accountSidebarToolId: string;
  contextSidebarToolId: string;
  contextToolIds: string[];
  documentToolbarToolIds: string[];
};

/**
 * Get the current account document and a function to change it
 */
export function useCurrentAccount(): [
  TinyPatchworkLayoutDoc | undefined,
  (changeFn: ChangeFn<TinyPatchworkLayoutDoc>) => void,
  DocHandle<TinyPatchworkLayoutDoc> | undefined,
] {
  const accountDocHandle = window.accountDocHandle;
  const [accountDoc, changeAccountDoc] = useDocument<TinyPatchworkLayoutDoc>(
    accountDocHandle?.url
  );
  return [accountDoc, changeAccountDoc, accountDocHandle];
}

/**
 * Get the current user's contact document and a function to change it
 */
export function useSelf(): [
  ContactDoc | undefined,
  (changeFn: ChangeFn<ContactDoc>) => void,
] {
  const [currentAccount] = useCurrentAccount();
  const [contactDoc, changeContactDoc] = useDocument<ContactDoc>(
    currentAccount?.contactUrl
  );

  return [contactDoc, changeContactDoc];
}
