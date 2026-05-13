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
  subscribeToRepoChannel: (
    listener: ServiceWorkerRepoChannelListener
  ) => Promise<() => void>;
};
