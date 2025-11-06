import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { type ChangeFn } from "@automerge/automerge";
import { DocHandle } from "@automerge/automerge-repo";
import { ContactDoc, TinyPatchworkLayoutDoc } from "./types";

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
