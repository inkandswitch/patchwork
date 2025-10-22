import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pushworking = process.env.PUSHWORK;

function pushworkSync() {
  if (!pushworking) return [];
  return {
    name: "pushwork-sync",
    apply: "build",
    writeBundle() {
      if (!existsSync(".pushwork")) {
        console.warn("no .pushwork directory! run `pushwork init .` first");
        return;
      }
      try {
        execSync("pushwork sync", {
          stdio: "inherit",
        });
      } catch (error) {
        console.warn((error as Error).message);
      }
    },
  } as const;
}

export default defineConfig({
  plugins: [solid(), pushworkSync()],
  build: {
    lib: {
      formats: ["es"],
      entry: {
        index: resolve(__dirname, "./src/index.tsx"),
      },
    },
    rollupOptions: {
      external(id) {
        return (
          ["@automerge/automerge-repo", "@automerge/automerge"].includes(id) ||
          id.startsWith("@patchwork/")
        );
      },
    },
  },
});
