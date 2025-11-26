import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import patchwork from "@patchwork/bootloader/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    wasm(),
    patchwork({
      // keyhive settings
      // syncServerStorageId: "a565270c-bf7c-4df9-a531-f6be1d3152f0",
      // syncServerUrl: "wss://keyhive.sync.automerge.org",
      // keyhiveEnabled: true,
      syncServerStorageId: "3760df37-a4c6-4f66-9ecd-732039a9385d",
      syncServerUrl: "wss://sync3.automerge.org",
      extraBuiltins: {
        "@codemirror/language": "/packages/@codemirror/language/index.js",
        "@codemirror/view": "/packages/@codemirror/view/index.js",
        "@codemirror/state": "/packages/@codemirror/state/index.js",
        "@patchwork/plugins": "/packages/@patchwork/plugins/index.js",
        "@patchwork/context": "/packages/@patchwork/context/index.js",
        "@patchwork/refs": "/packages/@patchwork/refs/index.js",
        "@patchwork/context-selection":
          "/packages/@patchwork/context-selection/index.js",
        "@patchwork/context-react":
          "/packages/@patchwork/context-react/index.js",
        "@patchwork/context-diff": "/packages/context-diff/index.js",
        "@patchwork/context-comments": "/packages/context-comments/index.js",
        "@patchwork/context-solid": "/packages/context-solid/index.js",
        "@patchwork/filesystem": "/packages/@patchwork/filesystem/index.js",
        "@automerge/automerge-repo-react-hooks":
          "/packages/@automerge/automerge-repo-react-hooks/index.js",
        react: "/packages/react/index.js",
        "react/jsx-runtime": "/packages/react/jsx-runtime.js",
        "react-dom": "/packages/react-dom/index.js",
        "react-dom/client": "/packages/react-dom/client.js",
        "react-dom/server": "/packages/react-dom/server.js",
        signia: "/packages/signia/index.js",
        scheduler: "/packages/scheduler/index.js",
        "solid-js": "/packages/solid-js/index.js",
        "solid-js/store": "/packages/solid-js/store.js",
        "solid-js/html": "/packages/solid-js/html.js",
        "solid-js/h": "/packages/solid-js/h.js",
        "solid-js/web": "/packages/solid-js/web.js",
      },
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
    port: process.env.PORT ? +process.env.PORT : 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
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
