import type { Repo, AutomergeUrl } from "@automerge/automerge-repo";
import type { StorageAdapter } from "@automerge/automerge-repo";
import type { LoadablePlugin } from "@inkandswitch/patchwork-plugins";
import type { ModuleWatcher } from "@inkandswitch/patchwork-filesystem";

import type { initializeAutomergeRepoKeyhive } from "@automerge/automerge-repo-keyhive";
type AutomergeRepoKeyhive = Awaited<
  ReturnType<typeof initializeAutomergeRepoKeyhive>
>;

export interface RepoConfig {
  storage?: StorageAdapter;
  sharePolicy?: (peerId: string) => Promise<boolean>;
  enableRemoteHeadsGossiping?: boolean;
  subscribeToRemotes?: string[];
}

export interface PatchworkOptions {
  serviceWorker?: { path?: string; syncServer?: string } | boolean;
  elements?: boolean;
  repo?: Repo | RepoConfig;
  hive?: AutomergeRepoKeyhive;
  globals?: boolean;
}

export interface Patchwork {
  setup(options?: PatchworkOptions): Promise<Patchwork>;
  repo: Repo;
  port?: MessagePort;
  isReady(): boolean;
  whenReady(): Promise<Patchwork>;
  register(
    plugins: LoadablePlugin | LoadablePlugin[],
    importUrl?: string
  ): void;
  watch(
    urls: AutomergeUrl | AutomergeUrl[],
    onLoad?: (name: string, mod: any) => void
  ): ModuleWatcher;
  modules?: ModuleWatcher;
}
