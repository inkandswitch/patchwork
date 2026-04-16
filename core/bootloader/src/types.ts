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
  /**
   * Automerge URLs of module-settings documents whose `modules[]` arrays
   * list tool folder-doc URLs. Passed to the service worker so it can
   * eagerly `repo.find()` each tool doc as soon as the Repo is constructed,
   * warming the Subduction sync pipeline before the first fetch request
   * arrives.
   */
  moduleSettingsUrls?: string[];
};
