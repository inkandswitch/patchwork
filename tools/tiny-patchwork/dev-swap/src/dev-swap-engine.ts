import {
  type AutomergeUrl,
  type DocHandle,
  type Repo,
  isValidAutomergeUrl,
} from "@automerge/automerge-repo";
import {
  getRegistry,
  registerPlugins,
  unregisterPlugins,
} from "@inkandswitch/patchwork-plugins";
import type { FolderDoc } from "@inkandswitch/patchwork-filesystem";
import { importModuleFromFolderDocUrl } from "@inkandswitch/patchwork-filesystem";

const DEV_SWAPS_KEY = "tinyPatchworkDevSwaps";

export type DevSwapEntry = {
  // Layout doc field that was swapped, or "" for direct registry overrides.
  field: string;
  originalToolId: string;
  devToolId: string;
  // For registry overrides (field === ""): the production plugin's importUrl
  // so we can re-import and restore it on unswap.
  originalImportUrl?: string;
};

export type DevSwapRecord = {
  devUrl: AutomergeUrl;
  entries: DevSwapEntry[];
  swapped: boolean;
};

export type DevSwapState = Record<string, DevSwapRecord>;

type LayoutDoc = {
  frameToolId: string;
  accountSidebarToolId: string;
  contextSidebarToolId: string;
  contextToolIds: string[];
  documentToolbarToolIds: string[];
  moduleSettingsUrl: AutomergeUrl;
};

const SINGLE_FIELDS = [
  "frameToolId",
  "accountSidebarToolId",
  "contextSidebarToolId",
] as const;

const ARRAY_FIELDS = ["contextToolIds", "documentToolbarToolIds"] as const;

function findToolField(
  doc: LayoutDoc,
  toolId: string
): { field: string; isArray: boolean; index?: number } | null {
  for (const field of SINGLE_FIELDS) {
    if (doc[field] === toolId) return { field, isArray: false };
  }
  for (const field of ARRAY_FIELDS) {
    const index = doc[field].indexOf(toolId);
    if (index !== -1) return { field, isArray: true, index };
  }
  return null;
}

// Clone a plugin with a -dev suffix. Idempotent: strips any existing -dev
// before appending. Cloning avoids mutating cached import() objects.
const patchDevId = (p: any) => ({
  ...p,
  id: p.id.replace(/-dev$/, "") + "-dev",
});

export function loadDevSwaps(): DevSwapState {
  try {
    return JSON.parse(localStorage.getItem(DEV_SWAPS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveDevSwaps(swaps: DevSwapState) {
  localStorage.setItem(DEV_SWAPS_KEY, JSON.stringify(swaps));
}

// Force patchwork-view elements showing a tool to teardown and reinit.
// Used after registry overrides where the "registered" event alone
// doesn't trigger re-render for already-loaded plugins.
function refreshViewsForTool(toolId: string) {
  const views = document.querySelectorAll(
    `patchwork-view[tool-id="${toolId}"]`
  );
  for (const view of views) {
    view.removeAttribute("tool-id");
    view.setAttribute("tool-id", toolId);
  }
}

// Active folder doc watchers for hot reload, keyed by devUrl
const watchers = new Map<string, () => void>();

// Production plugin objects saved before override, keyed by original tool ID.
// Used to restore on unswap without re-importing.
const savedProductionPlugins = new Map<string, any>();

async function loadAndRegisterDevModule(
  repo: Repo,
  devUrl: AutomergeUrl
): Promise<string[]> {
  // Use a versioned URL to bypass ES module cache
  const handle = await repo.find<FolderDoc>(devUrl);
  const versionedUrl = handle.view(handle.heads()).url;
  const mod = await importModuleFromFolderDocUrl(versionedUrl);
  if (!Array.isArray(mod.plugins)) {
    throw new Error("Module does not export a plugins array");
  }

  const devPlugins = mod.plugins.map(patchDevId);
  registerPlugins(devPlugins, devUrl);

  return devPlugins.map((p: any) => p.id as string);
}

function setupHotReload(
  repo: Repo,
  devUrl: AutomergeUrl,
  accountDocHandle: DocHandle<LayoutDoc>,
  onReload?: () => void
) {
  // Clean up existing watcher
  watchers.get(devUrl)?.();

  repo.find<FolderDoc>(devUrl).then((handle) => {
    let previousSyncAt = handle.doc()?.lastSyncAt || 0;

    const onChange = async () => {
      const lastSyncAt = handle.doc()?.lastSyncAt || 0;
      if (lastSyncAt <= previousSyncAt) return;
      previousSyncAt = lastSyncAt;

      console.log(`[dev-swap] Hot reloading ${devUrl}`);
      try {
        unregisterPlugins(devUrl);
        await loadAndRegisterDevModule(repo, devUrl);
        onReload?.();
      } catch (e) {
        console.error("[dev-swap] Hot reload failed:", e);
      }
    };

    handle.on("change", onChange);
    watchers.set(devUrl, () => handle.off("change", onChange));
  });
}

export async function devSwap(
  repo: Repo,
  accountDocHandle: DocHandle<LayoutDoc>,
  devUrl: AutomergeUrl,
  onReload?: () => void
): Promise<DevSwapState> {
  if (!isValidAutomergeUrl(devUrl)) throw new Error("Invalid Automerge URL");

  const devToolIds = await loadAndRegisterDevModule(repo, devUrl);

  const swaps = loadDevSwaps();
  const existingByOriginalId = new Map(
    Object.entries(swaps).flatMap(([url, record]) =>
      record.entries.map(
        (entry) =>
          [entry.originalToolId, { devUrl: url, entry }] as const
      )
    )
  );

  const doc = accountDocHandle.doc();
  const entries: DevSwapEntry[] = [];

  // Three cases per dev tool ID:
  // 1. A different devUrl already swapped this tool. Clean up the old swap.
  // 2. Same devUrl re-swap (after unswap). Reuse the saved field mapping.
  // 3. Fresh swap. Look up which account doc field holds the original tool.
  for (const devToolId of devToolIds) {
    const originalId = devToolId.replace(/-dev$/, "");
    const existing = existingByOriginalId.get(originalId);

    if (existing) {
      entries.push({
        field: existing.entry.field,
        originalToolId: originalId,
        devToolId,
      });
      if (existing.devUrl !== devUrl) {
        // Case 1: different devUrl. Clean up old swap.
        const oldRecord = swaps[existing.devUrl];
        if (oldRecord) {
          oldRecord.entries = oldRecord.entries.filter(
            (e) => e.originalToolId !== originalId
          );
          if (oldRecord.entries.length === 0) {
            unregisterPlugins(existing.devUrl);
            watchers.get(existing.devUrl)?.();
            watchers.delete(existing.devUrl);
            delete swaps[existing.devUrl];
          }
        }
      } else {
        // Case 2: same URL re-swap. Remove old record, replaced below.
        delete swaps[existing.devUrl];
      }
    } else {
      // Case 3: fresh swap. Find the field holding the original (or dev) tool ID.
      const match =
        findToolField(doc, originalId) || findToolField(doc, devToolId);
      if (match) {
        entries.push({
          field: match.field,
          originalToolId: originalId,
          devToolId,
        });
      } else {
        // Case 4: tool not in layout doc: direct registry override.
        // Save the production importUrl so we can restore on unswap.
        const registry = getRegistry("patchwork:tool");
        const prodPlugin = registry.get(originalId);
        entries.push({
          field: "",
          originalToolId: originalId,
          devToolId,
          originalImportUrl: prodPlugin?.importUrl,
        });
      }
    }
  }

  const fieldEntries = entries.filter((e) => e.field);
  const overrideEntries = entries.filter((e) => !e.field);

  // Swap account doc fields for tools referenced in the layout doc.
  if (fieldEntries.length > 0) {
    accountDocHandle.change((d) => {
      for (const entry of fieldEntries) {
        const current = (d as any)[entry.field];
        if (Array.isArray(current)) {
          const previousDevToolId =
            existingByOriginalId.get(entry.originalToolId)?.entry.devToolId;
          let idx = current.indexOf(entry.originalToolId);
          if (idx === -1 && previousDevToolId) {
            idx = current.indexOf(previousDevToolId);
          }
          if (idx !== -1) current[idx] = entry.devToolId;
        } else {
          (d as any)[entry.field] = entry.devToolId;
        }
      }
    });
  }

  // For tools not in the layout doc, register the dev version under the
  // original ID so any patchwork-view loading it gets the dev code.
  // Save the production plugin first so we can restore on unswap.
  for (const entry of overrideEntries) {
    const registry = getRegistry("patchwork:tool");
    if (!savedProductionPlugins.has(entry.originalToolId)) {
      const prodPlugin = registry.get(entry.originalToolId);
      if (prodPlugin) {
        savedProductionPlugins.set(entry.originalToolId, prodPlugin);
      }
    }
    const devPlugin = registry.get(entry.devToolId);
    if (devPlugin) {
      registerPlugins([{ ...devPlugin, id: entry.originalToolId }], devUrl);
      refreshViewsForTool(entry.originalToolId);
      console.log(
        `[dev-swap] Overrode "${entry.originalToolId}" with dev version`
      );
    }
  }

  swaps[devUrl] = { devUrl, entries, swapped: true };
  saveDevSwaps(swaps);

  setupHotReload(repo, devUrl, accountDocHandle, onReload);

  for (const entry of fieldEntries) {
    console.log(
      `[dev-swap] Swapped "${entry.originalToolId}" -> "${entry.devToolId}" in ${entry.field}`
    );
  }

  return swaps;
}

export async function devUnswap(
  accountDocHandle: DocHandle<LayoutDoc>,
  devUrl: AutomergeUrl
): Promise<DevSwapState> {
  if (!isValidAutomergeUrl(devUrl)) throw new Error("Invalid Automerge URL");

  const swaps = loadDevSwaps();
  const record = swaps[devUrl];
  if (!record) {
    throw new Error(`No dev swap found for "${devUrl}"`);
  }

  const fieldEntries = record.entries.filter((e) => e.field);
  const overrideEntries = record.entries.filter((e) => !e.field);

  // Restore layout doc fields to original tool IDs.
  if (fieldEntries.length > 0) {
    accountDocHandle.change((d) => {
      for (const entry of fieldEntries) {
        const current = (d as any)[entry.field];
        if (Array.isArray(current)) {
          const idx = current.indexOf(entry.devToolId);
          if (idx !== -1) current[idx] = entry.originalToolId;
        } else if (current === entry.devToolId) {
          (d as any)[entry.field] = entry.originalToolId;
        }
      }
    });
  }

  // Restore production plugins for registry overrides.
  for (const entry of overrideEntries) {
    const saved = savedProductionPlugins.get(entry.originalToolId);
    if (saved) {
      const registry = getRegistry("patchwork:tool");
      registry.register(saved, saved.importUrl);
      console.log(
        `[dev-swap] Restored production "${entry.originalToolId}"`
      );
    } else {
      console.warn(
        `[dev-swap] No saved production plugin for "${entry.originalToolId}", refresh to restore`
      );
    }
    // Force any patchwork-view showing this tool to reinit with the
    // restored plugin. The registry "registered" event alone doesn't
    // trigger re-render for already-loaded plugins.
    refreshViewsForTool(entry.originalToolId);
  }

  watchers.get(devUrl)?.();
  watchers.delete(devUrl);

  // Keep record but mark as unswapped so it can be re-swapped later
  record.swapped = false;
  saveDevSwaps(swaps);

  for (const entry of record.entries) {
    console.log(`[dev-swap] Unswapped "${entry.devToolId}"`);
  }

  return swaps;
}

export async function devRemove(
  accountDocHandle: DocHandle<LayoutDoc>,
  devUrl: AutomergeUrl
): Promise<DevSwapState> {
  if (!isValidAutomergeUrl(devUrl)) throw new Error("Invalid Automerge URL");

  let swaps = loadDevSwaps();
  const record = swaps[devUrl];
  if (!record) {
    throw new Error(`No dev swap found for "${devUrl}"`);
  }

  if (record.swapped) {
    await devUnswap(accountDocHandle, devUrl);
  }

  swaps = loadDevSwaps();
  delete swaps[devUrl];
  saveDevSwaps(swaps);

  for (const entry of record.entries) {
    console.log(`[dev-swap] Removed "${entry.devToolId}" in ${entry.field}`);
  }

  return swaps;
}

export async function restoreDevSwaps(
  repo: Repo,
  accountDocHandle: DocHandle<LayoutDoc>,
  onReload?: () => void
): Promise<DevSwapState> {
  const swaps = loadDevSwaps();
  const records = Object.values(swaps);
  if (records.length === 0) return swaps;

  const results = await Promise.allSettled(
    records.map(async (record) => {
      unregisterPlugins(record.devUrl);
      await loadAndRegisterDevModule(repo, record.devUrl);
      setupHotReload(repo, record.devUrl, accountDocHandle, onReload);

      // Re-apply registry overrides for swapped tools not in the layout doc.
      if (record.swapped) {
        const registry = getRegistry("patchwork:tool");
        for (const entry of record.entries) {
          if (!entry.field) {
            const devPlugin = registry.get(entry.devToolId);
            if (devPlugin) {
              registerPlugins(
                [{ ...devPlugin, id: entry.originalToolId }],
                record.devUrl
              );
            }
          }
        }
      }
    })
  );

  for (const r of results) {
    if (r.status === "rejected") {
      console.warn("[dev-swap] Failed to restore swap:", r.reason);
    }
  }

  return swaps;
}
