import { defineConfig, UserConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
  },
} satisfies UserConfig);
