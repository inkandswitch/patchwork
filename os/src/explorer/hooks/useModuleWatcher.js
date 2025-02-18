import { jsx as _jsx } from "react/jsx-runtime";
import { ModuleWatcher } from "@patchwork/sdk";
import { createContext, useContext, useRef, useEffect } from "react";
import { BUNDLED_MODULES } from "../../bundledPackages";
class ModuleWatcherManager {
    _watcher = null;
    constructor(account, repo) {
        const moduleSettingsUrl = account.handle.doc()?.moduleSettingsUrl;
        if (moduleSettingsUrl) {
            this._watcher = new ModuleWatcher(moduleSettingsUrl, BUNDLED_MODULES, repo);
        }
    }
    async initialize() {
        if (this._watcher) {
            await Promise.race([
                this._watcher.doneLoading,
                new Promise((r) => setTimeout(r, 1000)),
            ]).catch(() => console.warn("Tool load timed out; hopefully they'll arrive later."));
        }
    }
    get watcher() {
        return this._watcher;
    }
}
// Create the context with the defined type
const ModuleWatcherContext = createContext(null);
export function ModuleWatcherProvider({ account, repo, children, }) {
    const managerRef = useRef(new ModuleWatcherManager(account, repo));
    useEffect(() => {
        if (managerRef.current === null) {
            const manager = new ModuleWatcherManager(account, repo);
            managerRef.current = manager;
            // Initialize asynchronously
            manager.initialize().catch(console.error);
        }
    }, [account, repo]);
    return (_jsx(ModuleWatcherContext.Provider, { value: managerRef.current, children: children }));
}
export function useModuleWatcher() {
    const context = useContext(ModuleWatcherContext);
    if (context === null) {
        throw new Error("useModuleWatcher must be used within a ModuleWatcherProvider");
    }
    return context;
}
