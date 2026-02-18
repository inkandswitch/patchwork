/// <reference lib="webworker" />
declare const self: SharedWorkerGlobalScope;
export {};

self.addEventListener("connect", (e: MessageEvent) => {
  configureRepoNetworkPort(e.ports[0]);
});

const repoPromise = (async () => {
  const { Repo } = await import("@automerge/automerge-repo");
  const { IndexedDBStorageAdapter, WebSocketClientAdapter } =
    await import("@automerge/vanillajs");
  return new Repo({
    storage: new IndexedDBStorageAdapter(),
    network: [new WebSocketClientAdapter("wss://sync3.automerge.org")],
    peerId: ("shared-worker-" + Math.round(Math.random() * 10000)) as any,
    async sharePolicy(peerId) {
      return peerId.startsWith("storage-server-");
    },
  });
})();

async function configureRepoNetworkPort(port: MessagePort) {
  const repo = await repoPromise;
  const { MessageChannelNetworkAdapter } = await import("@automerge/vanillajs");
  repo.networkSubsystem.addNetworkAdapter(
    new MessageChannelNetworkAdapter(port, { useWeakRef: true })
  );
}
