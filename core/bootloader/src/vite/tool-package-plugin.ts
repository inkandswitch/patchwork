import type { Plugin } from "vite";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Vite plugin that generates a minimal package.json in the output directory
 * for tool modules. This is required by patchwork-filesystem to resolve the
 * entry point when loading tools via darn sync.
 */
export function toolPackage(): Plugin {
  let rootDir: string;
  let outputDir: string;

  return {
    name: "@patchwork/tool-package",
    configResolved(config) {
      rootDir = config.root;
      outputDir = resolve(config.root, config.build.outDir);
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
    },
  };
}
