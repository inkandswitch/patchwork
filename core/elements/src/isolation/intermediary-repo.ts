/**
 * Creates an ephemeral intermediary Repo that sits between the host's main
 * Repo and an isolated iframe's Repo. It enforces an allowlist of document
 * URLs — only documents the user has authorized can sync to the iframe.
 *
 * Access control uses `shareConfig` on the intermediary Repo with `access()`
 * and `announce()` callbacks that gate per-document sync:
 *  - `access`: gates ALL peers (including host) by allowlist — the intermediary
 *    never holds non-allowlisted documents in memory
 *  - `announce`: only announces allowlisted documents
 *
 * The intermediary has no persistent storage (`isEphemeral: true`).
 */
import {
  Repo,
  type AutomergeUrl,
  type PeerId,
  type DocumentId,
  parseAutomergeUrl,
  isValidAutomergeUrl,
} from "@automerge/automerge-repo";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";

/**
 * Recursively walks a value and collects all valid automerge URLs found.
 */
export function collectAutomergeUrls(
  value: unknown,
  urls: Set<AutomergeUrl>
): void {
  if (typeof value === "string") {
    if (isValidAutomergeUrl(value)) urls.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectAutomergeUrls(item, urls);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>))
      collectAutomergeUrls(v, urls);
  }
}

/**
 * Maintains a set of document IDs that must never be synced to the iframe,
 * regardless of allowlist status. Takes precedence over the allowlist.
 * Used to protect sensitive documents: account doc, module settings,
 * tool/package source code, and branches docs.
 */
export class SyncDenylist {
  #denied = new Set<DocumentId>();

  add(url: AutomergeUrl): void {
    const { documentId } = parseAutomergeUrl(url);
    this.#denied.add(documentId);
  }

  has(documentId: DocumentId): boolean {
    return this.#denied.has(documentId);
  }

  hasUrl(url: AutomergeUrl): boolean {
    const { documentId } = parseAutomergeUrl(url);
    return this.#denied.has(documentId);
  }

  get size(): number {
    return this.#denied.size;
  }
}

export interface IntermediaryRepoOptions {
  /** The root document URL the tool is authorized to access. */
  rootDocUrl: AutomergeUrl;
  /** The host Repo to sync allowed documents from. */
  hostRepo: Repo;
  /** Optional denylist — denylisted documents are blocked regardless of allowlist. */
  denylist?: SyncDenylist;
}

export interface IntermediaryRepo {
  /** The intermediary Repo instance. */
  repo: Repo;
  /** Port to hand to the iframe's Repo via MessageChannelNetworkAdapter. */
  iframePort: MessagePort;
  /** Add a document URL to the allowlist. */
  allow(url: AutomergeUrl): void;
  /** Check whether a URL is currently allowed. */
  isAllowed(url: AutomergeUrl): boolean;
  /** Tear down the intermediary repo and close all channels. */
  shutdown(): void;
}

/**
 * Create an intermediary repo with an allowlist seeded with `rootDocUrl`.
 *
 * Two MessageChannels are created:
 *  1. hostChannel — connects intermediary ↔ host repo
 *  2. iframeChannel — connects intermediary ↔ iframe repo
 *
 * The intermediary's `shareConfig` gates document sync:
 *  - Only allowlisted documents are accepted from any peer (including the host)
 *  - Only allowlisted documents are announced to the iframe peer
 */
export function createIntermediaryRepo(
  options: IntermediaryRepoOptions
): IntermediaryRepo {
  const { rootDocUrl, hostRepo, denylist } = options;

  const allowedDocIds = new Set<DocumentId>();
  const allowedUrls = new Set<AutomergeUrl>();

  const addToAllowlist = (url: AutomergeUrl) => {
    allowedUrls.add(url);
    try {
      const { documentId } = parseAutomergeUrl(url);
      allowedDocIds.add(documentId);
      console.warn("[intermediary] allowlisted", documentId, url);
    } catch {
      // If the URL can't be parsed, still track it by URL
      console.warn("[intermediary] allowlisted (unparseable)", url);
    }
  };

  addToAllowlist(rootDocUrl);

  // Channel connecting intermediary ↔ host repo
  const hostChannel = new MessageChannel();
  const hostAdapter = new MessageChannelNetworkAdapter(hostChannel.port1, {
    useWeakRef: true,
  });

  // Channel connecting intermediary ↔ iframe repo
  const iframeChannel = new MessageChannel();
  const iframeAdapter = new MessageChannelNetworkAdapter(iframeChannel.port1, {
    useWeakRef: true,
  });

  const repo = new Repo({
    peerId: `intermediary-${crypto.randomUUID().slice(0, 8)}` as PeerId,
    network: [hostAdapter, iframeAdapter],
    isEphemeral: true,
    shareConfig: {
      announce: async (_peerId: PeerId, documentId?: DocumentId) => {
        // Peer-level call (no documentId): allow general communication
        if (!documentId) return true;
        if (denylist?.has(documentId)) {
          console.warn("[intermediary] announce", documentId, "DENIED");
          return false;
        }
        const allowed = allowedDocIds.has(documentId);
        console.warn(
          "[intermediary] announce",
          documentId,
          allowed ? "ALLOWED" : "BLOCKED"
        );
        return allowed;
      },
      access: async (_peerId: PeerId, documentId?: DocumentId) => {
        // Gate ALL peers (including host) by denylist then allowlist.
        if (!documentId) return false;
        if (denylist?.has(documentId)) {
          console.warn("[intermediary] access", documentId, "DENIED");
          return false;
        }
        const allowed = allowedDocIds.has(documentId);
        console.warn(
          "[intermediary] access",
          documentId,
          allowed ? "ALLOWED" : "BLOCKED"
        );
        return allowed;
      },
    },
  });

  // Connect the host repo to the other end of the host channel
  const hostSideAdapter = new MessageChannelNetworkAdapter(hostChannel.port2, {
    useWeakRef: true,
  });
  hostRepo.networkSubsystem.addNetworkAdapter(hostSideAdapter);

  return {
    repo,
    iframePort: iframeChannel.port2,

    allow(url: AutomergeUrl) {
      addToAllowlist(url);
    },

    isAllowed(url: AutomergeUrl) {
      return allowedUrls.has(url);
    },

    shutdown() {
      hostSideAdapter.disconnect();
      hostChannel.port1.close();
      hostChannel.port2.close();
      iframeChannel.port1.close();
      iframeChannel.port2.close();
    },
  };
}
