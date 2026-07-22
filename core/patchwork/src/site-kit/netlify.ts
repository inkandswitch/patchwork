import type { PatchworkSiteOptions } from "./options.js";
import { resolveSyncServers, PRELOAD_WASM_ASSETS } from "./sync-servers.js";

function buildLinkHeader(syncServers: string[]): string {
  const parts = PRELOAD_WASM_ASSETS.map(
    (asset) => `</${asset}>; rel=preload; as=fetch; crossorigin`
  );
  for (const server of syncServers) {
    parts.push(`<${server}>; rel=preconnect`);
  }
  for (const server of syncServers) {
    parts.push(`<${server}>; rel=dns-prefetch`);
  }
  return parts.join(", ");
}

/** Builds the generated Netlify _headers file content — no bundler involved. */
export function buildHeaders(options: PatchworkSiteOptions): string {
  const syncServers = resolveSyncServers(options);
  const immutableAssets =
    options.netlify === false || options.netlify?.immutableAssets === false
      ? null
      : "/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n";

  return [
    "/*\n  Access-Control-Allow-Origin: *",
    immutableAssets,
    `/\n  Link: ${buildLinkHeader(syncServers)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** The generated Netlify _redirects file content — always the same SPA fallback. */
export const REDIRECTS = "/* /index.html 200\n";
