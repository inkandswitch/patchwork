import sharp from "sharp";
import { readFile } from "node:fs/promises";

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
