import { defineConfig } from "tsup";
import { EXTERNAL_DEPENDENCIES } from "@patchwork/sdk/shared-dependencies";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    process: JSON.stringify({
      env: {
        NODE_ENV: "production",
      },
    }),
    crypto: "globalThis.crypto",
    "crypto.subtle": "globalThis.crypto.subtle",
  },
  format: ["esm"],
  target: "es2020",
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: true,
  splitting: false,
  outDir: "dist",
  noExternal: [new RegExp(`^(?!(${EXTERNAL_DEPENDENCIES.join("|")})($|/)).*$`)],
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
    options.platform = "browser";
  },
});
