import type { Plugin } from "vite";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Vite plugin that generates a minimal package.json in the output directory
 * for tool modules and rewrites importPath references so they resolve correctly
 * when the dist directory is served as a folder doc root via darn sync.
 *
 * Source files declare `importPath: "./dist/mount.js"` (relative to the package
 * root). Once built, the dist directory _is_ the root, so the path must become
 * `"./mount.js"`. This plugin strips the `./dist/` prefix from `importPath`
 * values in the built `index.js`.
 */
export function toolPackage(): Plugin {
  let rootDir: string;
  let outputDir: string;
  let outDirName: string;

  return {
    name: "@patchwork/tool-package",
    configResolved(config) {
      rootDir = config.root;
      outDirName = config.build.outDir;
      outputDir = resolve(config.root, outDirName);
    },
    closeBundle() {
      // Read the source package.json to get the name
      const sourcePkgPath = resolve(rootDir, "package.json");
      let name = "tool";
      let pushworkUrl: string | undefined;

      try {
        const sourcePkg = JSON.parse(readFileSync(sourcePkgPath, "utf-8"));
        name = sourcePkg.name ?? "tool";
        pushworkUrl = sourcePkg.pushwork?.url;
      } catch {
        // Ignore if source package.json doesn't exist
      }

      // Create minimal package.json for the dist folder
      const distPkg: Record<string, unknown> = {
        name,
        type: "module",
        main: "./index.js",
      };

      // Preserve pushwork URL if present (used for darn workspace ID)
      if (pushworkUrl) {
        distPkg.pushwork = { url: pushworkUrl };
      }

      // Write the package.json file directly
      const distPkgPath = resolve(outputDir, "package.json");
      writeFileSync(distPkgPath, JSON.stringify(distPkg, null, 2) + "\n");

      // Rewrite importPath references in index.js to strip the dist prefix.
      // e.g. "./dist/mount.js" → "./mount.js"
      const indexPath = resolve(outputDir, "index.js");
      if (existsSync(indexPath)) {
        const prefix = `./${outDirName}/`;
        let content = readFileSync(indexPath, "utf-8");
        if (content.includes(prefix)) {
          content = content.replaceAll(prefix, "./");
          writeFileSync(indexPath, content);
        }
      }
    },
  };
}
