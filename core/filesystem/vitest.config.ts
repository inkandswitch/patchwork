import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Force a single copy of automerge-subduction across linked packages.
      // Without this, the linked automerge-repo resolves its own copy from
      // its own node_modules, and the Wasm singleton is not shared.
      "@automerge/automerge-subduction/slim": path.resolve(
        __dirname,
        "../../node_modules/@automerge/automerge-subduction/dist/esm/slim.js"
      ),
      "@automerge/automerge-subduction": path.resolve(
        __dirname,
        "../../node_modules/@automerge/automerge-subduction/dist/esm/node.js"
      ),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.{test,spec}.ts"],
    testTimeout: 30_000,
    setupFiles: ["./test/setup.ts"],
  },
});
