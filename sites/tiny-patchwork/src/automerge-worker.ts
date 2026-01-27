/// <reference lib="webworker" />
declare const self: SharedWorkerGlobalScope;
export {};

self.addEventListener("connect", (e: MessageEvent) => {
  configureRepoNetworkPort(e.ports[0]);
});

const repoPromise = (async () => {
  const { Repo } = await import("@automerge/automerge-repo");
  const { IndexedDBStorageAdapter } = await import("@automerge/vanillajs");
  const { SubductionStorageBridge } = await import("@automerge/automerge-repo-subduction-bridge");
  const { Subduction, SubductionWebSocket, WebCryptoSigner } = await import("@automerge/automerge_subduction");

  const signer = await WebCryptoSigner.setup();
  const storageAdapter = new IndexedDBStorageAdapter();
  const storage = new SubductionStorageBridge(storageAdapter);
  const subduction = await Subduction.hydrate(signer, storage);

  try {
    const conn = await SubductionWebSocket.tryDiscover(
      new URL("ws://localhost:8080"),
      signer,
      "0.0.0.0:8080",
      5000
    );
    await subduction.attach(conn);
    console.log("SharedWorker: Connected to Subduction server");
  } catch (e) {
    console.warn("SharedWorker: No Subduction server, running local-only:", e);
  }

  return new Repo({
    network: [],
    subduction,
    peerId: ("shared-worker-" + Math.round(Math.random() * 10000)) as any,
  });
})();

async function configureRepoNetworkPort(port: MessagePort) {
  const repo = await repoPromise;
  const { MessageChannelNetworkAdapter } = await import("@automerge/vanillajs");
  repo.networkSubsystem.addNetworkAdapter(
    new MessageChannelNetworkAdapter(port, { useWeakRef: true })
  );
}
