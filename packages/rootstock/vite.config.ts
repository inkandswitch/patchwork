import { defineConfig } from "vite";
import { execSync } from "node:child_process";

import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

// TODO (chee) not sure there's any reason for this to be vite anymore
export default defineConfig({
  plugins: [],
  build: {
    target: ["firefox137", "chrome137"],
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        index: "src/index.ts",
        "rootstock-tool": "src/elements/rootstock-tool.ts",
        datatypes: "src/datatypes/index.ts",
        files: "src/files/index.ts",
        modules: "src/modules/index.ts",
        plugins: "src/plugins/index.ts",
      },
      name: "Rootstock",
      formats: ["es"],
      fileName: (format) => `index.js`,
    },
    rollupOptions: {
      plugins: [
        replace({
          preventAssignment: true,
          "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
          __ROOTSTOCK_VERSION__: JSON.stringify({
            gitHash: execSync("git rev-parse HEAD", {
              encoding: "utf8",
            }).trim(),
            buildTimestamp: Date.now(),
          }),
        }),
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
      external(id) {
        return (
          id.startsWith("@automerge/") ||
          id == "debug" ||
          // TODO(chee): temporary while rootstock-patchwork-react-shim is a requirement
          ["react/jsx-runtime", "react-dom/client"].includes(id)
        );
      },
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
