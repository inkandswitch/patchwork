import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import patchwork from "@patchwork/bootloader/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    wasm(),
    patchwork({
      syncServerStorageId: "a565270c-bf7c-4df9-a531-f6be1d3152f0",
      syncServerUrl: "wss://keyhive.sync.automerge.org",
      keyhiveEnabled: true,
      extraBuiltins: {
        "@patchwork/plugins": "/packages/@patchwork/plugins/index.js",
        "@patchwork/context": "/packages/@patchwork/context/index.js",
        "@patchwork/context/selection":
          "/packages/@patchwork/context/selection.js",
        "@patchwork/context/react": "/packages/@patchwork/context/react.js",
        "@patchwork/context/solid": "/packages/@patchwork/context/solid.js",
        "@patchwork/context/diff": "/packages/@patchwork/context/diff.js",
        "@patchwork/context/comments":
          "/packages/@patchwork/context/comments.js",
      },
      importmap: {
        imports: {
          react: "https://ga.jspm.io/npm:react@18.3.1/index.js",
          "react-dom": "https://ga.jspm.io/npm:react-dom@18.3.1/index.js",
          "react-dom/client":
            "https://ga.jspm.io/npm:react-dom@18.3.1/client.js",
          "react-dom/server":
            "https://ga.jspm.io/npm:react-dom@18.3.1/server.browser.js",
          "react/jsx-runtime":
            "https://ga.jspm.io/npm:react@18.3.1/jsx-runtime.js",
          signia: "https://ga.jspm.io/npm:signia@0.1.5/dist/esm/index.mjs",
        },
      },
    }),
  ],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  server: {
    port: process.env.PORT ? +process.env.PORT : 5173,
  },
  build: {
    target: "firefox137",
    minify: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: "index.html",
        tools: "src/tools/index.ts",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "tools") {
            return "tools.js";
          }
          return "[name].js";
        },
      },
      preserveEntrySignatures: "strict",
    },
  },
});
