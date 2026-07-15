import type { LogEntry } from "./logger.js";

/**
 * The BroadcastChannel the service worker and the automerge shared worker
 * use to hand requests off to each other. Broadcast (rather than a
 * MessagePort handed from one to the other) so the two never need to be
 * reintroduced when either of them restarts — and so tabs can listen in.
 */
export const HANDOFF_CHANNEL = "@patchwork/handoff";

/**
 * BroadcastChannel on which the automerge shared worker announces remote
 * heads it learns about from the sync server. Any tab can listen to stay
 * informed of sync progress without repo-to-repo gossiping.
 */
export const SYNCSTATE_CHANNEL = "@patchwork/syncstate";

/**
 * Worker → tabs: the worker's Subduction link to the sync server flipped.
 * `serverPeerIds` are the directly-connected sync-server peer ids (their
 * verifying keys), so a tab can tell which peer rows are *the server* and
 * judge "synced" against them specifically.
 */
export interface SyncStateConnectionMessage {
  type: "connection";
  connected: boolean;
  serverPeerIds: string[];
}

/**
 * Worker → tabs: the shared worker's own Subduction identity, so a tab can
 * tell which peer rows are "us". `peerId` is `signer.peerId().toString()` (the
 * value that shows up as a peer id); `verifyingKey` is its hex Ed25519 key.
 */
export interface SyncStateWhoAmIMessage {
  type: "whoami";
  peerId: string;
  verifyingKey: string;
}

// What the worker broadcasts on SYNCSTATE_CHANNEL: only the *global* signals
// now. Per-document heads are addressed to subscribers over the control port
// instead (see SyncStateDocMessage) rather than fanned out to every tab.
export type SyncStateBroadcast =
  | SyncStateConnectionMessage
  | SyncStateWhoAmIMessage;

/**
 * Tab → worker: please replay the current global sync signals (whoami +
 * connection) so a freshly-opened tab can orient immediately. Per-document
 * heads are no longer replayed here — a tab subscribes to the specific docs it
 * cares about over its control port instead (see {@link SyncSubscribeMessage}).
 */
export interface SyncStateRequestMessage {
  type: "request";
  /** @deprecated ignored — per-doc state is delivered via sync-sub now. */
  documentId?: string;
}

// ── Per-tab sync-state subscription (over the SharedWorker control port) ──
//
// The broadcast SyncState* messages above are global (connection/whoami).
// Per-document heads, by contrast, are addressed: a tab subscribes its control
// port to just the documents it cares about and the worker pushes only those
// docs' heads back down that port. The worker drops a port's whole
// subscription set automatically when the port closes (the tab went away), so
// there's no reference counting or heartbeat to leak.

/** Tab → worker: start pushing me this document's heads (replays current state). */
export interface SyncSubscribeMessage {
  type: "sync-sub";
  documentId: string;
}

/** Tab → worker: stop pushing me this document's heads. */
export interface SyncUnsubscribeMessage {
  type: "sync-unsub";
  documentId: string;
}

/**
 * Worker → tab (control port): a peer's heads for a subscribed document — the
 * worker's own (keyed by its peerId) or a Subduction peer's (keyed by its
 * verifying-key storageId). Same payload as the old broadcast remote-heads
 * message, but delivered only to the tabs that asked for this document.
 */
export interface SyncStateDocMessage {
  type: "sync-state";
  documentId: string;
  storageId: string;
  heads: string[];
  timestamp: number;
}

/**
 * The special URL to resolve, plus enough of the {@link Request} the service
 * worker is holding that the automerge worker can construct one that
 * `cache.match`es it.
 *
 * Stale workers on either side of the channel can outlive a deploy, so the
 * shape can only ever change additively: `url` must stay the http request
 * URL old automerge workers decode the special URL out of, and new meaning
 * goes in new fields old receivers ignore.
 */
export interface HandoffRequest {
  /**
   * The URL of the request the service worker is holding (the encoded
   * `https://…/automerge%3Aabc/…` form) — the cache key.
   */
  url: string;
  /** the decoded special URL, e.g. `automerge:abc/some/path` */
  handoffURL: string;
  /**
   * @deprecated A briefly-deployed shape put the special URL in `url` and
   * the cache key here. Only read, never sent.
   */
  cacheKey?: string;
  headers: Record<string, string>;
  method: string;
  destination: RequestDestination;
  referrer: string;
}

/**
 * Service worker → automerge worker: please resolve this request and put
 * the response in my cache.
 */
export interface HandoffRequestMessage {
  id: string;
  type: "request";
  /** the current name of the service worker cache */
  cachename: string;
  request: HandoffRequest;
}

/**
 * Automerge worker → service worker: the response is stored in the cache
 * under the request you're holding. Serve `cache.match`.
 */
export interface HandoffCachedMessage {
  id: string;
  type: "cached";
}

/**
 * An inline response for things that shouldn't be cached: errors, redirects
 * &c.
 */
export interface HandoffResponse {
  body?: string | Uint8Array<ArrayBuffer>;
  /** defaults to 200 */
  status?: number;
  headers?: Record<string, string>;
}

/**
 * Automerge worker → service worker: don't cache anything, serve this
 * response directly.
 */
export interface HandoffResponseMessage {
  id: string;
  type: "response";
  response: HandoffResponse;
}

export type HandoffReplyMessage = HandoffCachedMessage | HandoffResponseMessage;

/**
 * Automerge worker → world: broadcast once on startup so the service worker
 * can re-send any handoff requests that raced the worker's boot.
 */
export interface HandoffOnlineMessage {
  type: "online";
}

// ── Diagnostics ────────────────────────────────────────────────────────
// Tab → worker (control port) / tab → service worker (postMessage). The tab
// sends `{ type: "diagnostics" }` with a transferred reply MessagePort; the
// worker/SW gathers its state and posts a result back on that port, then
// closes it.

export interface DiagnosticsRequestMessage {
  type: "diagnostics";
}

/** State the automerge SharedWorker contributes to a diagnostics bundle. */
export interface WorkerDiagnostics {
  collectedAt: number;
  keyhive: boolean;
  endpoints: string[];
  classicSync: { server: string; connected: boolean } | null;
  repo: {
    peerId: string | null;
    peers: string[];
    peerCount: number;
    handleCount: number;
    handles: Array<{
      documentId: string;
      state?: string;
      heads?: string[] | null;
    }>;
  } | null;
  subductionPeerIds: string[] | null;
  /**
   * The peer's Ed25519 verifying (public) key + subduction peer id. NOTE: the
   * private signing key itself lives in the raw IndexedDB dump the tab collects
   * (`subduction-signer`), per the "full visibility" bundle policy.
   */
  signer: { verifyingKeyHex: string | null; peerId: string | null } | null;
  logs: LogEntry[];
  logsDropped: number;
  errors: string[];
}

/** State the service worker contributes to a diagnostics bundle. */
export interface ServiceWorkerDiagnostics {
  collectedAt: number;
  cacheVersion: string | null;
  caches: Array<{ name: string; entryCount: number; urls?: string[] }>;
  logs: LogEntry[];
  logsDropped: number;
  errors: string[];
}

export interface WorkerDiagnosticsResultMessage {
  type: "diagnostics-result";
  data: WorkerDiagnostics;
}

export interface ServiceWorkerDiagnosticsResultMessage {
  type: "diagnostics-result";
  data: ServiceWorkerDiagnostics;
}

export type SetupServiceWorkerOptions = {
  /**
   * The public path to the service worker file.
   * Defaults to `/service-worker.js`
   */
  path?: string;
  /**
   * The public path to the automerge shared worker file.
   * Defaults to `/automerge-worker.js`
   */
  workerPath?: string;
};

export type ServiceWorkerRepoChannelListener = (
  port: MessagePort
) => void | Promise<void>;

export type SetupServiceWorkerResult = {
  shared?: SharedWorker;
  kill?: () => void;
  /** Open a classic Automerge sync WebSocket from the automerge worker. */
  connectClassicSync: (server?: string) => Promise<void>;
  subscribeToRepoChannel: (
    listener: ServiceWorkerRepoChannelListener
  ) => Promise<() => void>;
  /** Open a fresh repo sync port to the automerge worker (dev console). */
  getRepoChannel: () => MessagePort;
  /**
<<<<<<< HEAD
   * Ask the automerge SharedWorker for its diagnostics snapshot. Resolves
   * `null` if it doesn't reply within `timeoutMs` (so a wedged worker can't
   * hang the export).
   */
  requestWorkerDiagnostics: (
    timeoutMs?: number
  ) => Promise<WorkerDiagnostics | null>;
  /**
   * Ask the service worker for its diagnostics snapshot. Resolves `null` if
   * there's no controller or it doesn't reply within `timeoutMs`.
   */
  requestServiceWorkerDiagnostics: (
    timeoutMs?: number
  ) => Promise<ServiceWorkerDiagnostics | null>;
=======
   * Watch one document's sync heads (this tab's own and each Subduction peer's,
   * as the worker learns them). Calls `listener` on every update for that doc,
   * replaying the current state on subscribe. Returns an unsubscribe function;
   * the worker stops pushing the doc once the last local watcher drops it (and
   * automatically if this tab goes away).
   */
  subscribeSyncState: (
    documentId: string,
    listener: (update: SyncStateDocMessage) => void
  ) => () => void;
>>>>>>> origin/main
};
