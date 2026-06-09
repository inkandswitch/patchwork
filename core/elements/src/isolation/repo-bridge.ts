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
} from "@automerge/automerge-repo";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";
import { log } from "./patchwork-isolation.js";

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

/**
 * Maintains a set of document IDs that the iframe is allowed to sync.
 * Used by the intermediary repo's shareConfig to gate document access.
 */
export class SyncAllowlist {
  #allowed = new Set<DocumentId>();

  add(url: AutomergeUrl): void {
    const { documentId } = parseAutomergeUrl(url);
    this.#allowed.add(documentId);
  }

  has(documentId: DocumentId): boolean {
    return this.#allowed.has(documentId);
  }

  hasUrl(url: AutomergeUrl): boolean {
    const { documentId } = parseAutomergeUrl(url);
    return this.#allowed.has(documentId);
  }

  get size(): number {
    return this.#allowed.size;
  }
}

export interface IntermediaryRepoOptions {
  /** The allowlist controlling which documents can sync to the iframe. */
  allowlist: SyncAllowlist;
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
  const { allowlist, hostRepo, denylist } = options;

  const hostRepoPeerId = hostRepo.peerId;

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
        if (!documentId) return true;
        if (denylist?.has(documentId)) return false;
        return allowlist.has(documentId);
      },
      access: async (peerId: PeerId, documentId?: DocumentId) => {
        if (!documentId) return false;
        if (denylist?.has(documentId)) {
          if (peerId !== hostRepoPeerId) {
            log(`access ${documentId} DENIED`);
          }
          return false;
        }
        const allowed = allowlist.has(documentId);
        if (peerId !== hostRepoPeerId) {
          log(`access ${documentId} ${allowed ? "ALLOWED" : "BLOCKED"}`);
        }
        return allowed;
      },
    },
  });

  // Connect the host repo to the other end of the isolation host channel
  const isolationHostAdapter = new MessageChannelNetworkAdapter(
    hostChannel.port2,
    {
      useWeakRef: true,
    }
  );
  hostRepo.networkSubsystem.addNetworkAdapter(isolationHostAdapter);

  return {
    repo,
    iframePort: iframeChannel.port2,

    shutdown() {
      isolationHostAdapter.disconnect();
      hostChannel.port1.close();
      hostChannel.port2.close();
      iframeChannel.port1.close();
      iframeChannel.port2.close();
    },
  };
}
