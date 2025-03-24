// vite.config.ts
import react from "file:///Users/pvh/Dev/patchwork/node_modules/.pnpm/@vitejs+plugin-react@4.3.4_vite@5.4.14_@types+node@22.10.9_lightningcss@1.29.1_terser@5.37.0_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///Users/pvh/Dev/patchwork/node_modules/.pnpm/vite@5.4.14_@types+node@22.10.9_lightningcss@1.29.1_terser@5.37.0/node_modules/vite/dist/node/index.js";
import topLevelAwait from "file:///Users/pvh/Dev/patchwork/node_modules/.pnpm/vite-plugin-top-level-await@1.4.4_@swc+helpers@0.5.15_rollup@4.31.0_vite@5.4.14_@types+node@2_665eucm5u3vbarivvjjomjagzm/node_modules/vite-plugin-top-level-await/exports/import.mjs";
import wasm from "file:///Users/pvh/Dev/patchwork/node_modules/.pnpm/vite-plugin-wasm@3.4.1_vite@5.4.14_@types+node@22.10.9_lightningcss@1.29.1_terser@5.37.0_/node_modules/vite-plugin-wasm/exports/import.mjs";
import cssInjectedByJsPlugin from "file:///Users/pvh/Dev/patchwork/node_modules/.pnpm/vite-plugin-css-injected-by-js@3.5.2_vite@5.4.14_@types+node@22.10.9_lightningcss@1.29.1_terser@5.37.0_/node_modules/vite-plugin-css-injected-by-js/dist/esm/index.js";
import { EXTERNAL_DEPENDENCIES } from "file:///Users/pvh/Dev/patchwork/sdk/dist/shared-dependencies.js";
var vite_config_default = defineConfig({
  base: "./",
  plugins: [topLevelAwait(), wasm(), react(), cssInjectedByJsPlugin()],
  build: {
    rollupOptions: {
      external: EXTERNAL_DEPENDENCIES,
      input: "./src/index.ts",
      output: {
        format: "es",
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name][extname]"
      },
      preserveEntrySignatures: "strict"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcHZoL0Rldi9wYXRjaHdvcmsvcGFja2FnZXMvbXktdG9vbHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9wdmgvRGV2L3BhdGNod29yay9wYWNrYWdlcy9teS10b29scy92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcHZoL0Rldi9wYXRjaHdvcmsvcGFja2FnZXMvbXktdG9vbHMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHRvcExldmVsQXdhaXQgZnJvbSBcInZpdGUtcGx1Z2luLXRvcC1sZXZlbC1hd2FpdFwiO1xuaW1wb3J0IHdhc20gZnJvbSBcInZpdGUtcGx1Z2luLXdhc21cIjtcbmltcG9ydCBjc3NJbmplY3RlZEJ5SnNQbHVnaW4gZnJvbSBcInZpdGUtcGx1Z2luLWNzcy1pbmplY3RlZC1ieS1qc1wiO1xuXG5pbXBvcnQgeyBFWFRFUk5BTF9ERVBFTkRFTkNJRVMgfSBmcm9tIFwiQHBhdGNod29yay9zZGsvc2hhcmVkLWRlcGVuZGVuY2llc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBiYXNlOiBcIi4vXCIsXG4gIHBsdWdpbnM6IFt0b3BMZXZlbEF3YWl0KCksIHdhc20oKSwgcmVhY3QoKSwgY3NzSW5qZWN0ZWRCeUpzUGx1Z2luKCldLFxuXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6IEVYVEVSTkFMX0RFUEVOREVOQ0lFUyxcbiAgICAgIGlucHV0OiBcIi4vc3JjL2luZGV4LnRzXCIsXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgZm9ybWF0OiBcImVzXCIsXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiBcIltuYW1lXS5qc1wiLFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogXCJhc3NldHMvW25hbWVdLVtoYXNoXS5qc1wiLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogXCJhc3NldHMvW25hbWVdW2V4dG5hbWVdXCIsXG4gICAgICB9LFxuICAgICAgcHJlc2VydmVFbnRyeVNpZ25hdHVyZXM6IFwic3RyaWN0XCIsXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFnVCxPQUFPLFdBQVc7QUFDbFUsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sMkJBQTJCO0FBRWxDLFNBQVMsNkJBQTZCO0FBRXRDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxFQUNOLFNBQVMsQ0FBQyxjQUFjLEdBQUcsS0FBSyxHQUFHLE1BQU0sR0FBRyxzQkFBc0IsQ0FBQztBQUFBLEVBRW5FLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxNQUNWLE9BQU87QUFBQSxNQUNQLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsTUFDQSx5QkFBeUI7QUFBQSxJQUMzQjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
