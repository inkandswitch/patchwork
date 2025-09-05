import { ModuleWatcher } from "@patchwork/sdk";
import React, { createContext, useContext, useRef, useEffect } from "react";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";

class ModuleWatcherManager {
  private _watcher: ModuleWatcher | null = null;

  constructor(moduleSettingsUrl: AutomergeUrl, repo: Repo) {
    if (moduleSettingsUrl) {
      this._watcher = new ModuleWatcher(
        moduleSettingsUrl,
        [], // nothing bundled in this build
        repo
      );
    }
  }

  async initialize(): Promise<void> {
    if (this._watcher) {
      await Promise.race([
        this._watcher.doneLoading,
        new Promise((r) => setTimeout(r, 1000)),
      ]).catch(() =>
        console.warn("Tool load timed out; hopefully they'll arrive later.")
      );
    }
  }

  get watcher(): ModuleWatcher | null {
    return this._watcher;
  }
}

// Create the context with the defined type
const ModuleWatcherContext = createContext<ModuleWatcherManager | null>(null);

interface ModuleWatcherProviderProps {
  moduleSettingsUrl: AutomergeUrl;
  repo: Repo;
  children: React.ReactNode;
}

export function ModuleWatcherProvider({
  moduleSettingsUrl,
  repo,
  children,
}: ModuleWatcherProviderProps) {
  const managerRef = useRef<ModuleWatcherManager | null>(
    new ModuleWatcherManager(moduleSettingsUrl, repo)
  );

  useEffect(() => {
    if (managerRef.current === null) {
      const manager = new ModuleWatcherManager(moduleSettingsUrl, repo);
      managerRef.current = manager;
      // Initialize asynchronously
      manager.initialize().catch(console.error);
    }

    // Expose ModuleWatcher globally for web components
    if (managerRef.current?.watcher) {
      (window as any).moduleWatcher = managerRef.current.watcher;
    }
  }, [moduleSettingsUrl, repo]);

  return (
    <ModuleWatcherContext.Provider value={managerRef.current}>
      {children}
    </ModuleWatcherContext.Provider>
  );
}

export function useModuleWatcher(): ModuleWatcher | null {
  const context = useContext(ModuleWatcherContext);
  if (context === null) {
    throw new Error(
      "useModuleWatcher must be used within a ModuleWatcherProvider"
    );
  }
  return context.watcher;
}
