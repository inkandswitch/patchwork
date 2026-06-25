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
  /** Open a classic Automerge sync WebSocket from the automerge worker. */
  connectClassicSync: (server?: string) => Promise<void>;
  subscribeToRepoChannel: (
    listener: ServiceWorkerRepoChannelListener
  ) => Promise<() => void>;
  /** Open a fresh repo sync port to the automerge worker (dev console). */
  getRepoChannel: () => MessagePort;
  /**
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
};
