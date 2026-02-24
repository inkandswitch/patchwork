import type { Plugin as EsbuildPlugin } from "esbuild";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

export default function darnSync() {
  return {
    name: "darn",
    setup(build) {
      // Check for .darn in the dist directory (output location)
      const outdir = build.initialOptions.outdir ?? "dist";
      const darnDir = `${outdir}/.darn`;

      if (!existsSync(darnDir)) {
        console.warn(
          `no ${darnDir} directory! run 'darn init --id <url> ${outdir}' first`
        );
        return;
      }

      build.onEnd((result) => {
        if (result.errors.length) {
          console.warn("esbuild errors! skipping darn sync");
          return;
        }
        try {
          execSync("darn sync --force", {
            cwd: outdir,
            stdio: "inherit",
          });
        } catch (error) {
          console.warn((error as Error).message);
        }
      });
    },
  } satisfies EsbuildPlugin;
}
