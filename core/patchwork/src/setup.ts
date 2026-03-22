import { Repo } from "@automerge/automerge-repo";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";
import setupServiceWorker from "@inkandswitch/patchwork-bootloader";
import { registerPatchworkViewElement } from "@inkandswitch/patchwork-elements";
import {
  registerPlugins,
  type LoadablePlugin,
} from "@inkandswitch/patchwork-plugins";
import { ModuleWatcher } from "@inkandswitch/patchwork-filesystem";
import * as Automerge from "@automerge/automerge";
import * as AutomergeRepo from "@automerge/automerge-repo";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { PatchworkOptions, Patchwork, RepoConfig } from "./types.js";
import debug from "debug";

const log = debug("patchwork:setup");

function isRepo(value: unknown): value is Repo {
  return value instanceof Repo;
}

let resolveReady: (value: Patchwork) => void;
let ready = false;
let setupStarted = false;
const readyPromise = new Promise<Patchwork>((resolve) => {
  resolveReady = resolve;
});

const patchwork = {} as Patchwork;

patchwork.setup = function (
  options?: PatchworkOptions
): Promise<Patchwork> {
  if (ready) return Promise.resolve(patchwork);
  if (setupStarted) return readyPromise;
  setupStarted = true;
  doSetup(options ?? {});
  return readyPromise;
};

patchwork.isReady = () => ready;
patchwork.whenReady = () => readyPromise;

async function doSetup(options: PatchworkOptions): Promise<void> {
  const {
    serviceWorker: swOptions = true,
    elements = true,
    repo: repoOption,
    hive,
    globals = true,
  } = options;

  // 1. Create Repo (or use provided one)
  let repoConfig: RepoConfig | undefined;
  let repo: Repo;
  if (repoOption && isRepo(repoOption)) {
    repo = repoOption;
  } else {
    repoConfig = repoOption;
    repo = new Repo({
      storage: repoConfig?.storage ?? new IndexedDBStorageAdapter(),
      sharePolicy:
        repoConfig?.sharePolicy ??
        (async (peerId) => peerId.includes("service-worker")),
      enableRemoteHeadsGossiping: repoConfig?.enableRemoteHeadsGossiping,
    });
  }

  // 2. Subscribe to remotes if configured
  if (repoConfig?.subscribeToRemotes) {
    repo.subscribeToRemotes(repoConfig.subscribeToRemotes as any[]);
  }

  // 3. Set up service worker (unless disabled)
  let port: MessagePort | undefined;
  if (swOptions !== false) {
    const swConfig =
      typeof swOptions === "object" ? swOptions : undefined;
    const result = await setupServiceWorker(swConfig);
    if (!result) {
      throw new Error("Failed to set up service worker");
    }
    port = result.port;

    // 4. Connect SW port as network adapter
    repo.networkSubsystem.addNetworkAdapter(
      new MessageChannelNetworkAdapter(port)
    );
    await repo.networkSubsystem.whenReady();
  }

  // 5. Set globals
  if (globals) {
    (window as any).repo = repo;
    (window as any).Automerge = Automerge;
    (window as any).AutomergeRepo = AutomergeRepo;
  }

  // 6. Flush
  await repo.flush();

  // 7. Register <patchwork-view> element
  if (elements) {
    registerPatchworkViewElement({ repo, hive });
  }

  // 8. Populate the singleton
  patchwork.repo = repo;
  patchwork.port = port;

  patchwork.register = function (plugins, importUrl) {
    const arr = Array.isArray(plugins) ? plugins : [plugins];
    const url =
      importUrl ??
      URL.createObjectURL(
        new Blob(["// patchwork inline registration"], {
          type: "application/javascript",
        })
      );
    registerPlugins(arr, url);
  };

  patchwork.watch = function (urls, onLoad) {
    const callback =
      onLoad ??
      ((name: string, mod: any) => {
        if (Array.isArray(mod.plugins)) {
          registerPlugins(mod.plugins, name);
        }
      });
    const watcher = new ModuleWatcher(repo, urls, callback);
    patchwork.modules = watcher;
    return watcher;
  };

  ready = true;

  if (globals) {
    (window as any).patchwork = patchwork;
  }

  log("patchwork setup complete");

  resolveReady(patchwork);
}

export default patchwork;
