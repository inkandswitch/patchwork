/**
 * Creates an ephemeral intermediary Repo that sits between the host's main
 * Repo and an isolated iframe's Repo. It enforces an allowlist of document
 * URLs — only documents the user has authorized can sync to the iframe.
 *
 * Architecture: The intermediary repo connects to the host repo on one side
 * and provides a MessagePort for the iframe repo on the other. A filtering
 * network adapter on the iframe-facing side intercepts all sync messages and
 * only forwards those for allowlisted documents.
 *
 * The intermediary has no persistent storage.
 */
import {
  Repo,
  type AutomergeUrl,
  type PeerId,
  type DocumentId,
  parseAutomergeUrl,
} from "@automerge/automerge-repo";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";
import { FilteringNetworkAdapter } from "./filtering-adapter.js";

export interface IntermediaryRepoOptions {
  /** The root document URL the tool is authorized to access. */
  rootDocUrl: AutomergeUrl;
  /** The host Repo to sync allowed documents from. */
  hostRepo: Repo;
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
 *  2. iframeChannel — connects intermediary ↔ iframe repo (filtered)
 *
 * The filtering adapter on the iframe-facing side of the intermediary drops
 * sync/request messages for documents not in the allowlist. The host side
 * shares freely with the intermediary (the intermediary is a trusted peer).
 */
export function createIntermediaryRepo(
  options: IntermediaryRepoOptions
): IntermediaryRepo {
  const { rootDocUrl, hostRepo } = options;

  const allowedDocIds = new Set<DocumentId>();
  const allowedUrls = new Set<AutomergeUrl>();

  const addToAllowlist = (url: AutomergeUrl) => {
    allowedUrls.add(url);
    try {
      const { documentId } = parseAutomergeUrl(url);
      allowedDocIds.add(documentId);
    } catch {
      // If the URL can't be parsed, still track it by URL
    }
  };

  addToAllowlist(rootDocUrl);

  const isDocAllowed = (docId: DocumentId): boolean => {
    return allowedDocIds.has(docId);
  };

  // Channel connecting intermediary ↔ host repo
  const hostChannel = new MessageChannel();
  const hostAdapter = new MessageChannelNetworkAdapter(hostChannel.port1);

  // Channel connecting intermediary ↔ iframe repo, with filtering
  const iframeChannel = new MessageChannel();
  const iframeAdapter = new FilteringNetworkAdapter(
    iframeChannel.port1,
    isDocAllowed
  );

  const repo = new Repo({
    peerId: `intermediary-${crypto.randomUUID().slice(0, 8)}` as PeerId,
    network: [hostAdapter, iframeAdapter],
    // No storage — ephemeral
  });

  // Connect the host repo to the other end of the host channel
  const hostSideAdapter = new MessageChannelNetworkAdapter(hostChannel.port2);
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
      hostChannel.port1.close();
      hostChannel.port2.close();
      iframeChannel.port1.close();
      iframeChannel.port2.close();
    },
  };
}
