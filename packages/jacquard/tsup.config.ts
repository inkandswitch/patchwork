import { defineConfig } from "tsup";
import { EXTERNAL_DEPENDENCIES } from "@patchwork/sdk/shared-dependencies";

console.log("EXTERNAL_DEPENDENCIES", EXTERNAL_DEPENDENCIES);

export default defineConfig({
  entry: {
    index: "src/index.ts",
    components: "src/components/index.ts",
    hooks: "src/hooks.ts",
    signals: "src/signals.ts",
  },
  format: ["esm"],
  target: "es2020",
  dts: true,
  clean: true,
  noExternal: [new RegExp(`^(?!(${EXTERNAL_DEPENDENCIES.join("|")})($|/)).*$`)],
  treeshake: true,
  sourcemap: true,
  splitting: false,
  outDir: "dist",
  injectStyle: true,
  // Enable JSX handling
  jsx: "automatic",
  // Set module resolution
  esbuildOptions(options) {
    options.jsx = "automatic";
    options.loader = {
      ...options.loader,
      ".css": "css",
      ".tsx": "tsx",
    };
  },
});
