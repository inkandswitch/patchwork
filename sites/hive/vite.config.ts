import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import patchwork from "@patchwork/bootloader/vite";

export default defineConfig({
  plugins: [
    wasm(),
    patchwork({
      syncServerStorageId: "a565270c-bf7c-4df9-a531-f6be1d3152f0",
      syncServerUrl: "wss://keyhive.sync.automerge.org",
      keyhiveEnabled: true,
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
