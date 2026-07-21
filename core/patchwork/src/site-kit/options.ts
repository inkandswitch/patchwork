import type { SyncServerIdentity } from "@automerge/automerge-repo-keyhive";

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

type PatchworkPrimarySyncServerOptions =
  | { subduction?: string; keyhive?: never }
  | { subduction?: never; keyhive: PatchworkKeyhiveSyncServer };

export type PatchworkKeyhiveSyncServer =
  | "keyhive"
  | "subduction"
  | ({ url: string } & SyncServerIdentity);

export type PatchworkSyncServersOptions = {
  /** wss:// URL for the legacy automerge-repo sync-server channel (connected on demand via connectClassicSync). Default: wss://sync3.automerge.org. Pass false to skip its preconnect hint. */
  classic?: string | false;
} & PatchworkPrimarySyncServerOptions;

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

  themeColor?: string | { light: string; dark: string };
  /** manifest background_color */
  backgroundColor?: string;

  /**
   * Sync-server configuration for this build. Providing `keyhive` enables
   * keyhive and selects the relay identity ARK grants access to. Custom
   * identities also require their WebSocket URL. `subduction` and `keyhive`
   * are mutually exclusive. The live server and `classic` are also emitted as
   * connection hints. Pass `false` to keep the default servers but skip those
   * hints.
   */
  syncServers?: false | PatchworkSyncServersOptions;

  icons?: false | PatchworkIconsOptions;
  html?: false | PatchworkHtmlOptions;
  manifest?: false | Record<string, unknown>;
  netlify?: false | PatchworkNetlifyOptions;
}
