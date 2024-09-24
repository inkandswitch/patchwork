import { defineConfig } from "vitest/config";
import * as path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../os/src"), // Adjust './src' as needed
    },
    preserveSymlinks: true,
  },
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["lcov", "text", "html"],
      include: ["test"],
    },
  },
});
