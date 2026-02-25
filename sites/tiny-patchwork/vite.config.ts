import { defineConfig, type Plugin } from "vite";
import wasm from "vite-plugin-wasm";
import tailwindcss from "@tailwindcss/vite";

/**
 * Custom importmap plugin. Wasm init ordering is handled by index.html's
 * `import("./src/init-wasm.ts").then(...)` pattern, so automerge-repo
 * can safely be externalized here for tools that depend on it.
 */
function customImportmap(): Plugin {
  const externals = [
    "@automerge/automerge",
    "@automerge/automerge/slim",
    "@automerge/automerge-repo",
    "@automerge/automerge-repo/slim",
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
    "react",
    "react-dom",
    "react-dom/client",
    "react/jsx-runtime",
    "solid-js",
    "solid-js/html",
    "solid-js/web",
    "solid-js/h",
    "solid-js/store",
    "solid-js/jsx-runtime",
  ];

  // CJS packages that need explicit named re-exports from their default export.
  // Rollup's CJS-to-ESM conversion only produces a default export for these.
  const cjsNamedReexports: Record<string, string[]> = {
    "packages/react.js": [
      "Children",
      "Component",
      "Fragment",
      "Profiler",
      "PureComponent",
      "StrictMode",
      "Suspense",
      "cloneElement",
      "createContext",
      "createElement",
      "createFactory",
      "createRef",
      "forwardRef",
      "isValidElement",
      "lazy",
      "memo",
      "startTransition",
      "useCallback",
      "useContext",
      "useDebugValue",
      "useDeferredValue",
      "useEffect",
      "useId",
      "useImperativeHandle",
      "useInsertionEffect",
      "useLayoutEffect",
      "useMemo",
      "useReducer",
      "useRef",
      "useState",
      "useSyncExternalStore",
      "useTransition",
      "version",
    ],
    "packages/react-dom.js": [
      "createPortal",
      "createRoot",
      "findDOMNode",
      "flushSync",
      "hydrate",
      "hydrateRoot",
      "render",
      "unmountComponentAtNode",
      "unstable_batchedUpdates",
      "version",
    ],
    "packages/react-dom/client.js": ["createRoot", "hydrateRoot"],
    "packages/react/jsx-runtime.js": ["Fragment", "jsx", "jsxs"],
  };

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
    generateBundle(_options, bundle) {
      for (const [fileName, names] of Object.entries(cjsNamedReexports)) {
        const chunk = bundle[fileName];
        if (!chunk || chunk.type !== "chunk") continue;

        // Find the variable name used for the default export.
        // Pattern: `export { someVar as default }` or just `export { index as default }`
        const defaultExportMatch = chunk.code.match(
          /export\s*\{\s*(\w+)\s+as\s+default\s*\}/
        );
        if (!defaultExportMatch) continue;

        const defaultVar = defaultExportMatch[1];

        // Replace the default-only export with default + named destructured exports
        const namedExports = names.map((n) => `  ${n}`).join(",\n");
        const destructure = `const {\n${namedExports}\n} = ${defaultVar};\n`;
        const exportBlock = `export {\n  ${defaultVar} as default,\n${namedExports}\n};\n`;

        chunk.code = chunk.code.replace(
          /export\s*\{\s*\w+\s+as\s+default\s*\};?/,
          destructure + exportBlock
        );
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
