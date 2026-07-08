/**
 * these dependencies will be built into the outdir, and injected into the importmap
 */
const externals = [
  "@automerge/automerge",
  "@automerge/automerge/slim",
  "@automerge/automerge-repo",
  "@automerge/automerge-repo/slim",
  // Port-donation plumbing for WorkerWebSocketEndpoint: tabs spawn the shared
  // proxy entry and donate its port to the automerge worker (Chrome can't
  // spawn workers from inside a SharedWorker). See setup.ts/automerge-worker.ts.
  "@automerge/automerge-repo/worker-port",
  "@automerge/automerge-repo/subduction-websocket-worker-shared",
  "@automerge/automerge-repo-network-messagechannel",
  "@automerge/automerge-repo-network-websocket",
  "@automerge/automerge-repo-storage-indexeddb",
  "@automerge/automerge-repo-keyhive",
  "@automerge/automerge-subduction",
  "@automerge/automerge-subduction/slim",
  "@keyhive/keyhive",
  "@keyhive/keyhive/slim",
  "@inkandswitch/patchwork-bootloader",
  "@inkandswitch/patchwork-elements",
  "@inkandswitch/patchwork-filesystem",
  "@inkandswitch/patchwork-plugins",
  "@inkandswitch/patchwork-providers",

  // sad
  "@codemirror/state",
  "@codemirror/view",
  "@codemirror/language",

  // rip
  "solid-js",
  "solid-js/html",
  "solid-js/web",
  "solid-js/h",
  "solid-js/store",
  "solid-js/jsx-runtime",
];
export default externals;
