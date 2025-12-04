import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import externals from "@inkandswitch/patchwork-bootloader/externals";

export default defineConfig({
  base: "./",
  plugins: [solid()],
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        index: "src/index.tsx",
        "tools/tenfold": "src/tool.tsx",
      },
      formats: ["es"],
    },
    rollupOptions: { external: externals },
  },
});
