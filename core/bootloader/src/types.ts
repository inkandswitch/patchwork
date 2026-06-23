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
};
