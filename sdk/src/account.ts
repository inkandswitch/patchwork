import {
  AutomergeUrl,
  DocHandle,
  Repo,
  isValidAutomergeUrl,
  parseAutomergeUrl,
} from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { EventEmitter } from "eventemitter3";

import { useForceUpdate } from "@patchwork/sdk/hooks/useForceUpdate";
import { ChangeFn } from "@automerge/automerge/next";
import { useEffect, useState } from "react";
import { uploadFile } from "./fileUtils";

import { FolderDoc } from "@patchwork/folder";
import { useFolderDocWithMetadataOnActiveBranch } from "@patchwork/folder/hooks/fetchFolderDocWithMetadata";
import { typeOnlyAssert } from "@patchwork/sdk/utils";
import { UIStateDoc } from "./router/uiState";
import {
  VersionControlSidecarDoc,
  withHasChangeGroupSummaries,
  withHasVersionControlMetadata,
} from "@patchwork/sdk/versionControl";
import { AssetsDoc } from "@patchwork/sdk/assets";

export type ModuleSettingsDoc = {
  enabledDatatypeIds: { [id: string]: boolean };
};

export interface AccountDoc {
  contactUrl: AutomergeUrl;
  rootFolderUrl: AutomergeUrl;
  uiStateUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;
}

export interface AnonymousContactDoc {
  type: "anonymous";
}

export interface RegisteredContactDoc {
  type: "registered";
  name: string;
  avatarUrl?: AutomergeUrl;
}

export type ContactDoc = AnonymousContactDoc | RegisteredContactDoc;

interface AccountEvents {
  change: () => void;
}

interface ContactProps {
  name: string;
  avatar: File;
}

export class Account extends EventEmitter<AccountEvents> {
  #repo: Repo;
  #handle: DocHandle<AccountDoc>;
  #contactHandle: DocHandle<ContactDoc>;

  constructor(
    repo: Repo,
    handle: DocHandle<AccountDoc>,
    contactHandle: DocHandle<ContactDoc>
  ) {
    super();

    this.#repo = repo;
    this.#handle = handle;
    this.#contactHandle = contactHandle;

    // listen for changed accountUrl caused by other tabs
    window.addEventListener("storage", async (event) => {
      if (event.key === ACCOUNT_URL_STORAGE_KEY) {
        const newAccountUrl = event.newValue as AutomergeUrl;

        // try to see if account is already loaded
        const accountHandle = this.#repo.find<AccountDoc>(newAccountUrl);
        const accountDoc = await accountHandle.doc();
        if (accountDoc?.contactUrl) {
          this.logIn(newAccountUrl);
          return;
        }

        // ... otherwise wait until contactUrl of account is loaded
        accountHandle.on("change", ({ doc }) => {
          if (doc.contactUrl) {
            this.logIn(newAccountUrl);
          }
        });
      }
    });
  }

  async logIn(accountUrl: AutomergeUrl) {
    // override old accountUrl
    localStorage.setItem(ACCOUNT_URL_STORAGE_KEY, accountUrl);

    const accountHandle = this.#repo.find<AccountDoc>(accountUrl);
    const accountDoc = await accountHandle.doc();
    if (!accountDoc) {
      // TODO: JAH strict fix
      throw new Error(`Account not found: ${accountUrl}`);
    }
    const contactHandle = this.#repo.find<ContactDoc>(accountDoc.contactUrl);

    this.#contactHandle = contactHandle;
    this.#handle = accountHandle;
    this.emit("change");
  }

  async signUp({ name, avatar }: ContactProps) {
    let avatarUrl: AutomergeUrl;
    if (avatar) {
      avatarUrl = await uploadFile(this.#repo, avatar);
    }

    this.contactHandle.change((contact: ContactDoc) => {
      typeOnlyAssert(contact.type === "registered");

      contact.type = "registered";
      contact.name = name;

      if (avatarUrl) {
        contact.avatarUrl = avatarUrl;
      }
    });
  }

  async logOut() {
    const { accountHandle, contactHandle } = createAccount(this.#repo);

    localStorage.setItem(ACCOUNT_URL_STORAGE_KEY, accountHandle.url);

    this.#handle = accountHandle;
    this.#contactHandle = contactHandle;

    this.emit("change");
  }

  get handle() {
    return this.#handle;
  }

  get contactHandle() {
    return this.#contactHandle;
  }
}

const ACCOUNT_URL_STORAGE_KEY = "tinyEssayEditor:accountUrl";

let CURRENT_ACCOUNT: Promise<Account>;

export async function getAccount(repo: Repo) {
  if (!repo.storageSubsystem) {
    throw new Error("cannot create account without storage");
  }

  if (CURRENT_ACCOUNT) {
    const currentAccount = await CURRENT_ACCOUNT;
    if (currentAccount) {
      return currentAccount;
    }
  }

  const accountUrl = localStorage.getItem(
    ACCOUNT_URL_STORAGE_KEY
  ) as AutomergeUrl;

  // try to load existing account
  if (accountUrl) {
    CURRENT_ACCOUNT = (async () => {
      const accountHandle = repo.find<AccountDoc>(accountUrl);
      const accountDoc = await accountHandle.doc();
      if (!accountDoc) {
        // TODO: JAH strict fix
        throw new Error(`Account not found: ${accountUrl}`);
      }
      const contactHandle = repo.find<ContactDoc>(accountDoc.contactUrl);

      return new Account(repo, accountHandle, contactHandle);
    })();

    return CURRENT_ACCOUNT;
  }

  // ... otherwise create a new one
  const { accountHandle, contactHandle } = createAccount(repo);

  localStorage.setItem(ACCOUNT_URL_STORAGE_KEY, accountHandle.url);
  const newAccount = new Account(repo, accountHandle, contactHandle);
  CURRENT_ACCOUNT = Promise.resolve(newAccount);
  return newAccount;
}

const createAccount = (
  repo: Repo
): {
  accountHandle: DocHandle<AccountDoc>;
  contactHandle: DocHandle<ContactDoc>;
  rootFolderHandle: DocHandle<FolderDoc>;
} => {
  const contactHandle = repo.create<ContactDoc>({
    type: "anonymous",
  });

  const versionControlMetadataDocHandle = repo.create<VersionControlSidecarDoc>(
    withHasChangeGroupSummaries({
      isBranchScope: false,
    })
  );

  const assetsDocHandle = repo.create<AssetsDoc>({ files: {} });

  const rootFolderHandle = repo.create<FolderDoc>(
    withHasVersionControlMetadata(
      {
        title: "root",
        docs: [],
      },
      {
        versionControlMetadataUrl: versionControlMetadataDocHandle.url,
        assetsDocUrl: assetsDocHandle.url,
      }
    )
  );
  const uiStateHandle = repo.create<UIStateDoc>({
    docPathsToggledOpenInSidebar: [],
    openBranches: {},
    docUIStates: {},
  });

  const moduleSettingsDocHandle = repo.create<ModuleSettingsDoc>({
    enabledDatatypeIds: {},
  });

  const accountHandle = repo.create<AccountDoc>({
    contactUrl: contactHandle.url,
    rootFolderUrl: rootFolderHandle.url,
    uiStateUrl: uiStateHandle.url,
    moduleSettingsUrl: moduleSettingsDocHandle.url,
  });

  return { accountHandle, contactHandle, rootFolderHandle };
};

/**
 * Returns `undefined` if account information is pending; otherwise
 * there should always be an account.
 */
export function useCurrentAccount(): Account | undefined {
  const repo = useRepo();
  const [account, setAccount] = useState<Account | undefined>(undefined);

  // @ts-expect-error useful for debugging
  window.currentAccount = account;

  const forceUpdate = useForceUpdate();

  useEffect(() => {
    getAccount(repo).then(setAccount);
  }, [repo]);

  useEffect(() => {
    if (!account) {
      return;
    }

    account.on("change", forceUpdate);

    return () => {
      account.off("change", forceUpdate);
    };
  }, [account, forceUpdate]);

  // Add new fields to an old account doc that doesn't have one yet.
  // In the future, replace this with a more principled schema migration system.
  const doc = account?.handle.docSync();
  useEffect(() => {
    if (account && doc && doc.rootFolderUrl === undefined) {
      const rootFolderHandle = repo.create<FolderDoc>();
      rootFolderHandle.change((rootFolder) => {
        rootFolder.docs = [];
      });
      account.handle.change((account) => {
        account.rootFolderUrl = rootFolderHandle.url;
      });
    }

    if (account && doc && doc.uiStateUrl === undefined) {
      const uiStateHandle = repo.create<UIStateDoc>();
      uiStateHandle.change((uiState) => {
        uiState.docPathsToggledOpenInSidebar = [];
        uiState.openBranches = {};
      });
      account.handle.change((account) => {
        account.uiStateUrl = uiStateHandle.url;
      });
    }

    if (account && doc && doc.moduleSettingsUrl === undefined) {
      const moduleSettingsHandle = repo.create<ModuleSettingsDoc>();
      moduleSettingsHandle.change((settings) => {
        settings.enabledDatatypeIds = {};
      });
      account.handle.change((account) => {
        account.moduleSettingsUrl = moduleSettingsHandle.url;
      });
    }
  }, [account, doc, repo]);

  return account;
}

export function useCurrentAccountDoc(): [
  AccountDoc | undefined,
  (changeFn: ChangeFn<AccountDoc>) => void
] {
  const account = useCurrentAccount();
  const [accountDoc, changeAccountDoc] = useDocument<AccountDoc>(
    account?.handle.url
  );
  return [accountDoc, changeAccountDoc];
}

// TODO: is it ok to load this multiple times in the UI tree? Is that extra overhead?
export function useRootFolderDocWithMetadata() {
  const [accountDoc] = useCurrentAccountDoc();

  // debugging aid: put root folder handle on window
  const repo = useRepo();
  useEffect(() => {
    if (accountDoc) {
      (window as any).rootFolderHandle = repo.find<FolderDoc>(
        accountDoc.rootFolderUrl
      );
    }
  }, [repo, accountDoc]);

  return useFolderDocWithMetadataOnActiveBranch(accountDoc?.rootFolderUrl);
}

export function useSelf(): ContactDoc | undefined {
  const [accountDoc] = useCurrentAccountDoc();
  const [contactDoc] = useDocument<ContactDoc>(accountDoc?.contactUrl);

  return contactDoc;
}

export const useDatatypeSettings = (): ModuleSettingsDoc | undefined => {
  const [accountDoc] = useCurrentAccountDoc();
  const [datatypeSettingsDoc] = useDocument<ModuleSettingsDoc>(
    accountDoc?.moduleSettingsUrl
  );

  return datatypeSettingsDoc;
};

// Helpers to convert an automerge URL to/from an Account Token that the user can
// paste in to login on another device.
// The doc ID is the only part of the URL actually used by the system,
// the rest is just for humans to understand what this string is for.
export function automergeUrlToAccountToken(
  url: AutomergeUrl,
  name: string
): string {
  const { documentId } = parseAutomergeUrl(url);
  return `account:${encodeURIComponent(name)}/${documentId}`;
}

// returns undefined if the token can't be parsed as an automerge URL
export function accountTokenToAutomergeUrl(
  token: string
): AutomergeUrl | undefined {
  const match = token.match(/^account:([^/]+)\/(.+)$/);
  if (!match || !match[2]) {
    return undefined;
  }
  const documentId = match[2];
  const url = `automerge:${documentId}`;
  if (!isValidAutomergeUrl(url)) {
    return undefined;
  }
  return url;
}
