export type SetupServiceWorkerOptions = {
  /**
   * The public path to the service worker file.
   * Defaults to `/service-worker.js`
   */
  path?: string;
  /**
   * Subduction WebSocket endpoint URLs.
   * Defaults to `["wss://subduction.sync.inkandswitch.com"]`.
   */
  subductionEndpoints?: string[];
};
