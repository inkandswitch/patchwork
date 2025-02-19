import { defineConfig } from "tsup";
import { EXTERNAL_DEPENDENCIES } from "./dist/shared-dependencies";

export default defineConfig({
  platform: "browser",
  entry: {
    index: "src/index.ts",
    "async-signals": "src/async-signals/index.ts",
    "borrowed-bits": "src/borrowed-bits/index.ts",
    components: "src/components/index.ts",
    files: "src/files/index.ts",
    hooks: "src/hooks/index.ts",
    om: "src/om.ts",
    markdown: "src/markdown/index.ts",
    router: "src/router/index.ts",
    textAnchors: "src/textAnchors/index.ts",
    ui: "src/ui/index.ts",
    versionControl: "src/versionControl/index.ts",
    utils: "src/utils.ts",
    "shared-dependencies": "src/shared-dependencies.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: false,
  outDir: "dist",
});
