import type { Plugin } from "vite";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { PatchworkVitePluginOptions } from "./patchwork-plugin.js";

export interface IconSpec {
  fileName: string;
  size: number;
  /** Included in the generated manifest.webmanifest icons array when set. */
  manifestPurpose?: string;
}

// apple-touch-icon at 180 matches iOS's expected size; 192/512 are the
// standard PWA manifest sizes; 16/32 cover browser tab favicons.
export const ICON_SPECS: IconSpec[] = [
  { fileName: "favicon-16x16.png", size: 16 },
  { fileName: "favicon-32x32.png", size: 32 },
  { fileName: "apple-touch-icon.png", size: 180 },
  { fileName: "icon-192x192.png", size: 192, manifestPurpose: "any maskable" },
  { fileName: "icon-512x512.png", size: 512, manifestPurpose: "any maskable" },
];

const cache = new Map<string, Promise<Map<string, Buffer>>>();

async function renderIcons(source: string): Promise<Map<string, Buffer>> {
  const input = await readFile(source);
  const rendered = new Map<string, Buffer>();
  await Promise.all(
    ICON_SPECS.map(async (spec) => {
      const buffer = await sharp(input)
        .resize(spec.size, spec.size, { fit: "cover" })
        .png()
        .toBuffer();
      rendered.set(spec.fileName, buffer);
    })
  );
  return rendered;
}

/** Renders every icon size from a single source image (svg or raster), cached by source path. */
export function getIcons(source: string): Promise<Map<string, Buffer>> {
  let promise = cache.get(source);
  if (!promise) {
    promise = renderIcons(source).catch((error) => {
      cache.delete(source);
      throw error;
    });
    cache.set(source, promise);
  }
  return promise;
}

/** Emits the rendered icon PNGs for build, and serves the same buffers for dev. */
export function iconsPlugin(
  options: PatchworkVitePluginOptions = {}
): Plugin | null {
  if (!options.icons) return null;
  const { source } = options.icons;

  let sourcePath: string;
  let isBuild = false;

  return {
    name: "@patchwork/icons",
    configResolved(config) {
      isBuild = config.command === "build";
      sourcePath = resolve(config.root, source);
    },
    async buildStart() {
      if (!isBuild) return;
      const icons = await getIcons(sourcePath);
      for (const [fileName, buffer] of icons) {
        this.emitFile({ type: "asset", fileName, source: buffer });
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const fileName = req.url?.replace(/^\//, "");
        if (!fileName) {
          next();
          return;
        }
        const icons = await getIcons(sourcePath);
        const buffer = icons.get(fileName);
        if (!buffer) {
          next();
          return;
        }
        res.setHeader("Content-Type", "image/png");
        res.end(buffer);
      });
    },
  };
}
