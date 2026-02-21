import * as A from "@automerge/automerge";
import {
  type DocHandle,
  type StorageId,
  type UrlHeads,
  type PeerId,
} from "@automerge/automerge-repo";
import {
  useRepo,
  RepoContext,
} from "@automerge/automerge-repo-solid-primitives";
import { createSignal, createEffect, on, onCleanup, Show, For } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { getRelativeTimeString } from "./lib/relative-time";
import { Button, Popover, PopoverTrigger, PopoverContent } from "./lib/ui";
import { SyncIcon } from "./SyncIcon";
import { CopyIcon } from "./CopyIcon";
import "./styles.css";

export { RepoContext };

export const SYNC_SERVER_STORAGE_ID = (import.meta.env
  ?.VITE_SYNC_SERVER_STORAGE_ID ??
  "3760df37-a4c6-4f66-9ecd-732039a9385d") as StorageId;

interface PeerSyncInfo {
  id: string;
  name: string;
  storageId: StorageId | undefined;
  heads: UrlHeads | undefined;
  lastSyncTimestamp: number | undefined;
  inSync: boolean;
}

function peerName(peerId: PeerId): string {
  if (peerId.startsWith("shared-worker")) return "Shared Worker";
  if (peerId.startsWith("service-worker")) return "Service Worker";
  if (peerId.startsWith("storage-server")) return "Sync Server";
  return String(peerId);
}

export function SyncIndicator(props: { handle: DocHandle<unknown> }) {
  const repo = useRepo();
  const [isPopoverOpen, setIsPopoverOpen] = createSignal(false);
  const [now, setNow] = createSignal(Date.now());
  const [ownHeads, setOwnHeads] = createSignal<UrlHeads | undefined>();
  const [isOnline, setIsOnline] = createSignal(navigator.onLine);

  // sync server state (driven by its known storage ID)
  const [syncServerHeads, setSyncServerHeads] = createSignal<
    UrlHeads | undefined
  >();
  const [syncServerTimestamp, setSyncServerTimestamp] = createSignal<
    number | undefined
  >();

  // connected peers (shared worker, etc)
  const [peers, setPeers] = createStore<PeerSyncInfo[]>([]);

  // tick every second while popover is open (for relative times)
  createEffect(
    on(isPopoverOpen, (open) => {
      if (!open) return;
      const interval = setInterval(() => setNow(Date.now()), 1000);
      onCleanup(() => clearInterval(interval));
    })
  );

  // online/offline
  {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    onCleanup(() => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    });
  }

  // track own heads + remote heads
  createEffect(() => {
    const h = props.handle;

    setOwnHeads(h.heads());

    const onChange = () => {
      if (h.doc()) setOwnHeads(h.heads());
    };

    const onRemoteHeads = ({
      storageId,
      heads,
      timestamp,
    }: {
      storageId: StorageId;
      heads: UrlHeads;
      timestamp: number;
    }) => {
      console.log("[sync-indicator] remote-heads", {
        storageId,
        heads,
        timestamp,
      });

      // sync server (gossiped through shared worker)
      if (storageId === SYNC_SERVER_STORAGE_ID) {
        setSyncServerHeads(heads);
        setSyncServerTimestamp(timestamp);
      }

      // update peer entry if it matches
      const idx = peers.findIndex((p) => p.storageId === storageId);
      if (idx >= 0) {
        const currentHeads = ownHeads();
        setPeers(idx, {
          heads,
          lastSyncTimestamp: timestamp,
          inSync: currentHeads ? A.equals(currentHeads, heads) : false,
        });
      } else {
        refreshPeers();
      }
    };

    h.on("change", onChange);
    h.on("remote-heads", onRemoteHeads);

    // initialize sync server from stored sync info
    const serverInfo = h.getSyncInfo(SYNC_SERVER_STORAGE_ID);
    if (serverInfo) {
      setSyncServerHeads(serverInfo.lastHeads);
      setSyncServerTimestamp(serverInfo.lastSyncTimestamp);
    }

    // build initial peer list
    refreshPeers();

    onCleanup(() => {
      h.off("change", onChange);
      h.off("remote-heads", onRemoteHeads);
    });
  });

  function refreshPeers() {
    const h = props.handle;
    const currentHeads = h.heads();
    const peerList: PeerSyncInfo[] = repo.peers.map((peerId) => {
      const storageId = repo.getStorageIdOfPeer(peerId);
      const syncInfo = storageId ? h.getSyncInfo(storageId) : undefined;
      return {
        id: peerId,
        name: peerName(peerId),
        storageId,
        heads: syncInfo?.lastHeads,
        lastSyncTimestamp: syncInfo?.lastSyncTimestamp,
        inSync:
          syncInfo?.lastHeads && currentHeads
            ? A.equals(currentHeads, syncInfo.lastHeads)
            : false,
      };
    });

    // add sync server as a virtual peer if it's not already
    // in the list (it won't be — the main thread doesn't talk
    // to it directly, the shared worker does)
    const hasSyncServer = peerList.some(
      (p) => p.storageId === SYNC_SERVER_STORAGE_ID
    );
    if (!hasSyncServer) {
      const serverInfo = props.handle.getSyncInfo(SYNC_SERVER_STORAGE_ID);
      peerList.unshift({
        id: "sync-server",
        name: "Sync Server",
        storageId: SYNC_SERVER_STORAGE_ID,
        heads: serverInfo?.lastHeads ?? syncServerHeads(),
        lastSyncTimestamp:
          serverInfo?.lastSyncTimestamp ?? syncServerTimestamp(),
        inSync:
          (serverInfo?.lastHeads ?? syncServerHeads()) && currentHeads
            ? A.equals(
                currentHeads,
                serverInfo?.lastHeads ?? syncServerHeads()!
              )
            : false,
      });
    }

    // sort: shared worker first, sync server last
    const peerOrder = (p: PeerSyncInfo) =>
      p.name === "Shared Worker" ? 0 : p.name === "Sync Server" ? 2 : 1;
    peerList.sort((a, b) => peerOrder(a) - peerOrder(b));
    let p = peerList;

    console.log("[sync-indicator] peers", peerList);
    if (!localStorage.debug && !localStorage.DEBUG) {
      p = p.filter((p) => p.name != "Shared Worker");
    }
    setPeers(reconcile(p));
  }

  // recompute inSync when own heads change
  createEffect(() => {
    const currentHeads = ownHeads();
    if (!currentHeads) return;
    for (let i = 0; i < peers.length; i++) {
      const peerHeads = peers[i].heads;
      const inSync = peerHeads ? A.equals(currentHeads, peerHeads) : false;
      if (peers[i].inSync !== inSync) {
        setPeers(i, "inSync", inSync);
      }
    }
  });

  // the icon is driven by sync server state specifically
  const syncServerInSync = () => {
    const server = syncServerHeads();
    const own = ownHeads();
    if (!server || !own) return false;
    return A.equals(own, server);
  };

  const syncServerKnown = () => !!syncServerHeads();

  const iconState = (): "synced" | "syncing" | "error" | "unknown" => {
    if (!isOnline()) return syncServerInSync() ? "synced" : "error";
    if (!syncServerKnown()) return "unknown";
    return syncServerInSync() ? "synced" : "syncing";
  };

  const statusText = () => {
    if (!isOnline()) return "Offline";
    if (syncServerInSync()) return "Synced to server";
    if (syncServerHeads()) return "Syncing...";
    return "Sync server status unknown";
  };

  const onCopy = async () => {
    const data = {
      ownHeads: ownHeads(),
      syncServer: {
        storageId: SYNC_SERVER_STORAGE_ID,
        heads: syncServerHeads(),
        lastSyncTimestamp: syncServerTimestamp(),
        inSync: syncServerInSync(),
      },
      peers: peers.map((p) => ({
        name: p.name,
        id: p.id,
        storageId: p.storageId,
        heads: p.heads,
        lastSyncTimestamp: p.lastSyncTimestamp,
        inSync: p.inSync,
      })),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      console.log("Copied sync state to clipboard", data);
    } catch (err) {
      console.error("Failed to copy sync state:", err);
    }
  };

  const relativeTime = (ts: number | undefined) => {
    void now();
    return ts ? getRelativeTimeString(ts) : "-";
  };

  const copyHeads = async (heads: UrlHeads | undefined) => {
    if (!heads) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(heads));
    } catch (err) {
      console.error("Failed to copy heads:", err);
    }
  };

  return (
    <Popover open={isPopoverOpen()} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger
        class={isOnline() ? "sync-trigger" : "sync-trigger-offline"}
      >
        <SyncIcon size={20} state={iconState()} />
      </PopoverTrigger>
      <PopoverContent>
        <div class="sync-popover-body">
          <div class="sync-status-header">{statusText()}</div>

          <div class="sync-peers">
            <div
              class="sync-peer sync-peer-clickable"
              onClick={() => copyHeads(ownHeads())}
            >
              <div class="sync-peer-header">
                <span class="sync-peer-name">Tab</span>
              </div>
              <div class="sync-peer-detail">
                heads:{" "}
                {JSON.stringify((ownHeads() ?? []).map((h) => h.slice(0, 6)))}
              </div>
            </div>

            <For each={peers}>
              {(peer) => (
                <>
                  <div
                    class="sync-peer sync-peer-clickable"
                    onClick={() => copyHeads(peer.heads)}
                  >
                    <div class="sync-peer-header">
                      <span class="sync-peer-name">{peer.name}</span>
                      <span class="sync-peer-status">
                        {peer.inSync
                          ? "synced"
                          : peer.heads
                            ? "behind"
                            : "unknown"}
                      </span>
                    </div>
                    <Show when={peer.heads}>
                      <div class="sync-peer-detail">
                        heads:{" "}
                        {JSON.stringify(peer.heads!.map((h) => h.slice(0, 6)))}
                      </div>
                    </Show>
                    <Show when={peer.lastSyncTimestamp}>
                      <div class="sync-peer-detail">
                        {relativeTime(peer.lastSyncTimestamp)}
                      </div>
                    </Show>
                  </div>
                </>
              )}
            </For>
          </div>

          <div class="sync-footer">
            <Button onClick={onCopy}>
              <CopyIcon size={14} />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
