import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      entryRoot: "src",
      outDir: "dist",
      include: ["src/**/*"],
      exclude: ["src/**/*.test.*"],
      insertTypesEntry: true,
    }),
  ],
  build: {
    minify: false,
    lib: {
      entry: {
        index: "src/index.ts",
        react: "src/frameworks/react.ts",
        solid: "src/frameworks/solid.ts",
        diff: "src/apis/diff.ts",
        selection: "src/apis/selection.ts",
        comments: "src/apis/comments.ts",
      },
      fileName: (format, entryName) => `${entryName}.js`,
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "react",
        "solid-js",
        "@automerge/automerge-repo",
        "@automerge/automerge-repo-react-hooks",
        "@automerge/automerge",
      ],
      preserveEntrySignatures: "allow-extension",
      output: {
        format: "es",
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
    target: "esnext",
  },
});
