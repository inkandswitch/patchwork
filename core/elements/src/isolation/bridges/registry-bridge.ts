/**
 * Registry bridge — collects plugin metadata from the host's plugin registries
 * into serializable `RegistryEntry` objects for the iframe.
 *
 * Each entry's `importUrl` is rewritten to an opaque `pkg:` URL via the
 * `PackagesUrlMapper` (so automerge document IDs never reach the iframe), and
 * non-cloneable fields are stripped so the entry survives `postMessage`.
 * `getRegistries` produces the iframe's initial registry population;
 * `watchRegistries` pushes live registrations as they arrive.
 */

import { getAllRegistries } from "@inkandswitch/patchwork-plugins";
import type { RegistryEntry } from "../types.js";
import { log } from "../log.js";
import {
  type PackagesUrlMapper,
  resolvePackageEntryUrl,
} from "./url-mapping.js";

/**
 * Convert a host registry plugin into a serializable `RegistryEntry` for the
 * iframe:
 *  - resolve its `importUrl` to a package entry point. For an automerge
 *    `importUrl` the mapper rewrites the entry to an opaque `pkg:` URL so the
 *    automerge ID never leaks; for a plain HTTP(S) `importUrl` the entry passes
 *    through unchanged (`toPackageUrl` only rewrites automerge segments), so the
 *    iframe imports it directly from where it is deployed;
 *  - strip non-cloneable fields (`load`, `module`) and deep-copy the rest so it
 *    survives `postMessage`.
 *
 * Returns `undefined` (and logs) if the plugin can't be cloned. Shared by the
 * initial collection (`getRegistries`) and the live update watcher
 * (`watchRegistries`) so both produce entries identically.
 */
async function processRegistryPlugin(
  plugin: any,
  mapper: PackagesUrlMapper
): Promise<RegistryEntry | undefined> {
  let importUrl = plugin.importUrl as string | undefined;
  if (importUrl) {
    const resolved = await resolvePackageEntryUrl(importUrl);
    importUrl = resolved
      ? mapper.toPackageUrl(resolved.entryUrl, resolved.packageName ?? plugin.id)
      : undefined;
  }

  const { load, module, ...rest } = plugin;
  let entry: RegistryEntry;
  try {
    entry = structuredClone(rest);
  } catch (err) {
    log(`skipping non-cloneable plugin: ${rest.id}`, err);
    return undefined;
  }
  entry.importUrl = importUrl;
  return entry;
}

/**
 * Collect registry entries from all plugin registries (with importUrls
 * rewritten to pkg: URLs) for the iframe's initial registry population.
 */
export async function getRegistries(
  mapper: PackagesUrlMapper
): Promise<RegistryEntry[]> {
  const entries: RegistryEntry[] = [];
  for (const [, registry] of getAllRegistries()) {
    for (const plugin of registry.all()) {
      const entry = await processRegistryPlugin(plugin, mapper);
      if (entry) entries.push(entry);
    }
  }
  return entries;
}

/**
 * Watch all host registries for new plugin registrations and push each (as a
 * mapped, serializable entry) to the iframe via the RPC port.
 *
 * Returns a cleanup function that unsubscribes from all registries.
 */
export function watchRegistries(
  port: MessagePort,
  mapper: PackagesUrlMapper
): () => void {
  const unsubs: Array<() => void> = [];

  for (const [, registry] of getAllRegistries()) {
    const unsub = registry.on("registered", async (plugin: any) => {
      const entry = await processRegistryPlugin(plugin, mapper);
      if (!entry) return;
      log(`pushing registry update: ${entry.id}`);
      port.postMessage({ type: "plugin-registered", entry });
    });
    unsubs.push(unsub);
  }

  return () => {
    for (const unsub of unsubs) unsub();
  };
}
