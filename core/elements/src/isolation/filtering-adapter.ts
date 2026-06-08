/**
 * A NetworkAdapter wrapper that filters sync messages by document ID.
 * Messages for documents not in the allowlist are silently dropped in
 * both directions (send and receive).
 *
 * Uses composition: wraps a MessageChannelNetworkAdapter and proxies its
 * NetworkAdapter interface, filtering the "message" event and send().
 */
import type { DocumentId, PeerId } from "@automerge/automerge-repo";
import { NetworkAdapter, type PeerMetadata } from "@automerge/automerge-repo";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";

type IsAllowed = (documentId: DocumentId) => boolean;

interface MessageLike {
  type: string;
  documentId?: DocumentId;
  [key: string]: unknown;
}

/**
 * Network adapter that filters sync traffic by document ID.
 *
 * Delegates all operations to an inner MessageChannelNetworkAdapter but
 * intercepts:
 *  - **Outbound (send)**: drops messages with a disallowed `documentId`.
 *  - **Inbound (message event)**: drops messages with a disallowed `documentId`.
 *
 * Messages without a `documentId` (arrive, welcome, leave) always pass.
 */
export class FilteringNetworkAdapter extends NetworkAdapter {
  #inner: MessageChannelNetworkAdapter;
  #isAllowed: IsAllowed;

  constructor(port: MessagePort, isAllowed: IsAllowed) {
    super();
    this.#isAllowed = isAllowed;
    this.#inner = new MessageChannelNetworkAdapter(port);

    // Forward all events from inner adapter, filtering "message" events
    this.#inner.on("peer-candidate", (payload) => {
      this.emit("peer-candidate", payload);
    });
    this.#inner.on("peer-disconnected", (payload) => {
      this.emit("peer-disconnected", payload);
    });
    this.#inner.on("message", (msg: MessageLike) => {
      if (msg.documentId && !this.#isAllowed(msg.documentId)) {
        return; // Drop
      }
      this.emit("message", msg as any);
    });
    this.#inner.on("close", () => {
      this.emit("close");
    });
  }

  isReady(): boolean {
    return this.#inner.isReady();
  }

  whenReady(): Promise<void> {
    return this.#inner.whenReady();
  }

  connect(peerId: PeerId, peerMetadata?: PeerMetadata): void {
    this.peerId = peerId;
    this.peerMetadata = peerMetadata;
    this.#inner.connect(peerId, peerMetadata);
  }

  send(message: MessageLike): void {
    if (message.documentId && !this.#isAllowed(message.documentId)) {
      return; // Drop
    }
    this.#inner.send(message as any);
  }

  disconnect(): void {
    this.#inner.disconnect();
  }
}
