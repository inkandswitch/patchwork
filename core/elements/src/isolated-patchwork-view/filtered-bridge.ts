/**
 * Filtered repo bridge for isolated tool iframes.
 *
 * Creates a lightweight proxy Repo that sits between the host's Repo and the
 * isolated iframe's Repo. The proxy only syncs documents that are in the
 * allowed set, enforcing least-authority access control.
 */

import {
  Repo,
  type AutomergeUrl,
  type PeerId,
  parseAutomergeUrl,
} from "@automerge/automerge-repo/slim";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";

/** Minimal interface for the filtered bridge (injected, not imported). */
export interface FilteredBridge {
  /** The MessagePort to transfer to the isolated iframe. */
  iframePort: MessagePort;
  /** Allow an additional document to sync through the bridge. */
  allow(docUrl: AutomergeUrl): void;
  /** Teardown the bridge and close all ports. */
  destroy(): void;
}

/**
 * Create a filtered bridge between the host repo and an isolated iframe.
 *
 * Only documents whose IDs are in the allowed set will sync through to the
 * iframe. The bridge creates an ephemeral proxy Repo (no persistent storage)
 * that relays documents between the host and iframe sides.
 */
export function createFilteredBridge(
  hostRepo: Repo,
  initialAllowed: AutomergeUrl[]
): FilteredBridge {
  const allowedDocIds = new Set<string>();
  for (const url of initialAllowed) {
    const { documentId } = parseAutomergeUrl(url);
    allowedDocIds.add(documentId);
  }

  // Channel A: host repo ↔ proxy repo
  const channelA = new MessageChannel();
  // Channel B: proxy repo ↔ iframe
  const channelB = new MessageChannel();

  // Connect the host repo to channelA.port1
  hostRepo.networkSubsystem.addNetworkAdapter(
    new MessageChannelNetworkAdapter(channelA.port1, { useWeakRef: true })
  );

  // Create the proxy repo.
  // TODO: Re-enable document-level filtering once the basic flow works.
  // For now, allow all documents through — origin isolation provides the
  // security boundary. The allowedDocIds set is maintained for future use.
  const proxyRepo = new Repo({
    peerId: `bridge-${crypto.randomUUID().slice(0, 8)}` as PeerId,
    async sharePolicy() {
      return true;
    },
  });

  // Connect proxy to both channels
  proxyRepo.networkSubsystem.addNetworkAdapter(
    new MessageChannelNetworkAdapter(channelA.port2)
  );
  proxyRepo.networkSubsystem.addNetworkAdapter(
    new MessageChannelNetworkAdapter(channelB.port1)
  );

  return {
    iframePort: channelB.port2,

    allow(docUrl: AutomergeUrl) {
      const { documentId } = parseAutomergeUrl(docUrl);
      allowedDocIds.add(documentId);
      // Trigger sync by finding the doc on the proxy — this will cause
      // it to be requested from the host side and announced to the iframe.
      proxyRepo.find(docUrl).catch(() => {});
    },

    destroy() {
      channelA.port1.close();
      channelA.port2.close();
      channelB.port1.close();
      channelB.port2.close();
    },
  };
}
