export type SetupServiceWorkerOptions = {
  /**
   * The public path to the service worker file.
   * Defaults to `/service-worker.js`
   */
  path?: string;
  /**
   * WebSocket URL for a sync server.
   * If provided, the default sync server is replaced with this one.
   */
  syncServer?: string;
};
