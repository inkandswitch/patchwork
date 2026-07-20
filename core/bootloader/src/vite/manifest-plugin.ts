import type { Plugin } from "vite";
import type { PatchworkVitePluginOptions } from "./patchwork-plugin.js";
import { ICON_SPECS } from "./icons.js";

function buildManifest(
  options: PatchworkVitePluginOptions
): Record<string, unknown> {
  const title = options.title ?? options.siteName ?? "Patchwork";
  const icons =
    !options.icons
      ? []
      : ICON_SPECS.filter(
          (spec) => spec.fileName === "apple-touch-icon.png" || spec.manifestPurpose
        ).map((spec) => ({
          src: `/${spec.fileName}`,
          sizes: `${spec.size}x${spec.size}`,
          type: "image/png",
          ...(spec.manifestPurpose ? { purpose: spec.manifestPurpose } : {}),
        }));

  const manifest: Record<string, unknown> = {
    name: title,
    short_name: options.shortName ?? title,
    description: options.description,
    start_url: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    background_color: options.backgroundColor ?? "#ffffff",
    theme_color: options.themeColor?.light ?? options.backgroundColor ?? "#ffffff",
    icons,
  };

  return { ...manifest, ...options.manifest };
}

/** Emits manifest.webmanifest for build and serves it for dev, from the same generated object. */
export function manifestPlugin(
  options: PatchworkVitePluginOptions = {}
): Plugin | null {
  if (options.manifest === false) return null;

  const manifest = buildManifest(options);
  const source = JSON.stringify(manifest, null, 2);
  let isBuild = false;

  return {
    name: "@patchwork/manifest",
    configResolved(config) {
      isBuild = config.command === "build";
    },
    buildStart() {
      if (!isBuild) return;
      this.emitFile({
        type: "asset",
        fileName: "manifest.webmanifest",
        source,
      });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/manifest.webmanifest") {
          next();
          return;
        }
        res.setHeader("Content-Type", "application/manifest+json");
        res.end(source);
      });
    },
  };
}
