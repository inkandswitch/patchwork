export type SetupServiceWorkerOptions = {
  /**
   * The public path to the service worker file.
   * Defaults to `/service-worker.js`
   */
  path?: string;
};

export type ServiceWorkerRepoChannelListener = (
  port: MessagePort
) => void | Promise<void>;

export type SetupServiceWorkerResult = {
  /** Open a classic Automerge sync WebSocket to the service worker repo. */
  connectClassicSync: (server?: string) => Promise<void>;
  subscribeToRepoChannel: (
    listener: ServiceWorkerRepoChannelListener
  ) => Promise<() => void>;
};
