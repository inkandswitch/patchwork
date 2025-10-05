import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import patchwork from "@patchwork/bootloader/vite";

export default defineConfig({
  plugins: [
    wasm(),
    patchwork({
      syncServerStorageId: "3760df37-a4c6-4f66-9ecd-732039a9385d",
      syncServerUrl: "wss://sync3.automerge.org",
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
});
