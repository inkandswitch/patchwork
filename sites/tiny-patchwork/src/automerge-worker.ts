/// <reference lib="webworker" />

import { PeerId } from "@automerge/automerge-repo";

declare const self: SharedWorkerGlobalScope;
export {};

const logChannel = new BroadcastChannel("automerge-worker-logs");

function log(level: string, args: any[]) {
  try {
    logChannel.postMessage({
      type: "log",
      level,
      args: args.map((a) =>
        a instanceof Error
          ? { message: a.message, stack: a.stack }
          : typeof a === "object"
            ? JSON.parse(JSON.stringify(a))
            : a
      ),
    });
  } catch {
    // ok
  }
}

const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
};

console.log = (...args) => {
  originalConsole.log(...args);
  log("log", args);
};
console.warn = (...args) => {
  originalConsole.warn(...args);
  log("warn", args);
};
console.error = (...args) => {
  originalConsole.error(...args);
  log("error", args);
};
console.info = (...args) => {
  originalConsole.info(...args);
  log("info", args);
};

// @ts-expect-error i think you're wrong?
self.onerror = (event, source, lineno, colno, error) => {
  log("error", [
    "[automerge worker: ERROR]",
    {
      event,
      source,
      lineno,
      colno,
      error: error?.message,
      stack: error?.stack,
    },
  ]);
};

self.onunhandledrejection = (event) => {
  log("error", [
    "[automerge worker: UNHANDLED REJECTION]",
    String(event.reason),
  ]);
};

self.addEventListener("connect", (e: MessageEvent) => {
  console.log("[automerge worker: CONNECTED] new client connected");
  configureRepoNetworkPort(e.ports[0]);
});

const repoPromise = (async () => {
  console.log("[automerge worker: STARTING] creating repo with Subduction");

  // Dynamic imports
  const { Repo } = await import("@automerge/automerge-repo");
  const { IndexedDBStorageAdapter } = await import("@automerge/vanillajs");
  const { SubductionStorageBridge, initSubductionModule } =
    await import("@automerge/automerge-repo-subduction-bridge");
  const subductionModule = await import("@automerge/automerge_subduction");
  const initSubduction = subductionModule.default;
  const { Subduction, SubductionWebSocket, WebCryptoSigner } = subductionModule;

  // Initialize Subduction Wasm module and register with lazy loaders
  await initSubduction();
  initSubductionModule(subductionModule);
  console.log("[automerge worker: INIT] Subduction Wasm initialized");

  // Setup cryptographic signer (persisted in IndexedDB via WebCrypto)
  const signer = await WebCryptoSigner.setup();
  console.log("[automerge worker: INIT] WebCryptoSigner ready");

  // Create storage bridge wrapping IndexedDB
  const storageAdapter = new IndexedDBStorageAdapter();
  const storage = new SubductionStorageBridge(storageAdapter);

  // Hydrate Subduction state from storage
  const subduction = await Subduction.hydrate(signer, storage);
  console.log("[automerge worker: INIT] Subduction hydrated from storage");

  // Connect to Subduction sync server
  const SUBDUCTION_SERVER_URL = "ws://localhost:8080";
  try {
    const conn = await SubductionWebSocket.tryDiscover(
      new URL(SUBDUCTION_SERVER_URL),
      signer
    );
    await subduction.attach(conn);
    console.log(
      `[automerge worker: CONNECTED] Subduction server at ${SUBDUCTION_SERVER_URL}`
    );
  } catch (e) {
    console.warn(
      "[automerge worker: OFFLINE] No Subduction server, running local-only:",
      e
    );
  }

  // Create Repo with Subduction (handles both storage and network)
  const repo = new Repo({
    subduction,
    peerId: ("shared-worker-" +
      (Math.random() * 10000).toString(36).slice(2)) as PeerId,
  });

  console.log("[automerge worker: READY] Repo created with Subduction");
  return repo;
})();

async function configureRepoNetworkPort(port: MessagePort) {
  const repo = await repoPromise;
  const { MessageChannelNetworkAdapter } = await import("@automerge/vanillajs");
  repo.networkSubsystem.addNetworkAdapter(
    new MessageChannelNetworkAdapter(port, { useWeakRef: true })
  );
}
