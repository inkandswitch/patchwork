import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import patchwork from "@inkandswitch/patchwork-bootloader/vite";

export default defineConfig({
  // PATCHWORK_ joins Vite's default VITE_ prefix so
  // PATCHWORK_SYSTEM_PACKAGE_LIST_URL reaches client code via import.meta.env.
  envPrefix: ["VITE_", "PATCHWORK_"],
  define: {
    __SITE_NAME__: JSON.stringify("patchwork.inkandswitch.com"),
    __KEYHIVE__: JSON.stringify(process.env.KEYHIVE === "true"),
    // Default sync server is sub. Build with KEYHIVE_SYNC_SERVER=true to
    // target keyhive.sync.automerge.org instead.
    __KEYHIVE_SYNC_SERVER__: JSON.stringify(
      process.env.KEYHIVE_SYNC_SERVER === "true"
    ),
  },
  plugins: [
    wasm(),
    patchwork(),
  ],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  // The isolation iframe is sandboxed srcdoc (origin "null"), so its direct
  // fetches (e.g. vite-plugin-wasm's .wasm load) are cross-origin. Production
  // already serves ACAO via public/_headers; vite dev/preview don't read that
  // file, so mirror it here.
  server: {
    headers: { "Access-Control-Allow-Origin": "*" },
  },
  preview: {
    port: process.env.PORT ? +process.env.PORT : 5173,
    headers: { "Access-Control-Allow-Origin": "*" },
  },
  build: {
    target: "firefox150",
    minify: false,
    sourcemap: true,
  },
});
