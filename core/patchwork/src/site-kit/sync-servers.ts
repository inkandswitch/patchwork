import type { PatchworkSiteOptions } from "./options.js";

// Mirrors core/bootloader/src/sync-config.ts's DEFAULT_CLASSIC_SYNC_SERVER
// and automerge-worker.ts's SUBDUCTION_SYNC_URL selection — kept here as
// plain constants (rather than importing those runtime modules) since this
// only needs the hostnames, not the browser-only logic that reads them.
const DEFAULT_SYNC_SERVERS = {
  classic: "wss://sync3.automerge.org",
  subduction: "wss://subduction.sync.inkandswitch.com",
  keyhive: "wss://keyhive.sync.automerge.org",
};

function wsToHttpOrigin(wsUrl: string): string {
  return wsUrl.replace(/^ws/, "http");
}

/**
 * Resolves which sync-server origins are actually live for this build: the
 * channel that's live is subduction xor keyhive (picked by
 * `keyhiveSyncServer`, matching automerge-worker.ts's own selection) plus
 * classic (on-demand, but still worth a preconnect hint) unless disabled.
 * A flat list would drift from `keyhiveSyncServer` — e.g. always hinting
 * subduction even on a build that actually connects to keyhive.
 */
export function resolveSyncServers(options: PatchworkSiteOptions): string[] {
  if (options.syncServers === false) return [];
  const servers = { ...DEFAULT_SYNC_SERVERS, ...options.syncServers };
  const origins: string[] = [];
  const primary = options.keyhiveSyncServer
    ? servers.keyhive
    : servers.subduction;
  origins.push(primary);
  if (servers.classic) origins.push(servers.classic);
  return origins.map(wsToHttpOrigin);
}

// Emitted by importmap-plugin.ts. keyhive_wasm.wasm is loaded lazily (only
// when keyhive is actually enabled), so it isn't worth an eager preload.
export const PRELOAD_WASM_ASSETS = ["automerge.wasm", "subduction.wasm"];
