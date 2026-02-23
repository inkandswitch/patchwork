import { defineConfig, type Plugin } from "vite";
import wasm from "vite-plugin-wasm";
import tailwindcss from "@tailwindcss/vite";

/**
 * Custom importmap plugin that doesn't externalize automerge-repo packages.
 * The standard patchwork bootloader externalizes them, which breaks Wasm init.
 */
function customImportmap(): Plugin {
  // Packages to externalize (exclude automerge-repo and subduction)
  const externals = [
    "@automerge/automerge",
    "@automerge/automerge/slim",
    "@automerge/automerge-repo-keyhive",
    "@keyhive/keyhive",
    "@keyhive/keyhive/slim",
    "@inkandswitch/patchwork-bootloader",
    "@inkandswitch/patchwork-elements",
    "@inkandswitch/patchwork-filesystem",
    "@inkandswitch/patchwork-plugins",
    "@codemirror/state",
    "@codemirror/view",
    "@codemirror/language",
    "solid-js",
    "solid-js/html",
    "solid-js/web",
    "solid-js/h",
    "solid-js/store",
    "solid-js/jsx-runtime",
  ];

  const builtins = externals.reduce(
    (acc, name) => ((acc[name] = `/packages/${name}.js`), acc),
    {} as Record<string, string>
  );

  const importmap = {
    imports: {
      ...builtins,
      DEV: "data:text/javascript,export%20const%20DEV%20=%20true;",
    },
  };

  return {
    name: "custom-importmap",
    async buildStart() {
      for (const [id, fileName] of Object.entries(builtins)) {
        this.emitFile({
          type: "chunk",
          fileName: fileName.slice(1),
          id,
          preserveSignature: "strict",
        });
      }
    },
    resolveId(id) {
      if (id in importmap.imports && !(id in builtins)) {
        return { id: importmap.imports[id], external: true };
      }
    },
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
  };
}

// Service worker plugin (inlined from bootloader)
function serviceworker(): Plugin {
  return {
    name: "@patchwork/service-worker",
    async buildStart() {
      const resolved = await this.resolve(
        "@inkandswitch/patchwork-bootloader/service-worker"
      );
      if (resolved) {
        this.emitFile({
          type: "chunk",
          id: resolved.id,
          fileName: "service-worker.js",
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), wasm(), customImportmap(), serviceworker()],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  preview: {
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
