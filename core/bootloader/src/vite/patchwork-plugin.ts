import type { Plugin, ServerOptions, PreviewOptions, BuildOptions } from "vite";

import { importmap } from "./importmap-plugin.js";
import { serviceworker } from "./service-worker-plugin.js";
import { configPlugin, wasm } from "./config-plugin.js";
import { iconsPlugin } from "./icons.js";
import { htmlPlugin } from "./html-plugin.js";
import { manifestPlugin } from "./manifest-plugin.js";
import { netlifyPlugin } from "./netlify-plugin.js";

/**
 * The patchwork vite plugin. A site's vite.config.ts can shrink down to
 * `plugins: [patchwork({...})]` plus a single source icon file — this plugin
 * owns the wasm plugin, the importmap/service-worker emission, the generated
 * index.html/manifest.webmanifest/Netlify _headers+_redirects, the site's
 * icon set, and vite's server/preview/worker/build/define config.
 *
 * Each generated piece is switched off individually by passing `false` for
 * its option (`html: false`, `manifest: false`, `netlify: false`,
 * `icons: false`, `server: false`, `preview: false`, `worker: false`).
 *
 * `server`/`preview`/`worker`/`build`/`define` are owned by this plugin's
 * `config()` hook and driven entirely by these options — don't also set them
 * in the site's own `defineConfig({...})` alongside `patchwork()`, since
 * Vite's plugin-config merge order doesn't guarantee which one wins.
 */
export default function patchwork(options?: PatchworkVitePluginOptions) {
  return [
    wasm(),
    configPlugin(options),
    iconsPlugin(options),
    htmlPlugin(options),
    manifestPlugin(options),
    netlifyPlugin(options),
    importmap(options),
    serviceworker(),
  ].filter((plugin): plugin is Plugin => plugin != null);
}

type Imports = { [name: string]: string };
export type ImportMap = {
  imports: Imports;
  scopes?: { [scope: string]: Imports };
};

export interface PatchworkIconsOptions {
  /** Path (relative to the vite root) to a source svg or raster image. Every icon size is rendered from it via sharp. */
  source: string;
  /** Path to a monochrome svg for Safari's pinned-tab mask icon. Omitted entirely if not set. */
  maskIcon?: string;
  maskIconColor?: string;
}

export interface PatchworkHtmlOptions {
  lang?: string;
  /** Raw HTML appended just before </html> — e.g. extra <link>/<meta> tags. */
  extraHead?: string;
}

export interface PatchworkNetlifyOptions {
  /** Cache-Control: immutable on /assets/*. Default true. */
  immutableAssets?: boolean;
}

export interface PatchworkSyncServersOptions {
  /** wss:// URL for the legacy automerge-repo sync-server channel (connected on demand via connectClassicSync). Default: wss://sync3.automerge.org. Pass false to skip its preconnect hint. */
  classic?: string | false;
  /** wss:// URL for subduction sync — live when keyhiveSyncServer is false. Default: wss://subduction.sync.inkandswitch.com */
  subduction?: string;
  /** wss:// URL for keyhive sync — live when keyhiveSyncServer is true. Default: wss://keyhive.sync.automerge.org */
  keyhive?: string;
}

export interface PatchworkVitePluginOptions {
  importmap?: ImportMap;

  /** -> __SITE_NAME__ define */
  siteName?: string;
  /** <title>, apple-mobile-web-app-title, manifest name */
  title?: string;
  /** manifest short_name (defaults to title) */
  shortName?: string;
  /** manifest description, <meta name=description> */
  description?: string;
  /** default "/src/main.ts" — must be root-absolute, since the generated index.html doesn't live at the project root */
  entry?: string;

  /** -> __KEYHIVE__ define */
  keyhive?: boolean;
  /** -> __KEYHIVE_SYNC_SERVER__ define */
  keyhiveSyncServer?: boolean;

  themeColor?: { light: string; dark: string };
  /** manifest background_color */
  backgroundColor?: string;

  /**
   * Which sync-server hosts to preconnect/dns-prefetch from the html and
   * list in the Netlify Link header. Only the channel actually live for
   * this build is included — subduction xor keyhive, picked by
   * `keyhiveSyncServer`, matching automerge-worker.ts's own selection —
   * plus `classic` (on-demand, but cheap to hint) unless set to `false`.
   * Pass `false` to skip all sync-server hints.
   */
  syncServers?: false | PatchworkSyncServersOptions;

  icons?: false | PatchworkIconsOptions;
  html?: false | PatchworkHtmlOptions;
  manifest?: false | Record<string, unknown>;
  netlify?: false | PatchworkNetlifyOptions;

  server?: false | ServerOptions;
  preview?: false | PreviewOptions;
  worker?: false | { format?: "es" | "iife" };
  build?: BuildOptions;
}
