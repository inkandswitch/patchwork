import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    workspace: [
      "packages/refs",
      "packages/annotations/core",
      "packages/annotations/context",
    ],
  },
});



