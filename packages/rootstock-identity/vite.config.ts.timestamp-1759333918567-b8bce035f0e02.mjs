// vite.config.ts
import { defineConfig } from "file:///Users/jtfmumm/dev/gaios/node_modules/.pnpm/vite@5.4.20_@types+node@20.19.19_less@4.4.1_lightningcss@1.30.1_sass@1.92.1_stylus@0.64.0_terser@5.37.0/node_modules/vite/dist/node/index.js";
import { execSync } from "node:child_process";
import wasm from "file:///Users/jtfmumm/dev/gaios/node_modules/.pnpm/vite-plugin-wasm@3.5.0_vite@5.4.20_@types+node@20.19.19_less@4.4.1_lightningcss@1.30.1_sass@1_dgb5kltuv2xqxen5r3uj36rdke/node_modules/vite-plugin-wasm/exports/import.mjs";
import typescript from "file:///Users/jtfmumm/dev/gaios/node_modules/.pnpm/@rollup+plugin-typescript@11.1.6_rollup@4.52.3_tslib@2.8.1_typescript@5.9.3/node_modules/@rollup/plugin-typescript/dist/es/index.js";
import postcss from "file:///Users/jtfmumm/dev/gaios/node_modules/.pnpm/rollup-plugin-postcss@4.0.2_postcss@8.5.6/node_modules/rollup-plugin-postcss/dist/index.js";
import commonjs from "file:///Users/jtfmumm/dev/gaios/node_modules/.pnpm/@rollup+plugin-commonjs@26.0.3_rollup@4.52.3/node_modules/@rollup/plugin-commonjs/dist/es/index.js";
import replace from "file:///Users/jtfmumm/dev/gaios/node_modules/.pnpm/@rollup+plugin-replace@6.0.2_rollup@4.52.3/node_modules/@rollup/plugin-replace/dist/es/index.js";
var vite_config_default = defineConfig({
  plugins: [wasm()],
  build: {
    target: ["firefox137", "chrome137"],
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        index: "src/index.ts"
      },
      name: "Rootstock-Identity",
      formats: ["es"],
      fileName: (format) => `index.js`
    },
    rollupOptions: {
      plugins: [
        replace({
          preventAssignment: true,
          "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
          __ROOTSTOCK_VERSION__: JSON.stringify({
            gitHash: execSync("git rev-parse HEAD", {
              encoding: "utf8"
            }).trim(),
            buildTimestamp: Date.now()
          })
        }),
        typescript({
          // Enable declaration file generation in the TypeScript plugin
          declaration: true,
          declarationDir: "./dist",
          exclude: ["**/*.test.ts", "**/*.test.tsx"]
        }),
        postcss({ extensions: [".css"] }),
        commonjs({
          include: /node_modules/,
          requireReturnsDefault: "auto"
        })
      ],
      external(id) {
        return id.startsWith("@automerge/") || id.startsWith("@keyhive/") || id == "debug" || // TODO(chee): temporary while rootstock-patchwork-react-shim is a requirement
        ["react/jsx-runtime", "react-dom/client"].includes(id);
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js"
      }
    }
  },
  define: {
    "import.meta.env": process.env
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvanRmbXVtbS9kZXYvZ2Fpb3MvcGFja2FnZXMvcm9vdHN0b2NrLWlkZW50aXR5XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvanRmbXVtbS9kZXYvZ2Fpb3MvcGFja2FnZXMvcm9vdHN0b2NrLWlkZW50aXR5L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9qdGZtdW1tL2Rldi9nYWlvcy9wYWNrYWdlcy9yb290c3RvY2staWRlbnRpdHkvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tIFwibm9kZTpjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgd2FzbSBmcm9tIFwidml0ZS1wbHVnaW4td2FzbVwiO1xuXG5pbXBvcnQgdHlwZXNjcmlwdCBmcm9tIFwiQHJvbGx1cC9wbHVnaW4tdHlwZXNjcmlwdFwiO1xuaW1wb3J0IHBvc3Rjc3MgZnJvbSBcInJvbGx1cC1wbHVnaW4tcG9zdGNzc1wiO1xuaW1wb3J0IGNvbW1vbmpzIGZyb20gXCJAcm9sbHVwL3BsdWdpbi1jb21tb25qc1wiO1xuaW1wb3J0IHJlcGxhY2UgZnJvbSBcIkByb2xsdXAvcGx1Z2luLXJlcGxhY2VcIjtcblxuLy8gVE9ETyAoY2hlZSkgbm90IHN1cmUgdGhlcmUncyBhbnkgcmVhc29uIGZvciB0aGlzIHRvIGJlIHZpdGUgYW55bW9yZVxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3dhc20oKV0sXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiBbXCJmaXJlZm94MTM3XCIsIFwiY2hyb21lMTM3XCJdLFxuICAgIG1pbmlmeTogZmFsc2UsXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHtcbiAgICAgICAgaW5kZXg6IFwic3JjL2luZGV4LnRzXCIsXG4gICAgICB9LFxuICAgICAgbmFtZTogXCJSb290c3RvY2stSWRlbnRpdHlcIixcbiAgICAgIGZvcm1hdHM6IFtcImVzXCJdLFxuICAgICAgZmlsZU5hbWU6IChmb3JtYXQpID0+IGBpbmRleC5qc2AsXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBwbHVnaW5zOiBbXG4gICAgICAgIHJlcGxhY2Uoe1xuICAgICAgICAgIHByZXZlbnRBc3NpZ25tZW50OiB0cnVlLFxuICAgICAgICAgIFwicHJvY2Vzcy5lbnYuTk9ERV9FTlZcIjogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuTk9ERV9FTlYpLFxuICAgICAgICAgIF9fUk9PVFNUT0NLX1ZFUlNJT05fXzogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgZ2l0SGFzaDogZXhlY1N5bmMoXCJnaXQgcmV2LXBhcnNlIEhFQURcIiwge1xuICAgICAgICAgICAgICBlbmNvZGluZzogXCJ1dGY4XCIsXG4gICAgICAgICAgICB9KS50cmltKCksXG4gICAgICAgICAgICBidWlsZFRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSksXG4gICAgICAgIHR5cGVzY3JpcHQoe1xuICAgICAgICAgIC8vIEVuYWJsZSBkZWNsYXJhdGlvbiBmaWxlIGdlbmVyYXRpb24gaW4gdGhlIFR5cGVTY3JpcHQgcGx1Z2luXG4gICAgICAgICAgZGVjbGFyYXRpb246IHRydWUsXG4gICAgICAgICAgZGVjbGFyYXRpb25EaXI6IFwiLi9kaXN0XCIsXG4gICAgICAgICAgZXhjbHVkZTogW1wiKiovKi50ZXN0LnRzXCIsIFwiKiovKi50ZXN0LnRzeFwiXSxcbiAgICAgICAgfSksXG4gICAgICAgIHBvc3Rjc3MoeyBleHRlbnNpb25zOiBbXCIuY3NzXCJdIH0pLFxuICAgICAgICBjb21tb25qcyh7XG4gICAgICAgICAgaW5jbHVkZTogL25vZGVfbW9kdWxlcy8sXG4gICAgICAgICAgcmVxdWlyZVJldHVybnNEZWZhdWx0OiBcImF1dG9cIixcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgICAgZXh0ZXJuYWwoaWQpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICBpZC5zdGFydHNXaXRoKFwiQGF1dG9tZXJnZS9cIikgfHxcbiAgICAgICAgICBpZC5zdGFydHNXaXRoKFwiQGtleWhpdmUvXCIpIHx8XG4gICAgICAgICAgaWQgPT0gXCJkZWJ1Z1wiIHx8XG4gICAgICAgICAgLy8gVE9ETyhjaGVlKTogdGVtcG9yYXJ5IHdoaWxlIHJvb3RzdG9jay1wYXRjaHdvcmstcmVhY3Qtc2hpbSBpcyBhIHJlcXVpcmVtZW50XG4gICAgICAgICAgW1wicmVhY3QvanN4LXJ1bnRpbWVcIiwgXCJyZWFjdC1kb20vY2xpZW50XCJdLmluY2x1ZGVzKGlkKVxuICAgICAgICApO1xuICAgICAgfSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBlbnRyeUZpbGVOYW1lczogXCJbbmFtZV0uanNcIixcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6IFwiY2h1bmtzL1tuYW1lXS5qc1wiLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBkZWZpbmU6IHtcbiAgICBcImltcG9ydC5tZXRhLmVudlwiOiBwcm9jZXNzLmVudixcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4VSxTQUFTLG9CQUFvQjtBQUMzVyxTQUFTLGdCQUFnQjtBQUN6QixPQUFPLFVBQVU7QUFFakIsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxhQUFhO0FBQ3BCLE9BQU8sY0FBYztBQUNyQixPQUFPLGFBQWE7QUFHcEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQ2hCLE9BQU87QUFBQSxJQUNMLFFBQVEsQ0FBQyxjQUFjLFdBQVc7QUFBQSxJQUNsQyxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxLQUFLO0FBQUEsTUFDSCxPQUFPO0FBQUEsUUFDTCxPQUFPO0FBQUEsTUFDVDtBQUFBLE1BQ0EsTUFBTTtBQUFBLE1BQ04sU0FBUyxDQUFDLElBQUk7QUFBQSxNQUNkLFVBQVUsQ0FBQyxXQUFXO0FBQUEsSUFDeEI7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFNBQVM7QUFBQSxRQUNQLFFBQVE7QUFBQSxVQUNOLG1CQUFtQjtBQUFBLFVBQ25CLHdCQUF3QixLQUFLLFVBQVUsUUFBUSxJQUFJLFFBQVE7QUFBQSxVQUMzRCx1QkFBdUIsS0FBSyxVQUFVO0FBQUEsWUFDcEMsU0FBUyxTQUFTLHNCQUFzQjtBQUFBLGNBQ3RDLFVBQVU7QUFBQSxZQUNaLENBQUMsRUFBRSxLQUFLO0FBQUEsWUFDUixnQkFBZ0IsS0FBSyxJQUFJO0FBQUEsVUFDM0IsQ0FBQztBQUFBLFFBQ0gsQ0FBQztBQUFBLFFBQ0QsV0FBVztBQUFBO0FBQUEsVUFFVCxhQUFhO0FBQUEsVUFDYixnQkFBZ0I7QUFBQSxVQUNoQixTQUFTLENBQUMsZ0JBQWdCLGVBQWU7QUFBQSxRQUMzQyxDQUFDO0FBQUEsUUFDRCxRQUFRLEVBQUUsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQUEsUUFDaEMsU0FBUztBQUFBLFVBQ1AsU0FBUztBQUFBLFVBQ1QsdUJBQXVCO0FBQUEsUUFDekIsQ0FBQztBQUFBLE1BQ0g7QUFBQSxNQUNBLFNBQVMsSUFBSTtBQUNYLGVBQ0UsR0FBRyxXQUFXLGFBQWEsS0FDM0IsR0FBRyxXQUFXLFdBQVcsS0FDekIsTUFBTTtBQUFBLFFBRU4sQ0FBQyxxQkFBcUIsa0JBQWtCLEVBQUUsU0FBUyxFQUFFO0FBQUEsTUFFekQ7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLG1CQUFtQixRQUFRO0FBQUEsRUFDN0I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
