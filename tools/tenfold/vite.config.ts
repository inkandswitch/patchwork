import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

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
    rollupOptions: {
      external(id) {
        return !!id.match(
          /^((@automerge\/automerge(-repo)?(\/.*)?)|solid-js(\/.*)?|@patchwork\/.*|@codemirror\/state)$/
        );
      },
    },
  },
});
