import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import patchwork from "@patchwork/bootloader/vite";

export default defineConfig({
  plugins: [
    wasm(),
    patchwork({
      syncServerStorageId: "3760df37-a4c6-4f66-9ecd-732039a9385d",
      syncServerUrl: "wss://sync3.automerge.org",
      importmap: {
        // patchwork tool compat
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
          "@automerge/automerge-repo-react-hooks":
            "https://ga.jspm.io/npm:@automerge/automerge-repo-react-hooks@2.2.0/dist/index.js",
          "@patchwork/sdk":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/index.js",
          "@patchwork/sdk/async-signals":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/async-signals.js",
          "@patchwork/sdk/components":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/components.js",
          "@patchwork/sdk/embed":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/embed.js",
          "@patchwork/sdk/files":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/files.js",
          "@patchwork/sdk/hooks":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/hooks.js",
          "@patchwork/sdk/llm":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/llm.js",
          "@patchwork/sdk/markdown":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/markdown.js",
          "@patchwork/sdk/modules":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/modules.js",
          "@patchwork/sdk/om":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/om.js",
          "@patchwork/sdk/plugins":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/plugins.js",
          "@patchwork/sdk/router":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/router.js",
          "@patchwork/sdk/shared-dependencies":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/shared-dependencies.js",
          "@patchwork/sdk/textAnchors":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/textAnchors.js",
          "@patchwork/sdk/ui":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/ui.js",
          "@patchwork/sdk/utils":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/utils.js",
          "@patchwork/sdk/versionControl":
            "/automerge/automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46/dist/versionControl.js",

          scheduler: "https://ga.jspm.io/npm:scheduler@0.23.2/index.js",
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
  },
  server: {
    port: process.env.PORT ? +process.env.PORT : undefined,
  },
});
