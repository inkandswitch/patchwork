import * as A from "@automerge/automerge";
import {
  type AutomergeUrl,
  type DocHandle,
  type StorageId,
  type UrlHeads,
  type SyncInfo,
} from "@automerge/automerge-repo";
import {
  useDocHandle,
  useRepo,
  RepoContext,
} from "@automerge/automerge-repo-solid-primitives";
import {
  createSignal,
  createEffect,
  on,
  onCleanup,
  Show,
  type Accessor,
} from "solid-js";
import { createActor, type AnyStateMachine } from "xstate";
import { createMachine, raise, stateIn } from "xstate";
import { getRelativeTimeString } from "./lib/relative-time";
import { Button, Popover, PopoverTrigger, PopoverContent } from "./lib/ui";
import { SyncIcon } from "./SyncIcon";
import { CopyIcon } from "./CopyIcon";
import "./styles.css";

export const AUTOMERGE_SYNC_SERVER_STORAGE_ID = (import.meta.env
  ?.VITE_SYNC_SERVER_STORAGE_ID ??
  "3760df37-a4c6-4f66-9ecd-732039a9385d") as StorageId;

export { RepoContext };

export function SyncIndicator(props: {
  docUrl: AutomergeUrl;
  storageId?: StorageId;
  name?: string;
}) {
  const handle = useDocHandle<unknown>(() => props.docUrl);

  return (
    <Show when={handle()}>
      {(h) => (
        <SyncIndicatorInner
          handle={h()}
          storageId={props.storageId}
          name={props.name}
        />
      )}
    </Show>
  );
}

function SyncIndicatorInner(props: {
  handle: DocHandle<unknown>;
  storageId?: StorageId;
  name?: string;
}) {
  const repo = useRepo();
  const storageId = () =>
    props.storageId ?? AUTOMERGE_SYNC_SERVER_STORAGE_ID;

  const state = createSyncIndicatorState(
    () => props.handle,
    storageId
  );

  const [isPopoverOpen, setIsPopoverOpen] = createSignal(false);
  const [now, setNow] = createSignal(Date.now());

  // tick every second while popover is open
  createEffect(
    on(isPopoverOpen, (open) => {
      if (!open) return;
      const interval = setInterval(() => setNow(Date.now()), 1000);
      onCleanup(() => clearInterval(interval));
    })
  );

  const isSynced = () => state.syncState() === "InSync";

  const onCopySyncState = async () => {
    if (repo.peers.length !== 1) {
      throw new Error("tab is connected to multiple peers");
    }

    const ownStorageId = await repo.storageId();

    const ownSyncState = await repo.storageSubsystem!.loadSyncState(
      props.handle.documentId,
      ownStorageId!
    );

    const syncServerSyncState = await repo.storageSubsystem!.loadSyncState(
      props.handle.documentId,
      storageId()
    );

    const data = {
      syncServerHeads: state.syncServerHeads(),
      self: {
        storageId: ownStorageId,
        heads: state.ownHeads(),
        syncState: ownSyncState,
      },
      syncServer: {
        name: props.name,
        heads: state.syncServerHeads(),
        storageId: storageId(),
        syncState: syncServerSyncState,
      },
    };

    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(
      () => console.log("Copied sync state to clipboard", data),
      (err) => console.error("Failed to copy sync state:", err)
    );
  };

  // Force `now` to be read so relative times update
  const lastSyncString = () => {
    void now();
    const ts = state.lastSyncUpdate();
    return ts ? getRelativeTimeString(ts) : "-";
  };

  const headsView = () => (
    <div class="mt-2 pt-2 border-t border-gray-300 relative">
      <Show when={props.name}>
        <div class="whitespace-nowrap flex">
          <dt class="font-bold inline mr-1">Name:</dt>
          <dd class="inline text-ellipsis shrink overflow-hidden min-w-0">
            {props.name}
          </dd>
        </div>
      </Show>

      <div class="flex justify-between">
        <div>
          <div class="whitespace-nowrap flex">
            <dt class="font-bold inline mr-1">Server heads:</dt>
            <dd class="text-ellipsis shrink overflow-hidden min-w-0 flex gap-1 items-center">
              {JSON.stringify(
                (state.syncServerHeads() ?? []).map((part) => part.slice(0, 4))
              )}
            </dd>
          </div>
          <div class="whitespace-nowrap flex">
            <dt class="font-bold inline mr-1">Local heads:</dt>
            <dd class="text-ellipsis shrink overflow-hidden min-w-0 flex gap-1 items-center">
              {JSON.stringify(
                (state.ownHeads() ?? []).map((part) => part.slice(0, 4))
              )}
            </dd>
          </div>
        </div>
        <Button variant="ghost" class="w-full" size="sm" onClick={onCopySyncState}>
          <CopyIcon size={14} />
        </Button>
      </div>
    </div>
  );

  return (
    <Show
      when={state.isInternetConnected()}
      fallback={
        <Popover open={isPopoverOpen()} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger class="hover:bg-gray-100 p-2 rounded-md">
            <div class="text-gray-500">
              <SyncIcon size={20} alert={!isSynced()} />
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <dl class="text-sm text-gray-600">
              <div>
                <dt class="font-bold inline mr-1">Connection:</dt>
                <dd class="inline">Offline</dd>
              </div>
              <div>
                <dt class="font-bold inline mr-1">Last synced:</dt>
                <dd class="inline">{lastSyncString()}</dd>
              </div>
              <div>
                <dt class="font-bold inline mr-1">Sync status:</dt>
                <dd class="inline">
                  <Show
                    when={state.syncState() !== "Unknown"}
                    fallback="-"
                  >
                    <Show
                      when={!isSynced()}
                      fallback="No unsynced changes"
                    >
                      <span class="text-red-500">
                        You have unsynced changes. They are saved locally and
                        will sync next time you have internet and you open the
                        app.
                      </span>
                    </Show>
                  </Show>
                </dd>
              </div>
              {headsView()}
            </dl>
          </PopoverContent>
        </Popover>
      }
    >
      <Show
        when={
          !state.syncServerConnectionError() &&
          !state.syncServerResponseError()
        }
        fallback={
          <Popover open={isPopoverOpen()} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger class="bg-red-50 border border-red-100 hover:bg-red-100 p-2 rounded-md">
              <div class="text-red-500 flex items-center text-sm">
                <SyncIcon size={20} alert />
              </div>
            </PopoverTrigger>
            <PopoverContent class="flex flex-col gap-1.5 pb-2">
              <div class="mb-2 text-sm">
                <p>
                  There was an unexpected error connecting to the sync server.
                  Don't worry, your changes are saved locally.
                </p>
                <p class="mt-2">
                  Please try reloading and see if that fixes the issue. If not,
                  drop a note in the lab Discord with a screenshot.
                </p>
              </div>
              <dl class="text-sm text-gray-600">
                <div>
                  <dt class="font-bold inline mr-1">Connection:</dt>
                  <dd class="inline text-red-500">
                    {state.syncServerConnectionError()
                      ? "Server not connected"
                      : "Server not responding"}
                  </dd>
                </div>
                <div>
                  <dt class="font-bold inline mr-1">Last synced:</dt>
                  <dd class="inline">{lastSyncString()}</dd>
                </div>
                <div>
                  <dt class="font-bold inline mr-1">Sync status:</dt>
                  <dd class="inline">
                    <Show
                      when={state.syncState() !== "Unknown"}
                      fallback="-"
                    >
                      <Show
                        when={state.syncState() !== "InSync"}
                        fallback="No unsynced changes"
                      >
                        <span class="text-red-500">Unsynced changes (*)</span>
                      </Show>
                    </Show>
                  </dd>
                  {headsView()}
                </div>
              </dl>
            </PopoverContent>
          </Popover>
        }
      >
        <Popover open={isPopoverOpen()} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger class=" p-1 rounded-md text-gray-500 hover:text-gray-900 align-top">
            <SyncIcon size={20} />
          </PopoverTrigger>
          <PopoverContent class="flex flex-col gap-1.5 pb-2">
            <dl class="text-sm text-gray-600">
              <div>
                <dt class="font-bold inline mr-1">Connection:</dt>
                <dd class="inline">Connected to server</dd>
              </div>
              <div>
                <dt class="font-bold inline mr-1">Last synced:</dt>
                <dd class="inline">{lastSyncString()}</dd>
              </div>
              <div>
                <dt class="font-bold inline mr-1">Sync status:</dt>
                <dd class="inline">
                  {isSynced() ? "Up to date" : "Syncing..."}
                </dd>
              </div>
              {headsView()}
            </dl>
          </PopoverContent>
        </Popover>
      </Show>
    </Show>
  );
}

type SyncState = "InSync" | "OutOfSync" | "Unknown";

interface SyncIndicatorSignals {
  syncServerHeads: Accessor<UrlHeads | undefined>;
  ownHeads: Accessor<UrlHeads | undefined>;
  lastSyncUpdate: Accessor<number | undefined>;
  isInternetConnected: Accessor<boolean>;
  syncState: Accessor<SyncState>;
  syncServerConnectionError: Accessor<boolean>;
  syncServerResponseError: Accessor<boolean>;
}

function useMachine(machine: AnyStateMachine) {
  const actor = createActor(machine);
  const [snapshot, setSnapshot] = createSignal(actor.getSnapshot());
  actor.subscribe((s) => setSnapshot(s));
  actor.start();
  onCleanup(() => actor.stop());
  return [snapshot, actor.send] as const;
}

function createSyncIndicatorState(
  handle: Accessor<DocHandle<unknown>>,
  storageId: Accessor<StorageId>
): SyncIndicatorSignals {
  const [syncInfo, setSyncInfo] = createSignal<SyncInfo | undefined>();
  const [ownHeads, setOwnHeads] = createSignal<UrlHeads | undefined>();

  const machineConfig = getSyncIndicatorMachine({
    connectionInitTimeout: 2000,
    maxSyncMessageDelay: 1000,
    isInternetConnected: navigator.onLine,
    isSyncServerConnected: true,
  });

  const [snapshot, send] = useMachine(machineConfig);

  // online / offline listener
  {
    const onOnline = () => send({ type: "INTERNET_CONNECTED" });
    const onOffline = () => send({ type: "INTERNET_DISCONNECTED" });
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    onCleanup(() => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    });
  }

  // heads change listener
  createEffect(
    on([handle, storageId], ([h, sid]) => {
      if (snapshot().matches("sync.unknown")) {
        const info = h.getSyncInfo(sid);
        if (info) setSyncInfo(info);
        setOwnHeads(h.heads());
      }

      const onChange = () => {
        if (h.doc()) setOwnHeads(h.heads());
      };

      const onRemoteHeads = ({
        storageId: remoteStorageId,
        heads,
        timestamp,
      }: {
        storageId: StorageId;
        heads: UrlHeads;
        timestamp: number;
      }) => {
        if (sid === remoteStorageId) {
          send({ type: "RECEIVED_SYNC_MESSAGE" });
          setSyncInfo({ lastHeads: heads, lastSyncTimestamp: timestamp });
        }
      };

      h.on("change", onChange);
      h.on("remote-heads", onRemoteHeads);

      onCleanup(() => {
        h.off("change", onChange);
        h.off("remote-heads", onRemoteHeads);
      });
    })
  );

  // sync check
  createEffect(() => {
    const heads = ownHeads();
    const info = syncInfo();
    if (!heads || !info) return;

    if (A.equals(heads, info.lastHeads)) {
      send({ type: "IS_IN_SYNC" });
    } else {
      send({ type: "IS_OUT_OF_SYNC" });
    }
  });

  return {
    ownHeads,
    lastSyncUpdate: () => syncInfo()?.lastSyncTimestamp,
    syncServerHeads: () => syncInfo()?.lastHeads,
    isInternetConnected: () => snapshot().matches("internet.connected"),
    syncState: () =>
      snapshot().matches("sync.unknown")
        ? "Unknown"
        : snapshot().matches("sync.inSync")
          ? "InSync"
          : "OutOfSync",
    syncServerConnectionError: () =>
      snapshot().matches("syncServer.disconnected.error"),
    syncServerResponseError: () =>
      snapshot().matches("sync.outOfSync.error"),
  };
}

interface SyncIndicatorMachineConfig {
  connectionInitTimeout: number;
  maxSyncMessageDelay: number;
  isInternetConnected?: boolean;
  isSyncServerConnected?: boolean;
  isInSync?: boolean;
}

export function getSyncIndicatorMachine({
  connectionInitTimeout,
  maxSyncMessageDelay,
  isInternetConnected = false,
  isSyncServerConnected = false,
}: SyncIndicatorMachineConfig) {
  return createMachine(
    {
      id: "syncIndicator",
      type: "parallel",
      states: {
        internet: {
          initial: isInternetConnected ? "connected" : "disconnected",
          states: {
            connected: {
              after: {
                [connectionInitTimeout]: {
                  actions: "connectionInitTimeout",
                },
              },
              on: {
                INTERNET_DISCONNECTED: "disconnected",
              },
            },
            disconnected: {
              on: {
                INTERNET_CONNECTED: "connected",
              },
            },
          },
        },
        sync: {
          initial: "unknown",
          states: {
            unknown: {
              on: {
                IS_OUT_OF_SYNC: "outOfSync",
                IS_IN_SYNC: "inSync",
              },
            },
            inSync: {
              on: {
                IS_OUT_OF_SYNC: "outOfSync",
              },
            },
            outOfSync: {
              initial: "ok",
              on: {
                IS_IN_SYNC: "inSync",
                RECEIVED_SYNC_MESSAGE: "outOfSync",
                CONNECTION_INIT_TIMEOUT: "outOfSync",
              },
              states: {
                ok: {
                  after: {
                    [maxSyncMessageDelay]: {
                      target: "error",
                      guard: stateIn({ internet: "connected" }),
                    },
                  },
                },
                error: {},
              },
            },
          },
        },
        syncServer: {
          initial: isSyncServerConnected ? "connected" : "disconnected",
          states: {
            connected: {
              on: {
                SYNC_SERVER_DISCONNECTED: "disconnected.error",
              },
            },
            disconnected: {
              initial: "ok",
              on: {
                SYNC_SERVER_CONNECTED: "connected",
                CONNECTION_INIT_TIMEOUT: ".error",
              },
              states: {
                ok: {},
                error: {},
              },
            },
          },
        },
      },
    },
    {
      actions: {
        connectionInitTimeout: raise({ type: "CONNECTION_INIT_TIMEOUT" }),
      },
    }
  );
}
