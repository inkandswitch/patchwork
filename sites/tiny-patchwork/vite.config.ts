import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import patchwork from "@patchwork/bootloader/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    wasm(),
    patchwork({
      syncServerStorageId: "37915c96-8df9-4fa6-8058-1360edd2ebe2",
      syncServerUrl: "ws://localhost:3030",
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
          "@patchwork/account": "/@patchwork/account",
        },
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
