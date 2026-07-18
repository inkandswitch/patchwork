import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    workspace: [
      "core/bootloader",
      "core/filesystem",
      "packages/refs",
      "packages/annotations/core",
      "packages/annotations/context",
      "packages/edge-handles",
    ],
  },
});
