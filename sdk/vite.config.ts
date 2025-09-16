import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import tsconfigPaths from "vite-tsconfig-paths";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    topLevelAwait(),
    wasm(),
    dts({
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      // Enable declaration file generation for multiple entries
      copyDtsFiles: true,
      // Specify output directory for .d.ts files
      outDir: "dist",
      // Handle multiple entry points
      entryRoot: "src",
      insertTypesEntry: true,
    }),
    replace({
      preventAssignment: true,
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    }),
  ],
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        index: "src/index.ts",
        embed: "src/elements/rootstock-tool.ts",
        files: "src/files/index.ts",
        modules: "src/modules/index.ts",
        plugins: "src/plugins/index.ts",
      },
      name: "PatchworkSDK",
      formats: ["es"],
      fileName: (format) => `index.js`,
    },
    rollupOptions: {
      plugins: [
        typescript({
          // Enable declaration file generation in the TypeScript plugin
          declaration: true,
          declarationDir: "./dist",
          exclude: ["**/*.test.ts", "**/*.test.tsx"],
        }),
        postcss({ extensions: [".css"] }),
        commonjs({
          include: /node_modules/,
          requireReturnsDefault: "auto",
        }),
      ],
      external: (id) => id.startsWith("@automerge/"),
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
      },
    },
  },
  define: {
    "import.meta.env": process.env,
  },
});
