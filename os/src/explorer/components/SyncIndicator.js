import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// TODO move these utils
import { getRelativeTimeString } from "@patchwork/sdk/versionControl";
import { next as A } from "@automerge/automerge";
import { useDocHandle, useRepo } from "@automerge/automerge-repo-react-hooks";
import { Button, Popover, PopoverContent, PopoverTrigger, } from "@patchwork/sdk/ui";
import { useMachine } from "@xstate/react";
import { WifiIcon, WifiOffIcon, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createMachine, raise, stateIn } from "xstate";
export const AUTOMERGE_SYNC_SERVER_STORAGE_ID = (import.meta.env
    ?.VITE_SYNC_SERVER_STORAGE_ID ??
    "3760df37-a4c6-4f66-9ecd-732039a9385d");
export const SyncIndicator = ({ docUrl, storageId, name, }) => {
    const handle = useDocHandle(docUrl);
    if (!handle) {
        return null;
    }
    return (_jsx(SyncIndicatorInner, { handle: handle, storageId: storageId, name: name }, handle.url));
};
// NOTE: this sync indicator component does *not* support changing the handle between renders.
// If you want to change the handle, you should re-mount the component.
const SyncIndicatorInner = ({ handle, storageId = AUTOMERGE_SYNC_SERVER_STORAGE_ID, name, }) => {
    const { lastSyncUpdate, isInternetConnected, syncState, syncServerConnectionError, syncServerResponseError, syncServerHeads, ownHeads, } = useSyncIndicatorState(handle, storageId);
    const repo = useRepo();
    const isSynced = syncState === SyncState.InSync;
    const prevHandle = useRef(undefined);
    useEffect(() => {
        if (prevHandle.current && prevHandle.current.url !== handle.url) {
            console.warn("Warning: do not change the handle between renders of SyncIndicator", {
                previous: prevHandle.current.url,
                current: handle.url,
            });
        }
        prevHandle.current = handle;
    }, [handle]);
    const onCopySyncState = async () => {
        if (repo.peers.length !== 1) {
            throw new Error("tab is connected to multiple peers");
        }
        const ownStorageId = await repo.storageId();
        // TODO: JAH strict fix - lots of !s here
        const ownSyncState = await repo.storageSubsystem.loadSyncState(handle.documentId, ownStorageId);
        const syncServerSyncState = await repo.storageSubsystem.loadSyncState(handle.documentId, storageId);
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
        navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
            console.log("Copied sync state to clipboard", data);
        }, (err) => {
            console.error("Failed to copy sync state:", err);
        });
    };
    const headsView = (_jsxs("div", { className: "mt-2 pt-2 border-t border-gray-300 relative", children: [name && (_jsxs("div", { className: "whitespace-nowrap flex", children: [_jsx("dt", { className: "font-bold inline mr-1", children: "Name:" }), _jsx("dd", { className: "inline text-ellipsis flex-shrink overflow-hidden min-w-0", children: name })] })), _jsxs("div", { className: "whitespace-nowrap flex", children: [_jsx("dt", { className: "font-bold inline mr-1", children: "Server heads:" }), _jsx("dd", { className: "inline text-ellipsis flex-shrink overflow-hidden min-w-0", children: JSON.stringify((syncServerHeads ?? []).map((part) => part.slice(0, 4))) })] }), _jsxs("div", { className: "whitespace-nowrap flex", children: [_jsx("dt", { className: "font-bold inline mr-1", children: "Local heads:" }), _jsx("dd", { className: "inline text-ellipsis flex-shrink overflow-hidden min-w-0", children: JSON.stringify((ownHeads ?? []).map((part) => part.slice(0, 4))) })] }), _jsx("div", { className: "absolute right-0 top-2 flex items-center justify-center", children: _jsx(Button, { variant: "ghost", className: "w-full", size: "sm", onClick: onCopySyncState, children: _jsx(Copy, { size: 14 }) }) })] }));
    if (isInternetConnected) {
        if (!syncServerConnectionError && !syncServerResponseError) {
            return (_jsxs(Popover, { children: [_jsx(PopoverTrigger, { className: " p-1 rounded-md text-gray-500 hover:text-gray-900 align-top", children: _jsx(WifiIcon, { size: "20px" }) }), _jsx(PopoverContent, { className: "flex flex-col gap-1.5 pb-2", children: _jsxs("dl", { className: "text-sm text-gray-600", children: [_jsxs("div", { children: [_jsx("dt", { className: "font-bold inline mr-1", children: "Connection:" }), _jsx("dd", { className: "inline", children: "Connected to server" })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-bold inline mr-1", children: "Last synced:" }), _jsx("dd", { className: "inline", children: lastSyncUpdate ? getRelativeTimeString(lastSyncUpdate) : "-" })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-bold inline mr-1", children: "Sync status:" }), _jsx("dd", { className: "inline", children: isSynced ? "Up to date" : "Syncing..." })] }), headsView] }) })] }));
        }
        else {
            return (_jsxs(Popover, { children: [_jsx(PopoverTrigger, { className: "bg-red-50 border border-red-100 hover:bg-red-100 p-2 rounded-md", children: _jsxs("div", { className: "text-red-500 flex items-center text-sm", children: [_jsx(WifiIcon, { size: "20px", className: `inline-block ${isSynced ? "mr-[7px]" : ""}` }), !isSynced && _jsx("div", { className: "inline text-xs", children: "*" })] }) }), _jsxs(PopoverContent, { className: "flex flex-col gap-1.5 pb-2", children: [_jsxs("div", { className: "mb-2 text-sm", children: [_jsx("p", { children: "There was an unexpected error connecting to the sync server. Don't worry, your changes are saved locally." }), _jsx("p", { className: "mt-2", children: "Please try reloading and see if that fixes the issue. If not, drop a note in the lab Discord with a screenshot." })] }), _jsxs("dl", { className: "text-sm text-gray-600", children: [_jsxs("div", { children: [_jsx("dt", { className: "font-bold inline mr-1", children: "Connection:" }), _jsx("dd", { className: "inline text-red-500", children: syncServerConnectionError
                                                    ? "Server not connected"
                                                    : "Server not responding" })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-bold inline mr-1", children: "Last synced:" }), _jsx("dd", { className: "inline", children: lastSyncUpdate ? getRelativeTimeString(lastSyncUpdate) : "-" })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-bold inline mr-1", children: "Sync status:" }), _jsx("dd", { className: "inline", children: syncState === SyncState.Unknown ? ("-") : syncState === SyncState.InSync ? ("No unsynced changes") : (_jsx("span", { className: "text-red-500", children: "Unsynced changes (*)" })) }), headsView] })] })] })] }));
        }
    }
    else {
        return (_jsxs(Popover, { children: [_jsx(PopoverTrigger, { className: "hover:bg-gray-100 p-2 rounded-md", children: _jsxs("div", { className: "text-gray-500", children: [_jsx(WifiOffIcon, { size: "20px", className: `inline-block ${isSynced ? "mr-[7px]" : ""}` }), !isSynced && (_jsx("div", { className: "inline text-xs font-bold text-red-600", children: "*" }))] }) }), _jsx(PopoverContent, { children: _jsxs("dl", { className: "text-sm text-gray-600", children: [_jsxs("div", { children: [_jsx("dt", { className: "font-bold inline mr-1", children: "Connection:" }), _jsx("dd", { className: "inline", children: "Offline" })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-bold inline mr-1", children: "Last synced:" }), _jsx("dd", { className: "inline", children: lastSyncUpdate ? getRelativeTimeString(lastSyncUpdate) : "-" })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-bold inline mr-1", children: "Sync status:" }), _jsx("dd", { className: "inline", children: syncState === SyncState.Unknown ? ("-") : isSynced ? ("No unsynced changes") : (_jsx("span", { className: "text-red-500", children: "You have unsynced changes. They are saved locally and will sync next time you have internet and you open the app." })) })] }), headsView] }) })] }));
    }
};
var SyncState;
(function (SyncState) {
    SyncState[SyncState["InSync"] = 0] = "InSync";
    SyncState[SyncState["OutOfSync"] = 1] = "OutOfSync";
    SyncState[SyncState["Unknown"] = 2] = "Unknown";
})(SyncState || (SyncState = {}));
function useSyncIndicatorState(handle, storageId) {
    const repo = useRepo();
    const [lastSyncUpdate, setLastSyncUpdate] = useState(); // todo: should load that from persisted sync state
    const [syncServerHeads, setSyncServerHeads] = useState();
    const [ownHeads, setOwnHeads] = useState();
    useEffect(() => {
        // hack: since we have two sync indictators we hard code the storage ids here
        // otherwise one of the subscriptions would win, since subscribe unsubscribes any existing storageIds that are not in the list
        // maybe we should reconsider this api
        // todo: remove this once we got rid of the duplicte
        repo.subscribeToRemotes([AUTOMERGE_SYNC_SERVER_STORAGE_ID]);
    }, [repo]);
    const [machineConfig] = useState(() => getSyncIndicatorMachine({
        connectionInitTimeout: 2000,
        maxSyncMessageDelay: 1000,
        isInternetConnected: navigator.onLine,
        isSyncServerConnected: true,
    }));
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
            const syncServerHeads = handle.getRemoteHeads(storageId);
            setSyncServerHeads(syncServerHeads ?? []); // initialize to empty heads if we have no state
            setOwnHeads(A.getHeads(handle.doc()));
        }
        const onChange = () => {
            const doc = handle.doc();
            if (doc) {
                setOwnHeads(A.getHeads(doc));
            }
        };
        const onRemoteHeads = ({ storageId: remoteStorageId, heads, }) => {
            if (storageId === remoteStorageId) {
                send({ type: "RECEIVED_SYNC_MESSAGE" });
                setSyncServerHeads(heads);
                setLastSyncUpdate(Date.now());
            }
        };
        handle.on("change", onChange);
        handle.on("remote-heads", onRemoteHeads);
        return () => {
            handle.off("change", onChange);
            handle.off("remote-heads", onRemoteHeads);
        };
    }, [handle]);
    useEffect(() => {
        if (!ownHeads || !syncServerHeads) {
            return;
        }
        if (A.equals(ownHeads, syncServerHeads)) {
            send({ type: "IS_IN_SYNC" });
        }
        else {
            send({ type: "IS_OUT_OF_SYNC" });
        }
    }, [ownHeads, syncServerHeads]);
    return {
        ownHeads,
        syncServerHeads,
        lastSyncUpdate,
        isInternetConnected: machine.matches("internet.connected"),
        syncState: machine.matches("sync.unknown")
            ? SyncState.Unknown
            : machine.matches("sync.inSync")
                ? SyncState.InSync
                : SyncState.OutOfSync,
        // todo: add reachability check, currently this value will be always true
        syncServerConnectionError: machine.matches("syncServer.disconnected.error"),
        syncServerResponseError: machine.matches("sync.outOfSync.error"),
    };
}
export function getSyncIndicatorMachine({ connectionInitTimeout, maxSyncMessageDelay, isInternetConnected = false, isSyncServerConnected = false, }) {
    return createMachine({
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
    }, {
        actions: {
            connectionInitTimeout: raise({ type: "CONNECTION_INIT_TIMEOUT" }),
        },
    });
}
