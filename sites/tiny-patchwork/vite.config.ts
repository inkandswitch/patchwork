import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import patchwork from "@inkandswitch/patchwork-bootloader/vite";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const devToolsPath = resolve(__dirname, "dev-tools.json");
const devToolsConfig = process.env.DEV_TOOLS && existsSync(devToolsPath)
  ? readFileSync(devToolsPath, "utf-8")
  : '{"overrides":{}}';

export default defineConfig({
  plugins: [
    tailwindcss(),
    wasm(),
    patchwork({
      importmap: {
        imports: {
          DEV: "data:text/javascript,export%20const%20DEV%20=%20true;",
        },
      },
    }),
  ],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  preview: {
    port: process.env.PORT ? +process.env.PORT : 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  define: {
    __DEV_TOOLS__: devToolsConfig,
  },
  build: {
    target: "firefox137",
    minify: false,
    sourcemap: true,
  },
});
