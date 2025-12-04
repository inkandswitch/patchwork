import * as A from "@automerge/automerge";
import {
  type AutomergeUrl,
  DocHandle,
  type StorageId,
  type UrlHeads,
  type SyncInfo,
} from "@automerge/automerge-repo";
import { useDocHandle, useRepo } from "@automerge/automerge-repo-react-hooks";
import { useMachine } from "@xstate/react";
import { WifiIcon, WifiOffIcon, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createMachine, raise, stateIn } from "xstate";
import { useForceUpdate } from "./lib/hooks";
import { getRelativeTimeString } from "./lib/relative-time";
import { Button, Popover, PopoverTrigger, PopoverContent } from "./lib/ui";
import "./styles.css";

export const AUTOMERGE_SYNC_SERVER_STORAGE_ID = (import.meta.env
  ?.VITE_SYNC_SERVER_STORAGE_ID ??
  "3760df37-a4c6-4f66-9ecd-732039a9385d") as StorageId;

export const SyncIndicator = ({
  docUrl,
  storageId,
  name,
}: {
  docUrl: AutomergeUrl;
  storageId?: StorageId;
  name?: string;
}) => {
  const handle = useDocHandle(docUrl);
  if (!handle) {
    return null;
  }
  return (
    <SyncIndicatorInner
      key={handle.url}
      handle={handle}
      storageId={storageId}
      name={name}
    />
  );
};

// NOTE: this sync indicator component does *not* support changing the handle between renders.
// If you want to change the handle, you should re-mount the component.
const SyncIndicatorInner = ({
  handle,
  storageId = AUTOMERGE_SYNC_SERVER_STORAGE_ID,
  name,
}: {
  handle: DocHandle<unknown>;
  storageId?: StorageId;
  name?: string;
}) => {
  const {
    lastSyncUpdate,
    isInternetConnected,
    syncState,
    syncServerConnectionError,
    syncServerResponseError,
    syncServerHeads,
    ownHeads,
  } = useSyncIndicatorState(handle, storageId);
  const repo = useRepo();
  const isSynced = syncState === "InSync";
  const forceUpdate = useForceUpdate();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const prevHandle = useRef<DocHandle<unknown> | undefined>(undefined);

  // rerender every second to update the lastSyncUpdate only when popover is open
  useEffect(() => {
    if (!isPopoverOpen) return;

    const interval = setInterval(() => {
      forceUpdate();
    }, 1000);
    return () => clearInterval(interval);
  }, [forceUpdate, isPopoverOpen]);

  useEffect(() => {
    if (prevHandle.current && prevHandle.current.url !== handle.url) {
      console.warn(
        "Warning: do not change the handle between renders of SyncIndicator",
        {
          previous: prevHandle.current.url,
          current: handle.url,
        }
      );
    }
    prevHandle.current = handle;
  }, [handle]);

  const onCopySyncState = async () => {
    if (repo.peers.length !== 1) {
      throw new Error("tab is connected to multiple peers");
    }

    const ownStorageId = await repo.storageId();

    // TODO: JAH strict fix - lots of !s here

    const ownSyncState = await repo.storageSubsystem!.loadSyncState(
      handle.documentId,
      ownStorageId!
    );

    const syncServerSyncState = await repo.storageSubsystem!.loadSyncState(
      handle.documentId,
      storageId
    );

    const data = {
      syncServerHeads,
      self: {
        storageId: ownStorageId,
        heads: ownHeads,
        syncState: ownSyncState,
      },
      syncServer: {
        name,
        heads: syncServerHeads,
        storageId,
        syncState: syncServerSyncState,
      },
    };

    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(
      () => {
        console.log("Copied sync state to clipboard", data);
      },
      (err) => {
        console.error("Failed to copy sync state:", err);
      }
    );
  };

  const headsView = (
    <div className="mt-2 pt-2 border-t border-gray-300 relative">
      {name && (
        <div className="whitespace-nowrap flex">
          <dt className="font-bold inline mr-1">Name:</dt>
          <dd className="inline text-ellipsis shrink overflow-hidden min-w-0">
            {name}
          </dd>
        </div>
      )}

      <div className="flex justify-between">
        <div>
          <div className="whitespace-nowrap flex">
            <dt className="font-bold inline mr-1">Server heads:</dt>
            <dd className="text-ellipsis shrink overflow-hidden min-w-0 flex gap-1 items-center">
              {JSON.stringify(
                (syncServerHeads ?? []).map((part) => part.slice(0, 4))
              )}
            </dd>
          </div>
          <div className="whitespace-nowrap flex">
            <dt className="font-bold inline mr-1">Local heads:</dt>
            <dd className="text-ellipsis shrink overflow-hidden min-w-0 flex gap-1 items-center">
              {JSON.stringify((ownHeads ?? []).map((part) => part.slice(0, 4)))}
            </dd>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full"
          size="sm"
          onClick={onCopySyncState}
        >
          <Copy size={14} />
        </Button>
      </div>
    </div>
  );

  if (isInternetConnected) {
    if (!syncServerConnectionError && !syncServerResponseError) {
      return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger className=" p-1 rounded-md text-gray-500 hover:text-gray-900 align-top">
            <WifiIcon size={"20px"} />
          </PopoverTrigger>
          <PopoverContent className="flex flex-col gap-1.5 pb-2">
            <dl className="text-sm text-gray-600">
              <div>
                <dt className="font-bold inline mr-1">Connection:</dt>
                <dd className="inline">Connected to server</dd>
              </div>
              <div>
                <dt className="font-bold inline mr-1">Last synced:</dt>
                <dd className="inline">
                  {lastSyncUpdate ? getRelativeTimeString(lastSyncUpdate) : "-"}
                </dd>
              </div>
              <div>
                <dt className="font-bold inline mr-1">Sync status:</dt>
                <dd className="inline">
                  {isSynced ? "Up to date" : "Syncing..."}
                </dd>
              </div>
              {headsView}
            </dl>
          </PopoverContent>
        </Popover>
      );
    } else {
      return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger className="bg-red-50 border border-red-100 hover:bg-red-100 p-2 rounded-md">
            <div className="text-red-500 flex items-center text-sm">
              <WifiIcon
                size={"20px"}
                className={`inline-block ${isSynced ? "mr-[7px]" : ""}`}
              />
              {!isSynced && <div className="inline text-xs">*</div>}
            </div>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col gap-1.5 pb-2">
            <div className="mb-2 text-sm">
              <p>
                There was an unexpected error connecting to the sync server.
                Don't worry, your changes are saved locally.
              </p>
              <p className="mt-2">
                Please try reloading and see if that fixes the issue. If not,
                drop a note in the lab Discord with a screenshot.
              </p>
            </div>
            <dl className="text-sm text-gray-600">
              <div>
                <dt className="font-bold inline mr-1">Connection:</dt>
                <dd className="inline text-red-500">
                  {syncServerConnectionError
                    ? "Server not connected"
                    : "Server not responding"}
                </dd>
              </div>
              <div>
                <dt className="font-bold inline mr-1">Last synced:</dt>
                <dd className="inline">
                  {lastSyncUpdate ? getRelativeTimeString(lastSyncUpdate) : "-"}
                </dd>
              </div>
              <div>
                <dt className="font-bold inline mr-1">Sync status:</dt>
                <dd className="inline">
                  {syncState === "Unknown" ? (
                    "-"
                  ) : syncState === "InSync" ? (
                    "No unsynced changes"
                  ) : (
                    <span className="text-red-500">Unsynced changes (*)</span>
                  )}
                </dd>
                {headsView}
              </div>
            </dl>
          </PopoverContent>
        </Popover>
      );
    }
  } else {
    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger className="hover:bg-gray-100 p-2 rounded-md">
          <div className="text-gray-500">
            <WifiOffIcon
              size={"20px"}
              className={`inline-block ${isSynced ? "mr-[7px]" : ""}`}
            />
            {!isSynced && (
              <div className="inline text-xs font-bold text-red-600">*</div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <dl className="text-sm text-gray-600">
            <div>
              <dt className="font-bold inline mr-1">Connection:</dt>
              <dd className="inline">Offline</dd>
            </div>
            <div>
              <dt className="font-bold inline mr-1">Last synced:</dt>
              <dd className="inline">
                {lastSyncUpdate ? getRelativeTimeString(lastSyncUpdate) : "-"}
              </dd>
            </div>
            <div>
              <dt className="font-bold inline mr-1">Sync status:</dt>
              <dd className="inline">
                {syncState === "Unknown" ? (
                  "-"
                ) : isSynced ? (
                  "No unsynced changes"
                ) : (
                  <span className="text-red-500">
                    You have unsynced changes. They are saved locally and will
                    sync next time you have internet and you open the app.
                  </span>
                )}
              </dd>
            </div>
            {headsView}
          </dl>
        </PopoverContent>
      </Popover>
    );
  }
};

type SyncState = "InSync" | "OutOfSync" | "Unknown";

interface SyncIndicatorState {
  syncServerHeads: UrlHeads | undefined;
  ownHeads: UrlHeads | undefined;
  lastSyncUpdate?: number;
  isInternetConnected: boolean;
  syncState: SyncState;
  syncServerConnectionError: boolean;
  syncServerResponseError: boolean;
}

function useSyncIndicatorState(
  handle: DocHandle<unknown>,
  storageId: StorageId
): SyncIndicatorState {
  const [syncInfo, setSyncInfo] = useState<SyncInfo | undefined>();
  const [ownHeads, setOwnHeads] = useState<UrlHeads | undefined>();

  const [machineConfig] = useState(() =>
    getSyncIndicatorMachine({
      connectionInitTimeout: 2000,
      maxSyncMessageDelay: 1000,
      isInternetConnected: navigator.onLine,
      isSyncServerConnected: true,
    })
  );

  const [machine, send] = useMachine(machineConfig);

  // online / offline listener
  useEffect(() => {
    const onOnline = () => {
      send({ type: "INTERNET_CONNECTED" });
    };

    const onOffline = () => {
      send({ type: "INTERNET_DISCONNECTED" });
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [send]);

  // sync server connect / disconnect handling
  // todo: need reachability information for that

  // heads change listener
  useEffect(() => {
    if (machine.matches("sync.unknown")) {
      const syncInfo = handle.getSyncInfo(storageId);

      if (syncInfo) {
        setSyncInfo(syncInfo);
      }

      setOwnHeads(handle.heads());
    }

    const onChange = () => {
      const doc = handle.doc();
      if (doc) {
        setOwnHeads(handle.heads());
      }
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
      if (storageId === remoteStorageId) {
        /*        console.log("RECEIVED_SYNC_MESSAGE", {
          timestamp: timestamp ? getRelativeTimeString(timestamp) : "unknown",
          heads,
          storageId,
          remoteStorageId,
        }); */
        send({ type: "RECEIVED_SYNC_MESSAGE" });
        setSyncInfo({
          lastHeads: heads,
          lastSyncTimestamp: timestamp,
        });
      }
    };

    handle.on("change", onChange);
    handle.on("remote-heads", onRemoteHeads);

    return () => {
      handle.off("change", onChange);
      handle.off("remote-heads", onRemoteHeads);
    };
  }, [handle, machine, send, storageId]);

  useEffect(() => {
    if (!ownHeads || !syncInfo) {
      return;
    }

    if (A.equals(ownHeads, syncInfo.lastHeads)) {
      send({ type: "IS_IN_SYNC" });
    } else {
      send({ type: "IS_OUT_OF_SYNC" });
    }
  }, [ownHeads, send, syncInfo]);

  return {
    ownHeads,
    lastSyncUpdate: syncInfo?.lastSyncTimestamp,
    syncServerHeads: syncInfo?.lastHeads,
    isInternetConnected: machine.matches("internet.connected"),
    syncState: machine.matches("sync.unknown")
      ? "Unknown"
      : machine.matches("sync.inSync")
        ? "InSync"
        : "OutOfSync",

    // todo: add reachability check, currently this value will be always true
    syncServerConnectionError: machine.matches("syncServer.disconnected.error"),
    syncServerResponseError: machine.matches("sync.outOfSync.error"),
  };
}

interface SyncIndicatorMachineConfig {
  // the duration we wait for the sync server to respond in the unsynced state before we show an error
  // the timer starts once both internet.connected and sync.isOutOfSync become true
  connectionInitTimeout: number;

  // the duration we wait for the sync server to respond in the unsynced state before we show an error
  // the timer starts once both internet.connected and sync.isOutOfSync become true
  maxSyncMessageDelay: number;

  // initial internet connection state
  isInternetConnected?: boolean;

  // initial sync server connection state
  isSyncServerConnected?: boolean;

  // initial is sync state
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
                    // every time we re-enter the out of sync state the timeout gets reset
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
