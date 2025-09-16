import {
  AutomergeUrl,
  DocHandle,
  Repo,
  isValidAutomergeUrl,
  parseAutomergeUrl,
} from "@automerge/automerge-repo";
import EventEmitter from "eventemitter3";

import type { FolderDoc } from "./files/folder-doc";
import { createDocFromFile } from "./files";
import { ModuleSettingsDoc } from "./modules";

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

function typeOnlyAssert(condition: boolean): asserts condition {}

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
        const accountHandle = await this.#repo.find<AccountDoc>(newAccountUrl);
        const accountDoc = accountHandle.doc();
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

    const accountHandle = await this.#repo.find<AccountDoc>(accountUrl);
    const accountDoc = accountHandle.doc();
    if (!accountDoc) {
      // TODO: JAH strict fix
      throw new Error(`Account not found: ${accountUrl}`);
    }
    const contactHandle = await this.#repo.find<ContactDoc>(
      accountDoc.contactUrl
    );

    this.#contactHandle = contactHandle;
    this.#handle = accountHandle;
    this.emit("change");
  }

  async signUp({ name, avatar }: ContactProps) {
    const avatarHandle = avatar
      ? await createDocFromFile(avatar, this.#repo)
      : null;

    this.contactHandle.change((contact: ContactDoc) => {
      typeOnlyAssert(contact.type === "registered");
      contact.type = "registered";
      contact.name = name;

      if (avatarHandle) {
        contact.avatarUrl = avatarHandle.url;
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
      const accountHandle = await repo.find<AccountDoc>(accountUrl);
      const accountDoc = accountHandle.doc();
      if (!accountDoc) {
        // TODO: JAH strict fix
        throw new Error(`Account not found: ${accountUrl}`);
      }
      const contactHandle = await repo.find<ContactDoc>(accountDoc.contactUrl);

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

  const versionControlMetadataDocHandle = repo.create<any>({
    changeGroupSummaries: {},
    isBranchScope: false,
  });

  const rootFolderHandle = repo.create<FolderDoc>({
    title: "root",
    docs: [],
    versionControlMetadataUrl: versionControlMetadataDocHandle.url,
  });
  const uiStateHandle = repo.create<any>({
    docPathsToggledOpenInSidebar: [],
    openBranches: {},
    docUIStates: {},
  });

  const moduleSettingsDocHandle = repo.create<ModuleSettingsDoc>({
    modules: [],
  });

  const accountHandle = repo.create<AccountDoc>({
    contactUrl: contactHandle.url,
    rootFolderUrl: rootFolderHandle.url,
    uiStateUrl: uiStateHandle.url,
    moduleSettingsUrl: moduleSettingsDocHandle.url,
  });

  return { accountHandle, contactHandle, rootFolderHandle };
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
