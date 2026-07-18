import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import patchwork from "@inkandswitch/patchwork-bootloader/vite";

export default defineConfig({
  define: {
    __SITE_NAME__: JSON.stringify("gaios"),
    __KEYHIVE__: JSON.stringify(process.env.KEYHIVE === "true"),
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
  // file, so mirror it here. (Wildcard ACAO is uncredentialed by spec — safe
  // for these public static assets.)
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
