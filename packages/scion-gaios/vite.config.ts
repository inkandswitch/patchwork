import path from "node:path";
import { UserConfig, defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import rootstockServiceWorkerPlugin from "@patchwork/service-worker/vite-plugin.ts";
import importmap from "./importmap.json" with { type: "json" };

const SERVICE_WORKER_MODULE_ID = "/service-worker.js";
const SERVICE_WORKER_PATH = path.join(
  import.meta.dirname,
  "node_modules/@patchwork/service-worker/dist/service-worker.js"
);

export default defineConfig({
  plugins: [
    wasm(),
    rootstockServiceWorkerPlugin({
      moduleId: SERVICE_WORKER_MODULE_ID,
      path: SERVICE_WORKER_PATH,
    }),
    {
      name: "naïve-importmap",
      transformIndexHtml: {
        order: "pre",

        handler(html) {
          return {
            html,
            tags: [
              {
                tag: "script",
                attrs: { type: "importmap" },
                children: JSON.stringify(importmap, null, 2),
              },
            ],
          };
        },
      },
    },
  ],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  build: {
    target: "firefox137",
    minify: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      preserveEntrySignatures: "allow-extension",
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
      },
    },
  },

  define: {
    "process.env": {
      NODE_ENV: "production",
    },
  },
} satisfies UserConfig);
