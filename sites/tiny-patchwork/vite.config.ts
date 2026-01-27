import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import patchwork from "@inkandswitch/patchwork-bootloader/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Force local automerge-repo fork for Subduction integration
const automergeRepoPath = path.resolve(__dirname, "../../../automerge-repo/packages");

// Resolve @automerge/automerge to the browser entrypoint that initializes Wasm
const automergePackagePath = path.resolve(
  __dirname,
  "node_modules/@automerge/automerge/dist/mjs/entrypoints"
);

export default defineConfig({
  resolve: {
    alias: [
      // Handle subpath imports first (more specific matches)
      { find: /^@automerge\/automerge\/slim$/, replacement: path.join(automergePackagePath, "slim.js") },
      { find: /^@automerge\/automerge-repo\/slim$/, replacement: path.join(automergeRepoPath, "automerge-repo/dist/entrypoints/slim.js") },
      // Force browser entrypoint for @automerge/automerge (initializes Wasm)
      { find: "@automerge/automerge", replacement: path.join(automergePackagePath, "fullfat_bundler.js") },
      // Force local fork for automerge-repo
      { find: "@automerge/automerge-repo", replacement: path.join(automergeRepoPath, "automerge-repo/dist/entrypoints/fullfat.js") },
    ],
  },
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
  },
});
