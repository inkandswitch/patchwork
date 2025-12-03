import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import patchwork from "@patchwork/bootloader/vite";

export default defineConfig({
  plugins: [
    wasm(),
    patchwork({
      extraBuiltins: {
        "@automerge/automerge-repo-keyhive":
          "/packages/@automerge/automerge-repo-keyhive/index.js",
      },
    }),
  ],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  build: {
    target: "firefox137",
    minify: false,
    sourcemap: true,
  },
  server: {
    port: process.env.PORT ? +process.env.PORT : undefined,
    hmr: {
      port: process.env.PORT ? +process.env.PORT : undefined,
    },
  },
});
