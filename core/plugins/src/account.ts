import {
  isValidAutomergeUrl,
  type AutomergeUrl,
  type DocHandle,
  type Repo,
} from "@automerge/automerge-repo";
import type { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import type { AutomergeRepoKeyhive } from "@automerge/automerge-repo-keyhive";
import { getRegistry } from "./registry/index.js";
import type { DatatypeDescription } from "./datatypes.js";
import { createDocOfDatatype2 } from "./datatypes.js";

/**
 * Site-facing view of the frame's account document. Scalar tool-id fields are
 * populated by AccountDatatype.init on creation. Subdoc URLs are populated
 * lazily by the frame on first mount; code that reads them must tolerate
 * `undefined`.
 */
export type AccountDoc = {
  frameToolId: string;
  accountSidebarToolId: string;
  contextSidebarToolId: string;
  contextToolIds: string[];
  documentToolbarToolIds: string[];

  rootFolderUrl?: AutomergeUrl;
  moduleSettingsUrl?: AutomergeUrl;
  contactUrl?: AutomergeUrl;
};

/**
 * Find-or-create the account document for a site.
 *
 * The site is responsible for remembering *which* account doc to use (stashed
 * in localStorage under `storageKey`) but knows nothing about its shape. On a
 * fresh install the document is created via the `account` datatype, which
 * must be registered by the time this runs; typically that happens when the
 * `patchwork-frame` plugin bundle loads.
 *
 * Missing subdoc fields (rootFolderUrl, moduleSettingsUrl, contactUrl) are
 * intentionally left for the frame to lazily populate on mount.
 */
export async function resolveAccountHandle<D = AccountDoc>(
  repo: Repo,
  options: {
    storageKey: string;
    hive?: AutomergeRepoKeyhive;
    storage?: Pick<Storage, "getItem" | "setItem">;
  }
): Promise<DocHandle<D & HasPatchworkMetadata>> {
  const storage = options.storage ?? globalThis.localStorage;
  const stored = storage.getItem(options.storageKey);

  if (stored && isValidAutomergeUrl(stored)) {
    // A valid stored pointer is the user's real account doc. Never fall
    // through to creating a fresh account here: a transient find failure
    // (sync layer still booting, doc briefly unavailable) would overwrite the
    // pointer and silently orphan the user's whole workspace. Retry briefly,
    // then propagate so boot fails visibly with the pointer intact.
    let lastError: unknown;
    for (const delay of [0, 500, 2_000]) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        return await repo.find<D & HasPatchworkMetadata>(
          stored as AutomergeUrl
        );
      } catch (error) {
        lastError = error;
        console.warn(
          `resolveAccountHandle: could not open stored account ${stored}; retrying`,
          error
        );
      }
    }
    throw new Error(
      `resolveAccountHandle: could not open the stored account ${stored}. ` +
        `Refusing to replace the stored account pointer; reload to retry ` +
        `(or clear localStorage["${options.storageKey}"] to start a fresh account).`,
      { cause: lastError }
    );
  }

  const handle = await createAccount<D>(repo, options.hive);
  storage.setItem(options.storageKey, handle.url);
  return handle;
}

async function createAccount<D>(
  repo: Repo,
  hive: AutomergeRepoKeyhive | undefined,
): Promise<DocHandle<D & HasPatchworkMetadata>> {
  const datatypes = getRegistry<DatatypeDescription>("patchwork:datatype");
  const accountDatatype = await datatypes.loadWhenReady("account");
  const handle = await createDocOfDatatype2<D>(accountDatatype, repo, undefined, hive);

  if (hive) {
    await hive.addSyncServerRelayToDoc(handle.url);
  }

  return handle;
}

