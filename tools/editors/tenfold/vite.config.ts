import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import externals from "@inkandswitch/patchwork-bootloader/externals";
import { toolPackage } from "@inkandswitch/patchwork-bootloader/vite/tool-package";

export default defineConfig({
  base: "./",
  plugins: [solid(), toolPackage()],
  build: {
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        index: "src/index.tsx",
        "tools/tenfold": "src/tool.tsx",
        "mount-datatype": "src/mount-datatype.ts",
        "mount-tool": "src/mount-tool.tsx",
        "mount-file-viewer": "src/mount-file-viewer.tsx",
      },
      formats: ["es"],
    },
    rollupOptions: { external: externals },
  },
});
