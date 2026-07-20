import type { Plugin } from "vite";
import type { PatchworkVitePluginOptions } from "./patchwork-plugin.js";
import { resolveSyncServers, PRELOAD_WASM_ASSETS } from "./shared.js";

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

function buildHeaders(options: PatchworkVitePluginOptions): string {
  const syncServers = resolveSyncServers(options);
  const immutableAssets = options.netlify === false || options.netlify?.immutableAssets === false
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

const REDIRECTS = "/* /index.html 200\n";

/**
 * Netlify's _headers/_redirects are only meaningful on an actual Netlify
 * deploy, so this only runs for the production build — no dev middleware.
 * The Link header shares its sync-server/wasm-asset lists with html-plugin
 * so the two never drift out of sync with each other.
 */
export function netlifyPlugin(
  options: PatchworkVitePluginOptions = {}
): Plugin | null {
  if (options.netlify === false) return null;

  const headers = buildHeaders(options);
  let isBuild = false;

  return {
    name: "@patchwork/netlify",
    configResolved(config) {
      isBuild = config.command === "build";
    },
    buildStart() {
      if (!isBuild) return;
      this.emitFile({ type: "asset", fileName: "_headers", source: headers });
      this.emitFile({
        type: "asset",
        fileName: "_redirects",
        source: REDIRECTS,
      });
    },
  };
}
