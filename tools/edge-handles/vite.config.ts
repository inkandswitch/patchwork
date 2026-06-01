import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import external from "@inkandswitch/patchwork-bootloader/externals";

export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: { external },
    sourcemap: true,
    target: "esnext",
    minify: false,
  },
});
