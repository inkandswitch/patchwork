// vite.config.ts
import { Generator } from "file:///Users/pvh/Dev/patchwork/node_modules/.pnpm/@jspm+generator@2.5.1/node_modules/@jspm/generator/dist/generator.js";
import react from "file:///Users/pvh/Dev/patchwork/node_modules/.pnpm/@vitejs+plugin-react@4.3.4_vite@5.4.17_@types+node@20.17.30_lightningcss@1.29.2_terser@5.37.0_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { build } from "file:///Users/pvh/Dev/patchwork/node_modules/.pnpm/esbuild@0.23.1/node_modules/esbuild/lib/main.js";
import path from "path";
import { defineConfig } from "file:///Users/pvh/Dev/patchwork/node_modules/.pnpm/vite@5.4.17_@types+node@20.17.30_lightningcss@1.29.2_terser@5.37.0/node_modules/vite/dist/node/index.js";
import wasm from "file:///Users/pvh/Dev/patchwork/node_modules/.pnpm/vite-plugin-wasm@3.4.1_vite@5.4.17_@types+node@20.17.30_lightningcss@1.29.2_terser@5.37.0_/node_modules/vite-plugin-wasm/exports/import.mjs";
import tailwindcss from "file:///Users/pvh/Dev/patchwork/node_modules/.pnpm/@tailwindcss+vite@4.1.3_vite@5.4.17_@types+node@20.17.30_lightningcss@1.29.2_terser@5.37.0_/node_modules/@tailwindcss/vite/dist/index.mjs";

// ../sdk/src/shared-dependencies.ts
var SHARED_DEPENDENCIES = [
  "@automerge/automerge-repo",
  "@automerge/automerge-repo-react-hooks",
  "@automerge/automerge",
  "@codemirror/autocomplete",
  "@codemirror/commands",
  "@codemirror/lang-markdown",
  "@codemirror/language",
  "@codemirror/language-data",
  "@codemirror/search",
  "@codemirror/state",
  "@codemirror/view",
  "react",
  "react-dom",
  "react-dom/client",
  "react-dom/server",
  "react/jsx-runtime",
  "@automerge/automerge/slim",
  "@automerge/automerge/slim/next",
  "lucide-react",
  "signia"
];
var SHARED_MODULES = {
  // SDK modules
  "@patchwork/sdk": "file:../sdk/",
  "@patchwork/datagrid": "file:../packages/datagrid",
  "@patchwork/essay": "file:../packages/essay",
  "@patchwork/file": "file:../packages/file",
  "@patchwork/folder": "file:../packages/folder",
  "@patchwork/jacquard": "file:../packages/jacquard",
  "@patchwork/kanban": "file:../packages/kanban",
  "@patchwork/my-tools": "file:../packages/my-tools",
  "@patchwork/raw-editor": "file:../packages/raw-editor",
  "@patchwork/tldraw": "file:../packages/tldraw"
};
var SDK_SUBMODULES = [
  "@patchwork/sdk/async-signals",
  "@patchwork/sdk/components",
  "@patchwork/sdk/embed",
  "@patchwork/sdk/files",
  "@patchwork/sdk/hooks",
  "@patchwork/sdk/om",
  "@patchwork/sdk/markdown",
  "@patchwork/sdk/modules",
  "@patchwork/sdk/plugins",
  "@patchwork/sdk/router",
  "@patchwork/sdk/textAnchors",
  "@patchwork/sdk/ui",
  "@patchwork/sdk/versionControl",
  "@patchwork/sdk/utils",
  "@patchwork/sdk/shared-dependencies"
];
var EXTERNAL_DEPENDENCIES = SHARED_DEPENDENCIES.concat(
  Object.keys(SHARED_MODULES)
).concat(SDK_SUBMODULES);

// vite.config.ts
var __vite_injected_original_dirname = "/Users/pvh/Dev/patchwork/os";
var SERVICE_WORKER_MODULE_ID = "/service-worker.js";
var SERVICE_WORKER_PATH = path.join(__vite_injected_original_dirname, "service-worker.js");
function swPlugin() {
  return {
    name: "service-worker-dev",
    enforce: "pre",
    apply: "serve",
    handleHotUpdate(ctx) {
      if (ctx.file === SERVICE_WORKER_PATH) {
        ctx.server.hot.send({
          type: "full-reload"
        });
        const module = ctx.server.moduleGraph.getModuleById(
          SERVICE_WORKER_MODULE_ID
        );
        if (module != null) {
          ctx.server.moduleGraph.invalidateModule(module);
        }
        return [];
      }
    },
    async resolveId(id) {
      if (id === SERVICE_WORKER_MODULE_ID) {
        return SERVICE_WORKER_MODULE_ID;
      }
      if (id === SERVICE_WORKER_PATH) {
        return SERVICE_WORKER_PATH;
      }
      return null;
    },
    async load(id) {
      if (id === SERVICE_WORKER_MODULE_ID || id === SERVICE_WORKER_PATH) {
        const result = await build({
          absWorkingDir: __vite_injected_original_dirname,
          entryPoints: ["service-worker.js"],
          bundle: true,
          format: "iife",
          write: false
        });
        return result.outputFiles[0].text;
      }
      return null;
    }
  };
}
var generateImportMapPlugin = () => ({
  name: "shared-deps-import-map",
  async transformIndexHtml(html, { server }) {
    if (server) {
      return html;
    }
    const generator = new Generator({
      env: ["browser", "module"],
      resolutions: SHARED_MODULES
    });
    const mungedDeps = EXTERNAL_DEPENDENCIES.map((dep) => {
      if (dep === "@codemirror/view") {
        return "npm:@codemirror/view@6.36.3";
      }
      return dep;
    });
    await generator.install(mungedDeps);
    const importMap = generator.getMap();
    return {
      html,
      tags: [
        {
          tag: "script",
          attrs: {
            type: "importmap"
          },
          children: JSON.stringify(importMap, null, 2),
          injectTo: "head-prepend"
        }
      ]
    };
  }
});
var vite_config_default = defineConfig({
  plugins: [
    wasm(),
    react(),
    generateImportMapPlugin(),
    swPlugin(),
    tailwindcss()
  ],
  worker: {
    format: "es",
    plugins: () => [wasm()]
  },
  build: {
    target: "es2022",
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: (id) => {
        if (id === "@patchwork/sdk") return true;
        if (id.startsWith("@patchwork/sdk/")) return true;
        return EXTERNAL_DEPENDENCIES.includes(id);
      },
      input: {
        main: path.resolve(__vite_injected_original_dirname, "index.html")
      },
      output: {
        // We put index.css in dist instead of dist/assets so that we can link to fonts
        // using relative URLs like "./assets/font.woff2", which is the correct form
        // for deployment to trailrunner.
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "index.css") {
            return "[name][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
        entryFileNames: (chunkInfo) => {
          return "assets/[name]-[hash].js";
        },
        exports: "named"
      },
      preserveEntrySignatures: "allow-extension"
    }
  },
  define: {
    "process.env": {
      NODE_ENV: "production"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAiLi4vc2RrL3NyYy9zaGFyZWQtZGVwZW5kZW5jaWVzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3B2aC9EZXYvcGF0Y2h3b3JrL29zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcHZoL0Rldi9wYXRjaHdvcmsvb3Mvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3B2aC9EZXYvcGF0Y2h3b3JrL29zL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgR2VuZXJhdG9yIH0gZnJvbSBcIkBqc3BtL2dlbmVyYXRvclwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgYnVpbGQgfSBmcm9tIFwiZXNidWlsZFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IFBsdWdpbiwgVXNlckNvbmZpZywgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCB3YXNtIGZyb20gXCJ2aXRlLXBsdWdpbi13YXNtXCI7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XG5cbmltcG9ydCB7XG4gIFNIQVJFRF9NT0RVTEVTLFxuICBFWFRFUk5BTF9ERVBFTkRFTkNJRVMsXG59IGZyb20gXCIuLi9zZGsvc3JjL3NoYXJlZC1kZXBlbmRlbmNpZXNcIjtcblxuY29uc3QgU0VSVklDRV9XT1JLRVJfTU9EVUxFX0lEID0gXCIvc2VydmljZS13b3JrZXIuanNcIjtcbmNvbnN0IFNFUlZJQ0VfV09SS0VSX1BBVEggPSBwYXRoLmpvaW4oaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJzZXJ2aWNlLXdvcmtlci5qc1wiKTtcblxuLyoqXG4gKiBUaGlzIHBsdWdpbiBidWlsZHMgdGhlIHNlcnZpY2Ugd29ya2VyIGluIHNlcnZpY2Utd29ya2VyLmpzIHVzaW5nIGVzYnVpbGRcbiAqXG4gKiBUaGUgcmVhc29uIHRoaXMgaXMgbmVjZXNzYXJ5IGlzIHRoYXQgRmlyZWZveCBkb2VzIG5vdCBzdXBwb3J0IEVTIG1vZHVsZXMgaW5cbiAqIHNlcnZpY2Ugd29ya2VycyBzbyB3ZSBuZWVkIHRvIGJ1aWxkIGFuIElJRkUgc2NyaXB0LCBidXQgd2UgZG9uJ3Qgd2FudCB0b1xuICogdXNlIElJRkUgZXZlcnl3aGVyZSBlbHNlLlxuICovXG5mdW5jdGlvbiBzd1BsdWdpbigpOiBQbHVnaW4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6IFwic2VydmljZS13b3JrZXItZGV2XCIsXG4gICAgZW5mb3JjZTogXCJwcmVcIixcbiAgICBhcHBseTogXCJzZXJ2ZVwiLFxuICAgIGhhbmRsZUhvdFVwZGF0ZShjdHgpIHtcbiAgICAgIGlmIChjdHguZmlsZSA9PT0gU0VSVklDRV9XT1JLRVJfUEFUSCkge1xuICAgICAgICBjdHguc2VydmVyLmhvdC5zZW5kKHtcbiAgICAgICAgICB0eXBlOiBcImZ1bGwtcmVsb2FkXCIsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBtb2R1bGUgPSBjdHguc2VydmVyLm1vZHVsZUdyYXBoLmdldE1vZHVsZUJ5SWQoXG4gICAgICAgICAgU0VSVklDRV9XT1JLRVJfTU9EVUxFX0lEXG4gICAgICAgICk7XG4gICAgICAgIGlmIChtb2R1bGUgIT0gbnVsbCkge1xuICAgICAgICAgIGN0eC5zZXJ2ZXIubW9kdWxlR3JhcGguaW52YWxpZGF0ZU1vZHVsZShtb2R1bGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIHJlc29sdmVJZChpZCkge1xuICAgICAgaWYgKGlkID09PSBTRVJWSUNFX1dPUktFUl9NT0RVTEVfSUQpIHtcbiAgICAgICAgcmV0dXJuIFNFUlZJQ0VfV09SS0VSX01PRFVMRV9JRDtcbiAgICAgIH1cbiAgICAgIGlmIChpZCA9PT0gU0VSVklDRV9XT1JLRVJfUEFUSCkge1xuICAgICAgICByZXR1cm4gU0VSVklDRV9XT1JLRVJfUEFUSDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG4gICAgYXN5bmMgbG9hZChpZCkge1xuICAgICAgaWYgKGlkID09PSBTRVJWSUNFX1dPUktFUl9NT0RVTEVfSUQgfHwgaWQgPT09IFNFUlZJQ0VfV09SS0VSX1BBVEgpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYnVpbGQoe1xuICAgICAgICAgIGFic1dvcmtpbmdEaXI6IGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gICAgICAgICAgZW50cnlQb2ludHM6IFtcInNlcnZpY2Utd29ya2VyLmpzXCJdLFxuICAgICAgICAgIGJ1bmRsZTogdHJ1ZSxcbiAgICAgICAgICBmb3JtYXQ6IFwiaWlmZVwiLFxuICAgICAgICAgIHdyaXRlOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN1bHQub3V0cHV0RmlsZXNbMF0udGV4dDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG4gIH07XG59XG5cbi8vIEdlbmVyYXRlcyBhbiBpbXBvcnQgbWFwIGZvciB0aGUgZXh0ZXJuYWwgZGVwZW5kZW5jaWVzXG5jb25zdCBnZW5lcmF0ZUltcG9ydE1hcFBsdWdpbiA9ICgpOiBQbHVnaW4gPT4gKHtcbiAgbmFtZTogXCJzaGFyZWQtZGVwcy1pbXBvcnQtbWFwXCIsXG4gIGFzeW5jIHRyYW5zZm9ybUluZGV4SHRtbChodG1sLCB7IHNlcnZlciB9KSB7XG4gICAgLy8gZG8gbm90aGluZyBpbiBkZXYgbW9kZVxuICAgIGlmIChzZXJ2ZXIpIHtcbiAgICAgIHJldHVybiBodG1sO1xuICAgIH1cblxuICAgIC8vIGluIGJ1aWxkIG1vZGUgZ2VuZXJhdGUgaW1wb3J0IG1hcFxuICAgIGNvbnN0IGdlbmVyYXRvciA9IG5ldyBHZW5lcmF0b3Ioe1xuICAgICAgZW52OiBbXCJicm93c2VyXCIsIFwibW9kdWxlXCJdLFxuICAgICAgcmVzb2x1dGlvbnM6IFNIQVJFRF9NT0RVTEVTLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbXVuZ2VkRGVwcyA9IEVYVEVSTkFMX0RFUEVOREVOQ0lFUy5tYXAoKGRlcCkgPT4ge1xuICAgICAgaWYgKGRlcCA9PT0gXCJAY29kZW1pcnJvci92aWV3XCIpIHtcbiAgICAgICAgcmV0dXJuIFwibnBtOkBjb2RlbWlycm9yL3ZpZXdANi4zNi4zXCI7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVwO1xuICAgIH0pO1xuICAgIGF3YWl0IGdlbmVyYXRvci5pbnN0YWxsKG11bmdlZERlcHMpO1xuICAgIGNvbnN0IGltcG9ydE1hcCA9IGdlbmVyYXRvci5nZXRNYXAoKTtcblxuICAgIHJldHVybiB7XG4gICAgICBodG1sLFxuICAgICAgdGFnczogW1xuICAgICAgICB7XG4gICAgICAgICAgdGFnOiBcInNjcmlwdFwiLFxuICAgICAgICAgIGF0dHJzOiB7XG4gICAgICAgICAgICB0eXBlOiBcImltcG9ydG1hcFwiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY2hpbGRyZW46IEpTT04uc3RyaW5naWZ5KGltcG9ydE1hcCwgbnVsbCwgMiksXG4gICAgICAgICAgaW5qZWN0VG86IFwiaGVhZC1wcmVwZW5kXCIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG4gIH0sXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHdhc20oKSxcbiAgICByZWFjdCgpLFxuICAgIGdlbmVyYXRlSW1wb3J0TWFwUGx1Z2luKCksXG4gICAgc3dQbHVnaW4oKSxcbiAgICB0YWlsd2luZGNzcygpLFxuICBdLFxuXG4gIHdvcmtlcjoge1xuICAgIGZvcm1hdDogXCJlc1wiLFxuICAgIHBsdWdpbnM6ICgpID0+IFt3YXNtKCldLFxuICB9LFxuXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiBcImVzMjAyMlwiLFxuICAgIG1pbmlmeTogZmFsc2UsXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiAoaWQpID0+IHtcbiAgICAgICAgLy8gTW9yZSBwcmVjaXNlIGV4dGVybmFsIG1hdGNoaW5nXG4gICAgICAgIGlmIChpZCA9PT0gXCJAcGF0Y2h3b3JrL3Nka1wiKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKGlkLnN0YXJ0c1dpdGgoXCJAcGF0Y2h3b3JrL3Nkay9cIikpIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gRVhURVJOQUxfREVQRU5ERU5DSUVTLmluY2x1ZGVzKGlkKTtcbiAgICAgIH0sXG4gICAgICBpbnB1dDoge1xuICAgICAgICBtYWluOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcImluZGV4Lmh0bWxcIiksXG4gICAgICB9LFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIFdlIHB1dCBpbmRleC5jc3MgaW4gZGlzdCBpbnN0ZWFkIG9mIGRpc3QvYXNzZXRzIHNvIHRoYXQgd2UgY2FuIGxpbmsgdG8gZm9udHNcbiAgICAgICAgLy8gdXNpbmcgcmVsYXRpdmUgVVJMcyBsaWtlIFwiLi9hc3NldHMvZm9udC53b2ZmMlwiLCB3aGljaCBpcyB0aGUgY29ycmVjdCBmb3JtXG4gICAgICAgIC8vIGZvciBkZXBsb3ltZW50IHRvIHRyYWlscnVubmVyLlxuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgIGlmIChhc3NldEluZm8ubmFtZSA9PT0gXCJpbmRleC5jc3NcIikge1xuICAgICAgICAgICAgcmV0dXJuIFwiW25hbWVdW2V4dG5hbWVdXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIEZvciBhbGwgb3RoZXIgYXNzZXRzLCBrZWVwIHRoZSBkZWZhdWx0IGJlaGF2aW9yXG4gICAgICAgICAgcmV0dXJuIFwiYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1cIjtcbiAgICAgICAgfSxcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6IChjaHVua0luZm8pID0+IHtcbiAgICAgICAgICByZXR1cm4gXCJhc3NldHMvW25hbWVdLVtoYXNoXS5qc1wiOyAvLyBEZWZhdWx0IGJlaGF2aW9yIGZvciBvdGhlciBlbnRyaWVzXG4gICAgICAgIH0sXG4gICAgICAgIGV4cG9ydHM6IFwibmFtZWRcIixcbiAgICAgIH0sXG4gICAgICBwcmVzZXJ2ZUVudHJ5U2lnbmF0dXJlczogXCJhbGxvdy1leHRlbnNpb25cIixcbiAgICB9LFxuICB9LFxuXG4gIGRlZmluZToge1xuICAgIFwicHJvY2Vzcy5lbnZcIjoge1xuICAgICAgTk9ERV9FTlY6IFwicHJvZHVjdGlvblwiLFxuICAgIH0sXG4gIH0sXG59IHNhdGlzZmllcyBVc2VyQ29uZmlnKTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3B2aC9EZXYvcGF0Y2h3b3JrL3Nkay9zcmNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9wdmgvRGV2L3BhdGNod29yay9zZGsvc3JjL3NoYXJlZC1kZXBlbmRlbmNpZXMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3B2aC9EZXYvcGF0Y2h3b3JrL3Nkay9zcmMvc2hhcmVkLWRlcGVuZGVuY2llcy50c1wiOy8vIFRoaXMgaXMgYSBCVUlMRCBUSU1FIGZpbGUsIHVzZWQgdG8gdHJhY2sgZGVwZW5kZW5jaWVzIHRoYXQgYWxsIHBhdGNod29yayBTREsgcHJvamVjdHNcbi8vIGNhbi9zaG91bGQgcmVseSBvbiBleGlzdGluZyBhdCBydW50aW1lLlxuXG4vLyBUaGlzIGlzIHJlYWxseSBhIHByb3Zpc2lvbmFsIHNvbHV0aW9uIHRvIGhlbHAgdGhlIGV4aXN0aW5nIHZpdGUuY29uZmlncyBhcyB3ZSBmaWd1cmUgb3V0IHdoYXQgdG8gZG8gbmV4dC5cblxuZXhwb3J0IGNvbnN0IFNIQVJFRF9ERVBFTkRFTkNJRVMgPSBbXG4gIFwiQGF1dG9tZXJnZS9hdXRvbWVyZ2UtcmVwb1wiLFxuICBcIkBhdXRvbWVyZ2UvYXV0b21lcmdlLXJlcG8tcmVhY3QtaG9va3NcIixcbiAgXCJAYXV0b21lcmdlL2F1dG9tZXJnZVwiLFxuICBcIkBjb2RlbWlycm9yL2F1dG9jb21wbGV0ZVwiLFxuICBcIkBjb2RlbWlycm9yL2NvbW1hbmRzXCIsXG4gIFwiQGNvZGVtaXJyb3IvbGFuZy1tYXJrZG93blwiLFxuICBcIkBjb2RlbWlycm9yL2xhbmd1YWdlXCIsXG4gIFwiQGNvZGVtaXJyb3IvbGFuZ3VhZ2UtZGF0YVwiLFxuICBcIkBjb2RlbWlycm9yL3NlYXJjaFwiLFxuICBcIkBjb2RlbWlycm9yL3N0YXRlXCIsXG4gIFwiQGNvZGVtaXJyb3Ivdmlld1wiLFxuICBcInJlYWN0XCIsXG4gIFwicmVhY3QtZG9tXCIsXG4gIFwicmVhY3QtZG9tL2NsaWVudFwiLFxuICBcInJlYWN0LWRvbS9zZXJ2ZXJcIixcbiAgXCJyZWFjdC9qc3gtcnVudGltZVwiLFxuICBcIkBhdXRvbWVyZ2UvYXV0b21lcmdlL3NsaW1cIixcbiAgXCJAYXV0b21lcmdlL2F1dG9tZXJnZS9zbGltL25leHRcIixcbiAgXCJsdWNpZGUtcmVhY3RcIixcbiAgXCJzaWduaWFcIixcbl07XG5cbi8vIEludGVybmFsIG1vZHVsZXMgdGhhdCBhcmUgc2hhcmVkIHdpdGggZHluYW1pY2FsbHkgbG9hZGVkIHBhY2thZ2VzXG5leHBvcnQgY29uc3QgU0hBUkVEX01PRFVMRVMgPSB7XG4gIC8vIFNESyBtb2R1bGVzXG4gIFwiQHBhdGNod29yay9zZGtcIjogXCJmaWxlOi4uL3Nkay9cIixcblxuICBcIkBwYXRjaHdvcmsvZGF0YWdyaWRcIjogXCJmaWxlOi4uL3BhY2thZ2VzL2RhdGFncmlkXCIsXG4gIFwiQHBhdGNod29yay9lc3NheVwiOiBcImZpbGU6Li4vcGFja2FnZXMvZXNzYXlcIixcbiAgXCJAcGF0Y2h3b3JrL2ZpbGVcIjogXCJmaWxlOi4uL3BhY2thZ2VzL2ZpbGVcIixcbiAgXCJAcGF0Y2h3b3JrL2ZvbGRlclwiOiBcImZpbGU6Li4vcGFja2FnZXMvZm9sZGVyXCIsXG4gIFwiQHBhdGNod29yay9qYWNxdWFyZFwiOiBcImZpbGU6Li4vcGFja2FnZXMvamFjcXVhcmRcIixcbiAgXCJAcGF0Y2h3b3JrL2thbmJhblwiOiBcImZpbGU6Li4vcGFja2FnZXMva2FuYmFuXCIsXG4gIFwiQHBhdGNod29yay9teS10b29sc1wiOiBcImZpbGU6Li4vcGFja2FnZXMvbXktdG9vbHNcIixcbiAgXCJAcGF0Y2h3b3JrL3Jhdy1lZGl0b3JcIjogXCJmaWxlOi4uL3BhY2thZ2VzL3Jhdy1lZGl0b3JcIixcbiAgXCJAcGF0Y2h3b3JrL3RsZHJhd1wiOiBcImZpbGU6Li4vcGFja2FnZXMvdGxkcmF3XCIsXG59O1xuXG5leHBvcnQgY29uc3QgU0RLX1NVQk1PRFVMRVMgPSBbXG4gIFwiQHBhdGNod29yay9zZGsvYXN5bmMtc2lnbmFsc1wiLFxuICBcIkBwYXRjaHdvcmsvc2RrL2NvbXBvbmVudHNcIixcbiAgXCJAcGF0Y2h3b3JrL3Nkay9lbWJlZFwiLFxuICBcIkBwYXRjaHdvcmsvc2RrL2ZpbGVzXCIsXG4gIFwiQHBhdGNod29yay9zZGsvaG9va3NcIixcbiAgXCJAcGF0Y2h3b3JrL3Nkay9vbVwiLFxuICBcIkBwYXRjaHdvcmsvc2RrL21hcmtkb3duXCIsXG4gIFwiQHBhdGNod29yay9zZGsvbW9kdWxlc1wiLFxuICBcIkBwYXRjaHdvcmsvc2RrL3BsdWdpbnNcIixcbiAgXCJAcGF0Y2h3b3JrL3Nkay9yb3V0ZXJcIixcbiAgXCJAcGF0Y2h3b3JrL3Nkay90ZXh0QW5jaG9yc1wiLFxuICBcIkBwYXRjaHdvcmsvc2RrL3VpXCIsXG4gIFwiQHBhdGNod29yay9zZGsvdmVyc2lvbkNvbnRyb2xcIixcbiAgXCJAcGF0Y2h3b3JrL3Nkay91dGlsc1wiLFxuICBcIkBwYXRjaHdvcmsvc2RrL3NoYXJlZC1kZXBlbmRlbmNpZXNcIixcbl07XG5cbi8vIEFsbCBkZXBlbmRlbmNpZXMgdGhhdCBzaG91bGQgbm90IGJlIGJ1bmRsZWQgaW4gYW5kIGluc3RlYWQgYXJlIGxvYWRlZFxuLy8gdGhyb3VnaCB0aGUgaW1wb3J0IG1hcCBjcmVhdGVkIGJ5IGdlbmVyYXRlSW1wb3J0TWFwUGx1Z2luXG5leHBvcnQgY29uc3QgRVhURVJOQUxfREVQRU5ERU5DSUVTID0gU0hBUkVEX0RFUEVOREVOQ0lFUy5jb25jYXQoXG4gIE9iamVjdC5rZXlzKFNIQVJFRF9NT0RVTEVTKVxuKS5jb25jYXQoU0RLX1NVQk1PRFVMRVMpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFtUSxTQUFTLGlCQUFpQjtBQUM3UixPQUFPLFdBQVc7QUFDbEIsU0FBUyxhQUFhO0FBQ3RCLE9BQU8sVUFBVTtBQUNqQixTQUE2QixvQkFBb0I7QUFDakQsT0FBTyxVQUFVO0FBQ2pCLE9BQU8saUJBQWlCOzs7QUNEakIsSUFBTSxzQkFBc0I7QUFBQSxFQUNqQztBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDRjtBQUdPLElBQU0saUJBQWlCO0FBQUE7QUFBQSxFQUU1QixrQkFBa0I7QUFBQSxFQUVsQix1QkFBdUI7QUFBQSxFQUN2QixvQkFBb0I7QUFBQSxFQUNwQixtQkFBbUI7QUFBQSxFQUNuQixxQkFBcUI7QUFBQSxFQUNyQix1QkFBdUI7QUFBQSxFQUN2QixxQkFBcUI7QUFBQSxFQUNyQix1QkFBdUI7QUFBQSxFQUN2Qix5QkFBeUI7QUFBQSxFQUN6QixxQkFBcUI7QUFDdkI7QUFFTyxJ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
