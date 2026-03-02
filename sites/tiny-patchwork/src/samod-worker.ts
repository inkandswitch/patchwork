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
  console.log("[automerge worker: STARTING] creating repo");
  const { Repo } = await import("@automerge/automerge-repo");
  const { IndexedDBStorageAdapter, WebSocketClientAdapter } =
    await import("@automerge/vanillajs");
  const network = new WebSocketClientAdapter("wss://samod.sync.automerge.org");
  const repo = new Repo({
    storage: new IndexedDBStorageAdapter(),
    network: [network],
    peerId: ("shared-worker-" +
      (Math.random() * 10000).toString(36).slice(2)) as PeerId,
    async sharePolicy(peerId) {
      console.log(`[automerge worker: SHARE POLICY] evaluating ${peerId}`);
      return peerId.includes("storage-");
    },
    enableRemoteHeadsGossiping: true,
  });
  (self as any).repo = repo;
  repo.subscribeToRemotes([
    "1fcd2698-3426-4288-9c47-85364db5073b" as import("@automerge/automerge-repo").StorageId,
  ]);
  network.whenReady().then(() => {
    console.log("[automerge worker: CONNECTED] websocket ready");
  });
  console.log("[automerge worker: READY] repo created");
  return repo;
})();

const deleteChannel = new BroadcastChannel("automerge-worker-delete");
deleteChannel.onmessage = async (event) => {
  if (event.data?.type === "delete") {
    const repo = await repoPromise;
    repo.delete(event.data.docId);
    console.log(`[automerge worker: DELETE] deleted ${event.data.docId}`);
  }
};

async function configureRepoNetworkPort(port: MessagePort) {
  const repo = await repoPromise;
  const { MessageChannelNetworkAdapter } = await import("@automerge/vanillajs");
  repo.networkSubsystem.addNetworkAdapter(
    new MessageChannelNetworkAdapter(port, { useWeakRef: true })
  );
}
