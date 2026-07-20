/**
 * The bundler-agnostic option shape for a Patchwork site's generated
 * static assets (icons, index.html, manifest.webmanifest, Netlify config).
 * `../vite/patchwork-plugin.ts` extends this with vite-only config
 * (importmap, server/preview/worker/build) — a different bundler adapter
 * can reuse this same shape and the pure builders in this directory without
 * pulling in anything vite-specific.
 */

export interface PatchworkIconsOptions {
  /** Path (relative to the site root) to a source svg or raster image. Every icon size is rendered from it via sharp. */
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

export interface PatchworkSiteOptions {
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

  themeColor?: string | { light: string; dark: string };
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
}
